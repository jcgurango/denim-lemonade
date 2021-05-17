import { DenimRecord } from '../denim/core';

export const CalculateAttendance = (
  record: DenimRecord,
  periodId: string,
  holiday?: string,
) => {
  const createdAttendance = {
    employee_id: '',
    payroll_period_id: '0',
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
  };

  let sTimeIn = record['Shift Time In']
    ? Number(record['Shift Time In']) / 3600
    : 0;
  let sTimeOut = record['Shift Time Out']
    ? Number(record['Shift Time Out']) / 3600
    : 0;
  let fTimeIn = record['First In'] ? Number(record['First In']) / 3600 : 0;
  let lTimeOut = record['Last Out'] ? Number(record['Last Out']) / 3600 : 0;
  let sOvertime = record['Overtime Hours']
    ? Number(record['Overtime Hours']) / 3600
    : 0;
  let sNightDiff = 0;

  //Set holiday and overtime
  if (holiday === 'Special') {
    createdAttendance.holidays = 8;
    createdAttendance.sp_ot = sOvertime;
  } else if (holiday === 'Legal') {
    createdAttendance.holidays = 8;
    createdAttendance.leg_ot = sOvertime;
  } else {
    createdAttendance.reg_ot = sOvertime;
  }
  //Set Period ID
  createdAttendance.payroll_period_id = periodId;

  //Calculate record if the employee has a login/out and required work day
  if (!record['Not Required'] && !record['No Record']) {
    //Calculate Undertime
    Number(record['Actual Duration']) < Number(record['Required Duration'])
      ? (createdAttendance.undertime = sTimeOut - lTimeOut)
      : (createdAttendance.undertime = 0);
    //Calculate Late
    Number(record['Actual Duration']) < Number(record['Required Duration'])
      ? (createdAttendance.late = fTimeIn - sTimeIn)
      : (createdAttendance.late = 0);

    //Calculate Night Differential
    if (lTimeOut > fTimeIn) {
      sNightDiff = lTimeOut >= 22 ? lTimeOut - 22 : 0;
    } else if (lTimeOut < sTimeIn) {
      if (lTimeOut <= 6 && fTimeIn <= 22) {
        sNightDiff = lTimeOut + 2;
      } else if (lTimeOut <= 6 && fTimeIn > 22) {
        sNightDiff = lTimeOut + (24 - fTimeIn);
      } else if (lTimeOut >= 6 && fTimeIn <= 22) {
        sNightDiff = 8;
      } else if (lTimeOut >= 6 && fTimeIn > 22) {
        sNightDiff = 6 + (24 - fTimeIn);
      }
    }
  }
  //Set Employee ID
  record['Employee ID']
    ? (createdAttendance.employee_id = String(record['Employee ID']))
    : (createdAttendance.employee_id = '');
  //Set Date
  record['Date']
    ? (createdAttendance.Date = String(record['Date']))
    : (createdAttendance.Date = '2021-03-30');
  //Set the Night Differential
  createdAttendance.reg_np = sNightDiff;
  //Set the absent hours
  record['No Record'] && !record['Not Required']
    ? (createdAttendance.absences = 8)
    : (createdAttendance.absences = 0);
  //Set the leave hours
  record['Leave Time']
    ? (createdAttendance.leaves = Number(record['Leave Time']) / 3600)
    : (createdAttendance.leaves = 0);

  return createdAttendance;
};
