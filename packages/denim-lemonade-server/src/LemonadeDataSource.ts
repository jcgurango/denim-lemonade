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
import { DenimQueryConditionGroup } from '../../denim/core';
import { processDay } from './CalculateAttendance';
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
  `${process.env.PAYDAY_BASE_URL || 'http://localhost:1347'}/api`,
  {
    merchant_id: process.env.PAYDAY_MERCHANT_ID || '',
    merchant_key: process.env.PAYDAY_MERCHANT_KEY || '',
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
    bank_account: employee['Bank Account'] || '',
    date_hired: employee['Entry Date'],
    start_date: employee['Entry Date'],
    regularization_date: employee['Regularization Date'],
    mobile_no: employee['Mobile Number'] || 'n/a',
    telephone_no: employee['Home Number'] || 'n/a',
    email: employee['Email'] || '',
    nationality: readPaydayId(employee['Nationality'] as DenimRelatedRecord),
    sex: employee['Gender'],
    civil_status: employee['Marital Status'],
    monthly_rate: employee['Basic Pay']
      ? (employee['Pay Basis'] as DenimRelatedRecord)?.name === 'Daily'
        ? ((employee['Basic Pay'] as any) *
            ((employee['Days of Work Per Year'] as DenimRelatedRecord)
              ?.name as any)) /
          12
        : employee['Basic Pay']
      : 0,
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
      if (e.loggable) {
        let response = await (e.inner?.text?.() || 'n/a');
        const log = `${e.message}\nENDPOINT: ${
          e.endpoint
        }\n\nHEADERS:\n${Object.keys(e.headers)
          .map((header) => `${header}: ${e.headers[header]}`)
          .join('\n')}\n\nDATA: ${JSON.stringify(
          e.data
        )}\n\nRESPONSE: ${response}`;
        console.log(
          `EMPLOYEE SYNC ERROR: ${id} ${record['Employee ID']}\n${log}`
        );

        // Look for a record with this key.
        const [logRecord] = await LemonadeDataSource.retrieveRecords(
          'Sync Logs',
          {
            conditions: {
              conditionType: 'group',
              type: 'AND',
              conditions: [
                {
                  conditionType: 'single',
                  field: 'Key',
                  operator: DenimQueryOperator.Equals,
                  value: 'LEMONADE-PAY-SYNC',
                },
                {
                  conditionType: 'single',
                  field: 'Employee Record ID',
                  operator: DenimQueryOperator.Equals,
                  value: id,
                },
              ],
            },
          }
        );

        if (logRecord) {
          await LemonadeDataSource.updateRecord(
            'Sync Logs',
            logRecord.id || '',
            {
              Error: log,
            }
          );
        } else {
          await LemonadeDataSource.createRecord('Sync Logs', {
            Key: 'LEMONADE-PAY-SYNC',
            Employee: {
              type: 'record',
              id,
            },
            Error: log,
          });
        }
      } else {
        console.error(e);
      }
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
  {
    name: 'laborHoursReport',
    inputs: [],
  },
];

(LemonadeDataSource as any).laborHoursReport = async (
  input: DenimRecord,
  context: DenimWorkflowContext
) => {
  const exportRows = await LemonadeDataSource.retrieveRecords(
    'AttendanceExport',
    {
      retrieveAll: true,
    }
  );

  const perEmployeeSummaries: any = {};

  exportRows.forEach((row) => {
    if (!perEmployeeSummaries[String(row.employee_id)]) {
      perEmployeeSummaries[String(row.employee_id)] = {
        ...row,
      };

      delete perEmployeeSummaries[String(row.employee_id)].Date;
    } else {
      Object.keys(row).forEach((key) => {
        if (typeof row[key] === 'number' && key !== 'payroll_period_id') {
          perEmployeeSummaries[String(row.employee_id)][key] += row[key];
        }
      });
    }
  });

  context.resultingAction = {
    $action: 'result',
    result: perEmployeeSummaries,
  };
};

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

  const allEmployees = await LemonadeDataSource.retrieveRecords('Employee', {
    retrieveAll: true,
    conditions: {
      conditionType: 'group',
      type: 'AND',
      conditions: [
        {
          conditionType: 'single',
          field: 'Payroll Group ID',
          operator: DenimQueryOperator.Equals,
          value: (periodInput?.record?.Grouping as any)?.id,
        },
        /* Comment for all employees */
        ...(departmentsInput?.records?.length
          ? [
              {
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
              } as DenimQueryConditionGroup,
            ]
          : []),
          ...(employeesInput?.records?.length
            ? [
                {
                  conditionType: 'group',
                  type: 'OR',
                  conditions: employeesInput.records.map(({ id }) => {
                    return {
                      conditionType: 'single',
                      field: 'id',
                      operator: DenimQueryOperator.Equals,
                      value: id,
                    };
                  }),
                } as DenimQueryConditionGroup,
              ]
            : []),
        /* Until here */
      ],
    },
    expand: ['Pay Basis'],
  });

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

  /*
  const airtableAttendanceData = await LemonadeDataSource.retrieveRecords(
    'Attendance',
    {
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
    }
  );
  */

  const convertedLarkAttendance = convertDailyAttendance(larkAttendanceData);

  const attendanceData = [...convertedLarkAttendance];

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

  // Retrieve overtime rules from Lark.
  const overtimeRules = await attendance.retrieveOvertimeRules();
  const holidays = overtimeRules
    .reduce((current: any[], rule: any) => {
      return current.concat(
        ...rule.subRule.map((subRule: any) => {
          const { subRule: subRules, ...parentRule } = rule;

          return {
            ...subRule,
            parentRule,
          };
        })
      );
    }, [])
    .reduce((current: any[], subRule: any) => {
      return current.concat(
        ...subRule.specialDate.map((specialDate: any) => {
          const { specialDate: specialDates, parentRule } = subRule;

          return {
            ...specialDate,
            parentRule,
          };
        })
      );
    }, [])
    .reduce((current: any[], rule: any) => {
      return current.concat({
        ...rule,
        id: rule.name,
      });
    }, []);

  const holidayTypesByDate: { [key: string]: string } = {};
  holidays.forEach((record: any) => {
    const holiday = {
      'Holiday Name': record.name,
      Date: record.date[0],
      'End Date': record.date[1],
      'Holiday Type':
        record.name.indexOf('SWH') === 0 || record.name.indexOf('SNH') === 0
          ? 'Special'
          : 'Legal',
    };

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
    let calculated: any = null;
    const existingRow = exportRows[i];

    if (attendanceData[i]) {
      const employee = allEmployees.find(
        (record) => record['Employee ID'] === attendanceData[i]['Employee ID']
      );

      calculated = processDay(
        attendanceData[i],
        periodInput.id,
        holidayTypesByDate[String(attendanceData[i].Date)] as any,
        (employee?.['Pay Basis'] as DenimRelatedRecord)?.name
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
