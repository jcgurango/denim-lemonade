function Overtime(createdAttendance, myHol, sOvertime, sTimeIn, sTimeOut, fTimeIn, lTimeOut, aDuration, fDuration, required) {  
    let sNightDiff = 0, oDuration = 0, xOvertime = 0;

    //Calculate Night Differential
    if (lTimeOut>fTimeIn){
        sNightDiff = (lTimeOut>=22) ? lTimeOut-22 : 0
    }
    else if(lTimeOut<fTimeIn)
    {
            if ((lTimeOut<=6)&&(fTimeIn<=22)){
                    sNightDiff = lTimeOut + 2
            }
            else if ((lTimeOut<=6)&&(fTimeIn>22)){
                    sNightDiff = lTimeOut + (24-fTimeIn)
            }
            else if ((lTimeOut>=6)&&(fTimeIn<=22)){
                    sNightDiff = 8
            }
            else if ((lTimeOut>=6)&&(fTimeIn>22)){
                    sNightDiff = 6 + (24-fTimeIn)
            }
    }

    //Calculate Overtime 
    oDuration = (aDuration>fDuration) ? fDuration : aDuration;
    xOvertime = ((sTimeOut===0)&&(required===1)) ? ((aDuration>fDuration) ? (aDuration-fDuration) : 0) : ((lTimeOut>sTimeOut) ? (lTimeOut - sTimeOut) : 0);

    //Set holiday and overtime 
    if(myHol==="Special")
    {
        createdAttendance.sp_ot = oDuration;
        createdAttendance.sp_ot_ex = xOvertime
        createdAttendance.sp_ot_np = sNightDiff
    }
    else if(myHol==="Legal")
    {
        createdAttendance.leg_ot = oDuration;
        createdAttendance.leg_ot_ex = xOvertime
        createdAttendance.leg_ot_np = sNightDiff
    }
    else
    {        
        if (required) 
        {
            createdAttendance.rst_ot = oDuration;
            createdAttendance.rst_ot_ex = xOvertime
            createdAttendance.rst_ot_np = sNightDiff;
        }
        else
        {
            createdAttendance.reg_ot = xOvertime;
            createdAttendance.reg_np = sNightDiff;
        }
    } 
}

export default Overtime
