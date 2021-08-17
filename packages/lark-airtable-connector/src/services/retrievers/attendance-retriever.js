
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
          "ColumnFamilies": cf.map((cf) => ({
            ...cf,
            Columns: cf.Columns.map((column) => ({
              ...column,
              Value: '1',
            })),
            isAllChoose: true,
          })),
        },
        "Head": {}
      };

      const { Lists, ColumnFamilies } = await larkAdmin.attendance.getStatistics(queryBody);

      return Lists.map((list) => ({
        ...list,
        __meta: { ColumnFamilies },
      }));
    },
    retrieveOvertimeRules: async () => {
      const { ruleDTO } = await larkAdmin.leaves.getOvertimeRules();
      const ruleList = [];

      for (let i = 0; i < ruleDTO.length; i++) {
        const rule = await larkAdmin.leaves.getOvertimeRule(ruleDTO[i].id);
        ruleList.push(rule);
      }

      return ruleList;
    },
  };
};
