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
import { LemonadeValidations } from '../../denim-lemonade/src/validation';
import { CalculateAttendance } from './CalculateAttendance';
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

/*
{
  id: 'recRcikjjU1emtvAo',
  'Last Name': 'Gurango',
  'First Name': 'JC',
  'Middle Name': 'M',
  'Leave Balance': 'c6565159',
  Title: 'Mr.',
  Gender: 'Male',
  'Date of Birth': '2020-04-04',
  Nationality: {
    type: 'record',
    id: 'recqYp2eJbHCeYRAf',
    name: 'Filipino',
    record: {
      id: 'recqYp2eJbHCeYRAf',
      Name: 'Filipino',
      'PDY ID': 1,
      Employee: [Object]
    }
  },
  Citizenship: 'American',
  'Employee ID': 'FT-1916',
  City: 'Quezon City',
  Country: 'US',
  'Marital Status': 'Married',
  'Entry Date': '2021-04-13',
  'Phone Number Visibility': true,
  'Account Status': {
    type: 'record',
    id: 'recaWk5zEvcZFPZjA',
    name: 'Active',
    record: {
      id: 'recaWk5zEvcZFPZjA',
      Name: 'Active',
      Employee: [Object],
      'PDY ID': 1
    }
  },
  Email: 'dummy@jcgurango.com',
  Nickname: 'JC Gurango',
  'PDY ID': 10429,
  'Basic Pay': 200000,
  'Employee Allowance': {
    type: 'record-collection',
    records: [ [Object], [Object], [Object] ]
  },
  'Leave Scheme': { type: 'record', id: 'rec7y4loJ5hslLWPd', name: '' },
  'Daily Work Hours': 8,
  'Job Title': { type: 'record-collection', records: [ [Object] ] },
  'Lark ID': 'ou_06d5492523bb9b219103e00d5d22cbc7',
  Department: { type: 'record', id: 'recaYSYOokpp177KM', name: '' },
  'Is HR Admin': true,
  'Is HR User': true,
  Attendance: { type: 'record-collection', records: [ [Object] ] },
  'E-Cola': 0,
  'Payment Method': {
    type: 'record',
    id: 'reckfc9zcAqvhAn4W',
    name: 'Bank',
    record: {
      id: 'reckfc9zcAqvhAn4W',
      Name: 'Bank',
      Employee: [Object],
      'PDY ID': 1
    }
  },
  'Days of Work Per Year': {
    type: 'record',
    id: 'recn6Fch3ttWepegK',
    name: '261',
    record: {
      id: 'recn6Fch3ttWepegK',
      Name: '261',
      Employee: [Object],
      'PDY ID': 2
    }
  },
  'Payroll Grouping': {
    type: 'record',
    id: 'recr7IcMkbzEZYfEz',
    name: 'Default',
    record: {
      id: 'recr7IcMkbzEZYfEz',
      Name: 'Default',
      Employee: [Object],
      'PDY ID': 2
    }
  },
  Workplace: { type: 'record', id: 'rece1Ho3R05DPGart', name: '' },
  'Employment Status': {
    type: 'record',
    id: 'recsdbTIduecYm7GF',
    name: 'Regular',
    record: {
      id: 'recsdbTIduecYm7GF',
      Name: 'Regular',
      Employee: [Object],
      'PDY ID': 2
    }
  },
  'Wage Zone': {
    type: 'record',
    id: 'recnjovqVN5FAaThi',
    name: 'NCR',
    record: {
      id: 'recnjovqVN5FAaThi',
      REGION: 'NCR',
      Employee: [Object],
      'Minimum Wage': 537,
      'PDY ID': 2,
      Description: 'National Capital Region'
    }
  },
  Company: {
    type: 'record',
    id: 'rec5QOhfo69dQMPGx',
    name: 'STC',
    record: {
      id: 'rec5QOhfo69dQMPGx',
      CODE: 'STC',
      Workplaces: [Object],
      'Fax Number': '(02)-1234-1234',
      'PDY ID': 2,
      'Mobile Number': '+639123456789',
      'Company Name': 'Servio Technologies',
      Employee: [Object]
    }
  },
  'Full Name': 'Gurango, JC M',
  'User ID': 'FT-1916 - Gurango, JC M',
  'Created By': {
    id: 'usrTa9JILlFixnXoM',
    email: '63.000@joeygurango.com',
    name: 'Jerome Dominic Junio'
  },
  'Date Created': '2020-10-27T22:37:35.000Z',
  'Last Modified By': {
    id: 'usrkDpK8KPgVppPlo',
    email: '5.000@joeygurango.com',
    name: 'JC Gurango'
  },
  'Last Modified': '2021-05-07T07:06:13.000Z',
  Calculation: 'recRcikjjU1emtvAo'
}
*/

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
const syncPaydayEmployee = async (record: DenimRecord, table: string, id: string) => {
  let pdid: string | null = String(record['Employee ID']);

  try {
    await LemonadeDataSource.retrieveRecord('pdy-employees', pdid);
  } catch (e) {
    pdid = null;
  }

  // Retrieve the record.
  const hydratedRecord = await LemonadeDataSource.retrieveRecord(
    table,
    id,
    [
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
    ]
  );

  if (hydratedRecord) {
    const paydayRecord = mapLemonadeEmployeeToPayDay(hydratedRecord);

    if (pdid) {
      await paydayData.updateEmployee(
        pdid,
        paydayRecord
      );
    } else {
      await paydayData.createEmployee(
        paydayRecord
      );
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
  context: DenimWorkflowContext
) => {
  const periodInput = input.period as DenimRelatedRecord;
  const departmentsInput = input.departments as DenimRelatedRecordCollection;
  const employeesInput = input.employees as DenimRelatedRecordCollection;

  // Retrieve the period.
  const period = await LemonadeDataSource.retrieveRecord(
    'payroll-periods',
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

  const attendanceData = convertDailyAttendance(
    await attendance.retrieveAttendance(
      new Date(String(period.Start)),
      new Date(String(period.End)),
      ids
    )
  );

  const holidays = await LemonadeDataSource.retrieveRecords(
    'Holiday Calendar',
    {
      retrieveAll: true,
    }
  );
  const holidayTypesByDate: { [key: string]: string } = {};

  holidays.forEach((holiday) => {
    holidayTypesByDate[String(holiday.Date)] = String(holiday['Holiday Type']);
  });

  const exportRows = await LemonadeDataSource.retrieveRecords(
    'AttendanceExport',
    {
      retrieveAll: true,
    }
  );

  for (let i = 0; i < attendanceData.length || i < exportRows.length; i++) {
    const calculated = attendanceData[i]
      ? CalculateAttendance(
          attendanceData[i],
          periodInput.id,
          holidayTypesByDate[attendanceData[i].Date]
        )
      : null;
    const existingRow = exportRows[i];

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

larkAdmin.init();

export default LemonadeDataSource;
