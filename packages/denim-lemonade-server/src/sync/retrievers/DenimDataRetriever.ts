import {
  DenimQuery,
  DenimQueryOperator,
  DenimRecord,
  DenimDataSourceV2,
} from 'denim';

export const DenimDataRetriever = (
  dataSource: DenimDataSourceV2,
  table: string,
  query: DenimQuery | null,
  updatedAtField: string
) => {
  return async (lastCheck: Date): Promise<DenimRecord[]> => {
    return dataSource.retrieveRecords(table, {
      ...(query || {}),
      conditions: {
        conditionType: 'group',
        type: 'AND',
        conditions: [
          ...(query?.conditions ? [query.conditions] : []),
          {
            conditionType: 'single',
            field: updatedAtField,
            operator: DenimQueryOperator.GreaterThanOrEqual,
            value: lastCheck.toISOString(),
          },
        ],
      },
      retrieveAll: true,
    });
  };
};
