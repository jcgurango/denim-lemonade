import Overtime from "./Overtime"

function Calculate({createdAttendance, fields}, myHol) {  
    let fDuration = 8; //fixed duration
    let aDuration = (fields['Actual Duration']) ? (fields['Actual Duration']/3600) : 0;
    let rDuration = (fields['Required Duration']) ? (fields['Required Duration']/3600) : 0;
    let sTimeIn = (fields['Shift Time In']) ? (fields['Shift Time In']/3600) : 0;
    let sTimeOut = (fields['Shift Time Out']) ? (fields['Shift Time Out']/3600) : 0;
    let fTimeIn = (fields['First In']) ? (fields['First In']/3600) : 0;
    let lTimeOut = (fields['Last Out']) ? (fields['Last Out']/3600) : 0;
    let sOvertime = (fields['Overtime Hours']) ? (fields['Overtime Hours']) : 0;
    let iRequired = (fields['Not Required']) ? (fields['Not Required']) : 0;
    let iNoRecord = (fields['No Record']) ? (fields['No Record']) : 0;

    //Set Employee ID
    createdAttendance.employee_id = (fields['Employee ID']) ? fields['Employee ID'][0] : "";
    //Set Date
    createdAttendance.Date = (fields['Date']) ? fields['Date'] : new Intl.DateTimeFormat('en-US').format(new Date());;
    //Set Period ID
    createdAttendance.payroll_period_id = (String(fields['Period ID']).trim()==="") ? 0 : parseInt(fields['Period ID'])
    //Calculate record if the employee has a login/out and required work day
    if (!(iRequired) && !(iNoRecord))
    {
        //Calculate Undertime
        createdAttendance.undertime = (lTimeOut<sTimeOut) ? (sTimeOut-lTimeOut) : 0;
        //Calculate Late
        createdAttendance.late = (sTimeIn<fTimeIn) ? (fTimeIn-sTimeIn) : 0;
    }   
    //Set the absent hours
    createdAttendance.absences = ((!iRequired) && (iNoRecord)) ? rDuration : 0;
    //Set the leave hours
    createdAttendance.leaves = (fields['Leave Time']) ? (fields['Leave Time']) : 0; 
    //Set the payroll days
    createdAttendance.payroll_days = (fields['Actual Duration']) ? ((fields['Actual Duration']/3600)>>0) : 0; 
    //Set overtime
    Overtime(createdAttendance, myHol, sOvertime, sTimeIn, sTimeOut, fTimeIn, lTimeOut, aDuration, fDuration, iRequired);
}

export default Calculate