const createMapper = (singleMapper = (obj) => ({ })) => {
  return {
    single: singleMapper,
    multiple: (array) => array.map(singleMapper),
  };
};

const parseDuration = (durationText) => {
  const match = /(\d{2}):(\d{2})/g.exec(durationText);

  if (match) {
    return ((match[1] * 60) + Number(match[2])) * 60;
  }

  return 0;
};

const parseHoursFromText = (text) => {
  const match = /([\d\.\,]+)(mins|hrs|hours|days)/g.exec(text);

  if (match) {
    const [, number, unit] = match;

    if (unit === 'mins') {
      return number / 60;
    }

    if (unit === 'hrs' || unit === 'hours') {
      return Number(number);
    }

    if (unit === 'days') {
      return number * 8;
    }
  }

  return 0;
};

module.exports = {
  // Maps a leave balance record to Lark.
  leaveBalanceToLark: createMapper(({
    fields: {
      'Employee Leave ID': [EmployeeLeaveID],
      'Leave Type ID': [LeaveTypeID],
      'Leave Balance': LeaveBalance,
    },
  }) => {
    return {
      userId: EmployeeLeaveID,
      defId: LeaveTypeID,
      balance: LeaveBalance,
    };
  }),
  // Maps a daily attendance record from Lark to AirTable format.
  dailyAttendanceToAirTable: createMapper((record) => {
    const {
      ColumnMap: {
        '51201': { Value: RecordDate } = { Value: '' },
        '51202': { Value: ShiftText } = { Value: '' },
        '50103': { Value: EmployeeID } = { Value: '' },
        '51302': { Value: RequiredDuration } = { Value: '' },
        '51303': { Value: ActualDuration } = { Value: '' },
        '51305': { Value: Late } = { Value: '' },
        '51307': { Value: Overtime } = { Value: '' },
        '51401': { Value: LeaveTime } = { Value: '' },
        '51402': { Value: LeaveType } = { Value: '' },
      },
    } = record;

    let match;
    let shiftStart = null;
    let shiftEnd = null;
    const regex = /(next day )?(\d{2}:\d{2})/g;

    // Parse Shift start/end from text
    while (match = regex.exec(ShiftText)) {
      const [, isNextDay, duration] = match;
      let actual = 0;

      if (isNextDay) {
        actual += 24 * 60;
      }

      actual += parseDuration(duration);

      if (shiftStart === null) {
        shiftStart = actual;
      } else if (shiftEnd === null) {
        shiftEnd = actual;
      }
    }

    const parsedDate = RecordDate.slice(0, 4) + '-' + RecordDate.slice(4, 6) + '-' + RecordDate.slice(6, 8);

    // Parse first-in/last-out.
    const inColumns = Object.keys(record.ColumnMap).filter((c) => /51502-\d+-1/g.exec(c));
    const outColumns = Object.keys(record.ColumnMap).filter((c) => /51502-\d+-2/g.exec(c));
    let firstInText = record.ColumnMap[inColumns[0]].Value;

    // Grab the last outColumn value that isn't a '-'.
    let lastOutText = '-';

    for (let i = 0; i < outColumns.length; i++) {
      const outColumn = outColumns[i];
      const value = record.ColumnMap[outColumn].Value;

      if (value !== '-') {
        lastOutText = value;
      }
    }

    // Parse the times from text.
    const firstIn = firstInText === '-' ? null : parseDuration(firstInText);
    const lastOut = lastOutText === '-' ? null : parseDuration(lastOutText);

    return {
      'ID': EmployeeID + '-' + RecordDate,
      'Date': parsedDate,
      'Employee ID': EmployeeID,
      'Required Duration': Number(RequiredDuration) * 60,
      'Actual Duration': Number(ActualDuration) * 60,
      'Overtime Hours': parseHoursFromText(Overtime),
      'Late Time': Number(Late),
      'Leave Time': parseHoursFromText(LeaveTime),
      'Leave Type': LeaveType === '-' ? null : LeaveType,
      'Shift Time In': shiftStart,
      'Shift Time Out': shiftEnd,
      'Shift Name': ShiftText,
      'First In': firstIn,
      'Last Out': lastOut,
    };
  })
};
