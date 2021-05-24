
/**
 * @param {import('../lark-admin')} larkAdmin 
 */
 module.exports = (larkAdmin) => {
  return {
    retrieveAttendanceUsers: async (query = '') => {
      const {
        Body: {
          Users
        },
      } = await larkAdmin.attendance.getUser(query);
      
      return Users;
    },
    retrieveAttendance: async (startDate = new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)), endDate = new Date(), userIds = []) => {
      const { ColumnFamilies: cf } = await larkAdmin.attendance.getColumns();

      const queryBody = {
        "Body": {
          "CountPerBatch": 10000,
          "BatchNum": 0,
          "Query": {
            "TaskType": "daily",
            "StartDate": startDate.toISOString().split('T')[0].replace(/-/g, ''),
            "EndDate": endDate.toISOString().split('T')[0].replace(/-/g, ''),
            "GrpIds": [],
            "Uids": userIds,
            "NeedHistory": true
          },
          "ColumnFamilies": cf,
        },
        "Head": {}
      };

      const { Lists, ColumnFamilies } = await larkAdmin.attendance.getStatistics(queryBody);

      return Lists.map((list) => ({
        ...list,
        __meta: { ColumnFamilies },
      }));
    },
  };
};
