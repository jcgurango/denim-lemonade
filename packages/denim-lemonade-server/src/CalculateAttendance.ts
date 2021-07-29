export type DailyAttendanceRecord = {
  ID: string;
  Date: string;
  'Employee ID': string;
  'Required Duration': number;
  'Actual Duration': number;
  'Overtime Hours': number;
  'Late Time': number;
  'Leave Time': number;
  'Leave Type': string | null | undefined;
  'Shift Time In': number | null;
  'Shift Time Out': number | null;
  'First In'?: number | null;
  'Last Out'?: number | null;
};

/*
const testSet = [
  {
    ID: 'FTE-1617-20210702',
    Date: '2021-07-02',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 28800,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-1617-20210703',
    Date: '2021-07-03',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 36000,
    'Overtime Hours': 2,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 72000,
  },
  {
    ID: 'FTE-1617-20210704',
    Date: '2021-07-04',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 0,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 8,
    'Leave Type': '🤒 Sick leave',
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': null,
    'Last Out': null,
  },
  {
    ID: 'FTE-1617-20210705',
    Date: '2021-07-05',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 28800,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-1617-20210706',
    Date: '2021-07-06',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 36000,
    'Overtime Hours': 2,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 72000,
  },
  {
    ID: 'FTE-1617-20210707',
    Date: '2021-07-07',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 36000,
    'Overtime Hours': 2,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 72000,
  },
  {
    ID: 'FTE-1617-20210708',
    Date: '2021-07-08',
    'Employee ID': 'FTE-1617',
    'Required Duration': 28800,
    'Actual Duration': 28800,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-1617-20210712',
    Date: '2021-07-12',
    'Employee ID': 'FTE-1617',
    'Required Duration': 0,
    'Actual Duration': 32400,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 32400,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-1617-20210713',
    Date: '2021-07-13',
    'Employee ID': 'FTE-1617',
    'Required Duration': 0,
    'Actual Duration': 32400,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 32400,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-1617-20210714',
    Date: '2021-07-14',
    'Employee ID': 'FTE-1617',
    'Required Duration': 0,
    'Actual Duration': 39600,
    'Overtime Hours': 2,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 32400,
    'Last Out': 72000,
  },
  {
    ID: 'FTE-1617-20210715',
    Date: '2021-07-15',
    'Employee ID': 'FTE-1617',
    'Required Duration': 0,
    'Actual Duration': 43200,
    'Overtime Hours': 3,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 32400,
    'Last Out': 75600,
  },
  {
    ID: '-20210709',
    Date: '2021-07-09',
    'Employee ID': '',
    'Required Duration': 28800,
    'Actual Duration': 28800,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 64800,
    'Shift Time Out': 8640,
    'First In': 64800,
    'Last Out': 7200,
  },
  {
    ID: '-20210712',
    Date: '2021-07-12',
    'Employee ID': '',
    'Required Duration': 28800,
    'Actual Duration': 0,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 32400,
    'Last Out': null,
  },
  {
    ID: '-20210711',
    Date: '2021-07-11',
    'Employee ID': '',
    'Required Duration': 28800,
    'Actual Duration': 27300,
    'Overtime Hours': 0,
    'Late Time': 25,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': 32400,
    'Shift Time Out': 64800,
    'First In': 33900,
    'Last Out': 64800,
  },
  {
    ID: 'FTE-0007-20210719',
    Date: '2021-07-19',
    'Employee ID': 'FTE-0007',
    'Required Duration': 0,
    'Actual Duration': 39660,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 32940,
    'Last Out': 72600,
  },
  {
    ID: 'FTE-0007-20210721',
    Date: '2021-07-21',
    'Employee ID': 'FTE-0007',
    'Required Duration': 0,
    'Actual Duration': 46380,
    'Overtime Hours': 0,
    'Late Time': 0,
    'Leave Time': 0,
    'Leave Type': null,
    'Shift Time In': null,
    'Shift Time Out': null,
    'First In': 52740,
  },
];

const holidays = {
  '2021-07-12': 'Special',
  '2021-02-11': 'Legal',
  '2021-02-12': 'Legal',
  '2021-02-13': 'Legal',
  '2021-02-14': 'Legal',
  '2021-02-15': 'Legal',
  '2021-02-16': 'Legal',
  '2021-02-17': 'Legal',
  '2021-07-14': 'Special',
  '2021-04-13': 'Legal',
  '2021-07-05': 'Special',
  '2021-09-19': 'Legal',
  '2021-09-20': 'Legal',
  '2021-09-21': 'Legal',
  '2021-07-06': 'Special',
  '2021-04-03': 'Legal',
  '2021-04-04': 'Legal',
  '2021-04-05': 'Legal',
  '2021-06-11': 'Legal',
  '2021-07-18': 'Special',
  '2021-07-10': 'Legal',
  '2021-07-08': 'Legal',
  '2021-07-15': 'Legal',
  '2021-05-07': 'Special',
  '2021-01-01': 'Legal',
  '2021-01-02': 'Legal',
  '2021-01-03': 'Legal',
  '2021-06-12': 'Legal',
  '2021-06-13': 'Legal',
  '2021-06-14': 'Legal',
  '2021-10-01': 'Legal',
  '2021-10-02': 'Legal',
  '2021-10-03': 'Legal',
  '2021-10-04': 'Legal',
  '2021-10-05': 'Legal',
  '2021-10-06': 'Legal',
  '2021-10-07': 'Legal',
  '2021-07-13': 'Legal',
  '2021-07-17': 'Legal',
  '2021-05-06': 'Special',
  '2021-05-04': 'Legal',
  '2021-07-09': 'Special',
  '2021-05-03': 'Legal',
  '2021-05-01': 'Legal',
  '2021-05-02': 'Legal',
  '2021-05-05': 'Legal',
  '2021-04-01': 'Legal',
  '2021-07-07': 'Legal',
  '2021-07-16': 'Special',
  '2021-07-19': 'Legal',
};
*/

export const processDay = (
  day: DailyAttendanceRecord,
  payrollPeriod: String,
  holidayType?: 'Special' | 'Legal' | null
) => {
  // 10 PM in seconds from 12 AM
  const nightDiffStart = 22 * 60 * 60;

  // 6 AM the next day in seconds from 12 AM
  const nightDiffEnd = 30 * 60 * 60;

  const record = {
    ...day,
  };

  if (
    record['First In'] &&
    record['Last Out'] &&
    record['Last Out'] < record['First In']
  ) {
    // Last out should be pushed to next day.
    record['Last Out'] += 24 * 60 * 60;
  }

  const hoursComputation = {
    employee_id: day['Employee ID'],
    payroll_period_id: payrollPeriod,
    Date: day.Date,
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
  };

  // Check if it's a rest day.
  const isRestDay = !day['Required Duration'];

  if (isRestDay) {
    // Subtract 1 hour from the actual duration for break.
    if (record['Actual Duration'] >= 60 * 60 * 9) {
      record['Actual Duration'] -= 60 * 60;
    }

    // Recalculate overtime as excess duration over 8 hours.
    record['Overtime Hours'] =
      (record['Actual Duration'] - 60 * 60 * 8) / 60 / 60;
  }

  const payrollDays =
    (record['Actual Duration'] - record['Overtime Hours'] * 60 * 60) /
    60 /
    60 /
    8;

  // Calculate the amount of minutes they spent in night differential.
  let npMinutes = 0;
  let npOtMinutes = 0;

  if (record['First In'] && record['Last Out']) {
    npMinutes =
      Math.min(nightDiffEnd, record['Last Out']) -
      Math.max(record['First In'], nightDiffStart);

    // Calculate night differential OT time (last out - OT hours = start of OT)
    npOtMinutes =
      Math.min(nightDiffEnd, record['Last Out']) -
      Math.max(
        record['Last Out'] - record['Overtime Hours'] * 60,
        nightDiffStart
      );

    // Some negatives may occur, negatives should be normalized to 0.
    npMinutes = Math.max(0, npMinutes) / 60;
    npOtMinutes = Math.max(0, npOtMinutes) / 60;
  }

  let prefix = holidayType ? (holidayType === 'Special' ? 'sp_' : 'leg_') : '';

  if (isRestDay) {
    prefix += 'rst_';
  }

  if (prefix) {
    (hoursComputation as any)[prefix + 'ot'] = payrollDays * 8;
    (hoursComputation as any)[prefix + 'ot_np'] = Math.round(npMinutes / 60);
    (hoursComputation as any)[prefix + 'ot_ex'] = Math.round(record['Overtime Hours']);
    (hoursComputation as any)[prefix + 'ot_ex_np'] = Math.round(npOtMinutes / 60);
  } else {
    hoursComputation.payroll_days = payrollDays;
    hoursComputation.reg_ot = Math.round(record['Overtime Hours']);
    hoursComputation.reg_np = Math.round(npMinutes / 60);
    hoursComputation.reg_ot_np = Math.round(npOtMinutes / 60);
  }

  hoursComputation.leaves = record['Leave Time'];
  hoursComputation.late = record['Late Time'] / 60;

  if (record['Actual Duration'] > 0) {
    hoursComputation.undertime = Math.max(
      (record['Required Duration'] - record['Actual Duration']) / 60 / 60 -
        hoursComputation.late,
      0
    );
  }

  // Anything else would be considered an absence.
  hoursComputation.absences = Math.max(
    0,
    (record['Required Duration'] - record['Actual Duration']) / 60 / 60 -
      hoursComputation.late -
      hoursComputation.undertime -
      hoursComputation.leaves
  );

  return hoursComputation;
};

/*
for (let i = 0; i < testSet.length; i++) {
  const item = testSet[i];
  const processed = processDay(item, '1', (holidays as any)[String(item.Date)]);

  console.log(
    Object.keys(processed)
      .filter((key) => (processed as any)[key])
      .map((key) => {
        return `${key}: ${(processed as any)[key]}`;
      })
      .join('\n'),
    '\n'
  );
}
*/
