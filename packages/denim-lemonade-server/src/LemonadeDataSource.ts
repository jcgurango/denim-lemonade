import {
  DenimColumnType,
  DenimQueryOperator,
  DenimRecord,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
  DenimCombinedDataSourceV2,
  DenimWorkflowContext,
} from 'denim';
import { AirTableDataSourceV2 } from 'denim-airtable';
import moment from 'moment';
import { LemonadeValidations } from '../../denim-lemonade/src/validation';
import CalculateAttendance from './attendance-calculation/Calculate';
import PaydayDataSource from './PaydayDataSource';

const larkAdmin = require('lark-airtable-connector/src/services/lark-admin');
const attendance =
  require('lark-airtable-connector/src/services/retrievers/attendance-retriever')(
    larkAdmin
  );
const {
  dailyAttendanceToAirTable: { multiple: convertDailyAttendance },
} = require('lark-airtable-connector/src/services/mappers');

const coreData = new AirTableDataSourceV2(
  String(process.env.CORE_BASE_ID),
  require('../../denim-lemonade/src/schema/airtable-schema.json')
);

const movementData = new AirTableDataSourceV2(
  String(process.env.MOVEMENT_BASE_ID),
  require('../../denim-lemonade/src/schema/airtable-movement-schema.json')
);

const timekeepingData = new AirTableDataSourceV2(
  String(process.env.TIMEKEEPING_BASE_ID),
  require('../../denim-lemonade/src/schema/airtable-timekeeping-schema.json')
);

const paydayData = new PaydayDataSource(
  'https://pd-lemonade.jcgurango.com/api',
  {
    merchant_id: 'l3m0n4d3_mId',
    merchant_key: 'bGVtb25hZGVfbWs=',
  }
);

const LemonadeDataSource = new DenimCombinedDataSourceV2(
  coreData,
  movementData,
  timekeepingData,
  paydayData
);

LemonadeValidations(LemonadeDataSource);

const readPaydayId = (value: DenimRelatedRecord): number | null => {
  return (value && value.record && Number(value.record['PDY ID'])) || null;
};

const mapLemonadeEmployeeToPayDay = (employee: DenimRecord): DenimRecord => {
  return {
    employee_id: employee['Employee ID'],
    last_name: employee['Last Name'],
    first_name: employee['First Name'],
    middle_name: employee['Middle Name'],
    birthdate: employee['Date of Birth'],
    pagibig: employee['Pag-ibig Number'],
    phil_health: employee['Philhealth Number'],
    sss: employee['SSS Number'],
    tax_id: employee['Tax Identification Number'],
    company: readPaydayId(employee['Company'] as DenimRelatedRecord),
    location: readPaydayId(employee['Workplace'] as DenimRelatedRecord),
    wage: readPaydayId(employee['Wage Zone'] as DenimRelatedRecord),
    employment_status: readPaydayId(
      employee['Employment Status'] as DenimRelatedRecord
    ),
    job_status: readPaydayId(employee['Account Status'] as DenimRelatedRecord),
    days_per_year: readPaydayId(
      employee['Days of Work Per Year'] as DenimRelatedRecord
    ),
    pay_basis: readPaydayId(employee['Pay Basis'] as DenimRelatedRecord),
    basic_rate: employee['Basic Pay'],
    ecola: employee['E-Cola'],
    grouping: readPaydayId(employee['Payroll Grouping'] as DenimRelatedRecord),
    payment_method: readPaydayId(
      employee['Payment Method'] as DenimRelatedRecord
    ),
    bank_account: employee['Bank Account'],
    date_hired: employee['Entry Date'],
    start_date: employee['Entry Date'],
    regularization_date: employee['Regularization Date'],
    mobile_no: employee['Mobile Number'],
    telephone_no: employee['Home Number'],
    email: employee['Email'],
    nationality: readPaydayId(employee['Nationality'] as DenimRelatedRecord),
    sex: employee['Gender'],
    civil_status: employee['Marital Status'],
    monthly_rate: 0,
    basic_adjustment: 0,
  };
};
const syncPaydayEmployee = async (
  record: DenimRecord,
  table: string,
  id: string
) => {
  let pdid: string | null = String(record['Employee ID']);

  try {
    await LemonadeDataSource.retrieveRecord('pdy-employees', pdid);
  } catch (e) {
    pdid = null;
  }

  // Retrieve the record.
  const hydratedRecord = await LemonadeDataSource.retrieveRecord(table, id, [
    'Nationality',
    'Account Status',
    'Payment Method',
    'Days of Work Per Year',
    'Payroll Grouping',
    'Employment Status',
    'Wage Zone',
    'Company',
    'Workplace',
    'Pay Basis',
  ]);

  if (hydratedRecord) {
    const paydayRecord = mapLemonadeEmployeeToPayDay(hydratedRecord);

    if (pdid) {
      await paydayData.updateEmployee(pdid, paydayRecord);
    } else {
      await paydayData.createEmployee(paydayRecord);
    }
  }
};

LemonadeDataSource.registerHook({
  table: 'Employee',
  type: 'post-update',
  callback: async (table, id, record, oldRecord) => {
    try {
      await syncPaydayEmployee(record, table, id);
    } catch (e) {
      console.error(e);
    }

    return [id, record, oldRecord];
  },
});

LemonadeDataSource.registerHook({
  table: 'Employee',
  type: 'post-create',
  callback: async (table, record) => {
    try {
      await syncPaydayEmployee(record, table, record.id || '');
    } catch (e) {
      console.error(e);
    }

    return [record];
  },
});

LemonadeDataSource.schema.workflows = [
  {
    name: 'laborHours',
    inputs: [
      {
        name: 'period',
        label: 'Payroll Period',
        type: DenimColumnType.ForeignKey,
        properties: {
          foreignTableId: 'pdy-payroll-periods',
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
  context: DenimWorkflowContext
) => {
  const periodInput = input.period as DenimRelatedRecord;
  const departmentsInput = input.departments as DenimRelatedRecordCollection;
  const employeesInput = input.employees as DenimRelatedRecordCollection;

  // Retrieve the period.
  const period = await LemonadeDataSource.retrieveRecord(
    'pdy-payroll-periods',
    periodInput.id
  );

  if (!period) {
    throw new Error('Unknown period.');
  }

  let allEmployees = await LemonadeDataSource.findById(
    'Employee',
    undefined,
    ...(employeesInput?.records?.map(({ id }) => id) || [])
  );

  // Retrieve all users from the department.
  if (departmentsInput?.records?.length) {
    const otherEmployees = await LemonadeDataSource.retrieveRecords(
      'Employee',
      {
        retrieveAll: true,
        /* Comment for all employees */
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
        /* Until here */
      }
    );

    allEmployees = allEmployees.concat(...otherEmployees);
  }

  const ids: string[] = [];

  for (let i = 0; i < allEmployees.length; i++) {
    const users = await attendance.retrieveAttendanceUsers(
      allEmployees[i].Email
    );

    if (users.length) {
      ids.push(users[0].LarkId);
    }
  }

  const larkAttendanceData = await attendance.retrieveAttendance(
    new Date(String(period.Start)),
    new Date(String(period.End)),
    ids
  );

  const airtableAttendanceData = await LemonadeDataSource.retrieveRecords('Attendance', {
    retrieveAll: true,
    conditions: {
      conditionType: 'group',
      type: 'AND',
      conditions: [
        {
          conditionType: 'single',
          field: 'Date',
          operator: DenimQueryOperator.GreaterThanOrEqual,
          value: period.Start,
        },
        {
          conditionType: 'single',
          field: 'Date',
          operator: DenimQueryOperator.LessThanOrEqual,
          value: period.End,
        },
        {
          conditionType: 'group',
          type: 'OR',
          conditions: allEmployees.map(({ ['Employee ID']: value }) => ({
            conditionType: 'single',
            field: 'Employee ID',
            operator: DenimQueryOperator.Equals,
            value,
          })),
        },
      ],
    },
  });

  const attendanceData = convertDailyAttendance(
    [
      ...larkAttendanceData,
      ...airtableAttendanceData,
    ]
  );

  /* Uncomment to test import into AirTable:
  for (let i = 0; i < attendanceData.length; i++) {
    const { ID, ['Employee ID']: id, ...rest } = attendanceData[i];
    const record = allEmployees.find(({ ['Employee ID']: eid }) => eid === id);

    await LemonadeDataSource.createRecord('Attendance', {
      ...rest,
      Employee: record?.id ? {
        type: 'record',
        id: record?.id,
      } : record?.id,
    });
  }
  */

  const holidays = await LemonadeDataSource.retrieveRecords(
    'Holiday Calendar',
    {
      retrieveAll: true,
    }
  );
  const holidayTypesByDate: { [key: string]: string } = {};

  holidays.forEach((holiday) => {
    const dates = [String(holiday.Date)];

    if (holiday['End Date']) {
      for (
        let date = moment(String(holiday.Date)).add(1, 'day');
        date.isSameOrBefore(String(holiday['End Date']));
        date = date.add(1, 'day')
      ) {
        dates.push(date.format('YYYY-MM-DD'));
      }
    }

    dates.forEach((date) => {
      holidayTypesByDate[date] = String(holiday['Holiday Type']);
    });
  });

  const exportRows = await LemonadeDataSource.retrieveRecords(
    'AttendanceExport',
    {
      retrieveAll: true,
    }
  );

  for (let i = 0; i < attendanceData.length || i < exportRows.length; i++) {
    const calculated = attendanceData[i]
      ? {
          employee_id: '',
          payroll_period_id: 0,
          Date: '1999-01-01',
          payroll_days: 0.0,
          absences: 0.0,
          leaves: 0.0,
          holidays: 0.0,
          part_time: 0.0,
          late: 0.0,
          undertime: 0.0,
          reg_np: 0.0,
          reg_ot: 0.0,
          reg_ot_np: 0.0,
          reg_ot_ex: 0.0,
          reg_ot_ex_np: 0.0,
          leg_ot: 0.0,
          leg_ot_np: 0.0,
          leg_ot_ex: 0.0,
          leg_ot_ex_np: 0.0,
          sp_ot: 0.0,
          sp_ot_np: 0.0,
          sp_ot_ex: 0.0,
          sp_ot_ex_np: 0.0,
          rst_ot: 0.0,
          rst_ot_np: 0.0,
          rst_ot_ex: 0.0,
          rst_ot_ex_np: 0.0,
          leg_rst_ot: 0.0,
          leg_rst_ot_np: 0.0,
          leg_rst_ot_ex: 0.0,
          leg_rst_ot_ex_np: 0.0,
          sp_rst_ot: 0.0,
          sp_rst_ot_np: 0.0,
          sp_rst_ot_ex: 0.0,
          sp_rst_ot_ex_np: 0.0,
          allowance_1: 0.0,
          allowance_2: 0.0,
          allowance_3: 0.0,
          allowance_4: 0.0,
          allowance_5: 0.0,
          allowance_6: 0.0,
          allowance_7: 0.0,
          allowance_8: 0.0,
          allowance_9: 0.0,
          allowance_10: 0.0,
          allowance_11: 0.0,
          allowance_12: 0.0,
        }
      : null;
    const existingRow = exportRows[i];

    if (attendanceData[i]) {
      CalculateAttendance(
        {
          createdAttendance: calculated,
          fields: {
            ...attendanceData[i],
            'Period ID': attendanceData[i]['Period ID'] || '',
          },
        },
        holidayTypesByDate[String(attendanceData[i].Date)]
      );
    }

    // If a row already exists at this position, update it.
    if (calculated && existingRow) {
      await LemonadeDataSource.updateRecord(
        'AttendanceExport',
        existingRow.id || '',
        calculated
      );
    }

    // If there's more rows than needed, delete them.
    if (!calculated && existingRow) {
      await LemonadeDataSource.deleteRecord(
        'AttendanceExport',
        existingRow.id || ''
      );
    }

    // If there's not enough rows, create them.
    if (calculated && !existingRow) {
      await LemonadeDataSource.createRecord('AttendanceExport', calculated);
    }
  }
};

export default LemonadeDataSource;
