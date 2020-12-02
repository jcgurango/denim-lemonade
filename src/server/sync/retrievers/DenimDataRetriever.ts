import {
  DenimDataContext,
  DenimQuery,
  DenimQueryOperator,
  DenimRecord,
} from '../../../denim/core';
import { DenimSchemaSource, DenimTableDataProvider } from '../../../denim/service';

export const DenimDataRetriever = <T extends DenimDataContext>(
  tableData: DenimTableDataProvider<T, DenimSchemaSource<T>>,
  query: DenimQuery | null,
  updatedAtField: string,
  context: T,
) => {
  return async (lastCheck: Date): Promise<DenimRecord[]> => {
    //console.log('Retrieving new/updated records from ' + tableData.tableSchema.name + ' on ' + updatedAtField + '...');

    return tableData.retrieveRecords(context, {
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
