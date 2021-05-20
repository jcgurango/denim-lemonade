import Airtable from 'airtable';
import Base from 'airtable/lib/base';
import { AirTableDataSourceV2 } from 'denim/connectors/airtable';
import {
  DenimColumnType,
  DenimQueryOperator,
  DenimRecord,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
} from 'denim/core';
import { DenimCombinedDataSourceV2, DenimWorkflowContext } from 'denim/service';
import { LemonadeValidations } from '../validation';
import { CalculateAttendance } from './CalculateAttendance';
import PaydayDataSource from './PaydayDataSource';

const larkAdmin = require('lark-airtable-connector/src/services/lark-admin');
const attendance =
  require('lark-airtable-connector/src/services/retrievers/attendance-retriever')(
    larkAdmin,
  );
const {
  dailyAttendanceToAirTable: { multiple: convertDailyAttendance },
} = require('lark-airtable-connector/src/services/mappers');

const coreData = new AirTableDataSourceV2(
  Airtable.base(String(process.env.CORE_BASE_ID)) as any as Base,
  require('../schema/airtable-schema.json'),
);

const movementData = new AirTableDataSourceV2(
  Airtable.base(String(process.env.MOVEMENT_BASE_ID)) as any as Base,
  require('../schema/airtable-movement-schema.json'),
);

const timekeepingData = new AirTableDataSourceV2(
  Airtable.base(String(process.env.TIMEKEEPING_BASE_ID)) as any as Base,
  require('../schema/airtable-timekeeping-schema.json'),
);

const LemonadeDataSource = new DenimCombinedDataSourceV2(
  coreData,
  movementData,
  timekeepingData,
  new PaydayDataSource('https://pd-lemonade.jcgurango.com/api', {
    merchant_id: 'l3m0n4d3_mId',
    merchant_key: 'bGVtb25hZGVfbWs=',
  }),
);

LemonadeValidations(LemonadeDataSource);

LemonadeDataSource.schema.workflows = [
  {
    name: 'laborHours',
    inputs: [
      {
        name: 'period',
        label: 'Payroll Period',
        type: DenimColumnType.ForeignKey,
        properties: {
          foreignTableId: 'payroll-periods',
          multiple: false,
        },
      },
      {
        name: 'departments',
        label: 'Departments',
        type: DenimColumnType.ForeignKey,
        properties: {
          foreignTableId: 'Department',
          multiple: true,
        },
      },
      {
        name: 'employees',
        label: 'Employees',
        type: DenimColumnType.ForeignKey,
        properties: {
          foreignTableId: 'Employee',
          multiple: true,
        },
      },
    ],
  },
];

(LemonadeDataSource as any).laborHours = async (
  input: DenimRecord,
  context: DenimWorkflowContext,
) => {
  const periodInput = input.period as DenimRelatedRecord;
  const departmentsInput = input.departments as DenimRelatedRecordCollection;
  const employeesInput = input.employees as DenimRelatedRecordCollection;

  // Retrieve the period.
  const period = await LemonadeDataSource.retrieveRecord(
    'payroll-periods',
    periodInput.id,
  );

  if (!period) {
    throw new Error('Unknown period.');
  }

  let allEmployees = await LemonadeDataSource.findById(
    'Employee',
    undefined,
    ...(employeesInput?.records?.map(({ id }) => id) || []),
  );

  // Retrieve all users from the department.
  if (departmentsInput?.records?.length) {
    const otherEmployees = await LemonadeDataSource.retrieveRecords(
      'Employee',
      {
        retrieveAll: true,
        conditions: {
          conditionType: 'group',
          type: 'OR',
          conditions: departmentsInput.records.map(({ name }) => {
            return {
              conditionType: 'single',
              field: 'Department',
              operator: DenimQueryOperator.Contains,
              value: name,
            };
          }),
        },
      },
    );

    allEmployees = allEmployees.concat(...otherEmployees);
  }

  const ids: string[] = [];

  for (let i = 0; i < allEmployees.length; i++) {
    const users = await attendance.retrieveAttendanceUsers(
      allEmployees[i].Email,
    );

    if (users.length) {
      ids.push(users[0].LarkId);
    }
  }

  const attendanceData = convertDailyAttendance(
    await attendance.retrieveAttendance(
      new Date(String(period.Start)),
      new Date(String(period.End)),
      ids,
    ),
  );

  const holidays = await LemonadeDataSource.retrieveRecords(
    'Holiday Calendar',
    {
      retrieveAll: true,
    },
  );
  const holidayTypesByDate: { [key: string]: string } = {};

  holidays.forEach((holiday) => {
    holidayTypesByDate[String(holiday.Date)] = String(holiday['Holiday Type']);
  });

  const exportRows = await LemonadeDataSource.retrieveRecords(
    'AttendanceExport',
    {
      retrieveAll: true,
    },
  );

  for (let i = 0; i < attendanceData.length || i < exportRows.length; i++) {
    const calculated = attendanceData[i]
      ? CalculateAttendance(
          attendanceData[i],
          periodInput.id,
          holidayTypesByDate[attendanceData[i].Date],
        )
      : null;
    const existingRow = exportRows[i];

    // If a row already exists at this position, update it.
    if (calculated && existingRow) {
      await LemonadeDataSource.updateRecord(
        'AttendanceExport',
        existingRow.id || '',
        calculated,
      );
    }

    // If there's more rows than needed, delete them.
    if (!calculated && existingRow) {
      await LemonadeDataSource.deleteRecord(
        'AttendanceExport',
        existingRow.id || '',
      );
    }

    // If there's not enough rows, create them.
    if (calculated && !existingRow) {
      await LemonadeDataSource.createRecord('AttendanceExport', calculated);
    }
  }
};

larkAdmin.init();

export default LemonadeDataSource;
