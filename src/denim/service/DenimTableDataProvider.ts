import { DenimDataSource } from '.';
import {
  DenimQuery,
  DenimRecord,
  DenimDataContext,
  Expansion,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
  DenimTable,
  DenimColumnType,
  DenimQueryOperator,
} from '../core';

type RelationshipMap = { [relationship: string]: RelationshipRecordMap };
type RelationshipRecordMap = {
  [id: string]: DenimRelatedRecord | DenimRelatedRecordCollection | null;
};

export default abstract class DenimTableDataProvider {
  private dataSource: DenimDataSource;
  public tableSchema: DenimTable;

  constructor(source: DenimDataSource, schema: DenimTable) {
    this.dataSource = source;
    this.tableSchema = schema;
  }

  protected abstract retrieve(id: string): Promise<DenimRecord | null>;
  protected abstract query(query?: DenimQuery): Promise<DenimRecord[]>;
  protected abstract save(record: DenimRecord): Promise<void>;
  protected abstract delete(id: string): Promise<void>;

  async expandRecords(
    context: DenimDataContext,
    records: DenimRecord[],
    expansion: Expansion,
  ): Promise<RelationshipMap> {
    let relationships: RelationshipMap,
      childExpansions: { [relationship: string]: Expansion },
      rootExpansions: string[];
    relationships = {};

    childExpansions = expansion.reduce<{ [relationship: string]: string[] }>(
      (current, next) => {
        const [root, field] = next.split('.', 2);

        return {
          ...current,
          [root]: [...(current[root] || []), ...(field ? [field] : [])],
        };
      },
      {},
    );

    rootExpansions = Object.keys(childExpansions);

    // Iterate through the expected expansions.
    for (let i = 0; i < rootExpansions.length; i++) {
      const relationship = rootExpansions[i];
      const column = this.tableSchema.columns.find(
        ({ name }) => name === relationship,
      );

      if (
        column?.type === DenimColumnType.ForeignKey &&
        column?.properties?.foreignTableId
      ) {
        const foreignTable = column?.properties?.foreignTableId;
        const foreignTableProvider = this.dataSource.createDataProvider(
          foreignTable,
        );

        // Collect related IDs.
        const relatedRecordIds = records.reduce<string[]>((current, next) => {
          const field = next[relationship];

          if (typeof field === 'object') {
            if (field?.type === 'record' && field?.id) {
              return current.concat(field.id);
            }

            if (field?.type === 'record-collection') {
              return current.concat(
                field.records.map(({ id }) => id).filter(Boolean),
              );
            }
          }

          return current;
        }, []);

        // Retrieve the related records.
        const relatedRecords = await foreignTableProvider.retrieveRecords(
          context,
          {
            conditions: {
              conditionType: 'group',
              type: 'OR',
              conditions: relatedRecordIds.map((id) => ({
                conditionType: 'single',
                field: 'id',
                operator: DenimQueryOperator.Equals,
                value: id,
              })),
            },
            expand: childExpansions[relationship],
          },
        );

        relationships[relationship] = records.reduce<RelationshipRecordMap>(
          (current, next) => {
            const field = next[relationship];

            if (typeof field === 'object') {
              if (field?.type === 'record' && field?.id) {
                const relatedRecord = relatedRecords.find(
                  ({ id }) => id === field.id,
                );

                if (relatedRecord) {
                  return {
                    ...current,
                    [String(next.id)]:
                      {
                        type: 'record',
                        id: String(relatedRecord.id),
                        name:
                          String(
                            relatedRecord[
                              foreignTableProvider.tableSchema.nameField
                            ],
                          ) || '',
                        record: relatedRecord,
                      } || null,
                  };
                }
              }

              if (field?.type === 'record-collection') {
                return {
                  ...current,
                  [String(next.id)]: {
                    type: 'record-collection',
                    records: relatedRecords
                      .filter(({ id }) =>
                        field.records.map(({ id }) => id).includes(String(id)),
                      )
                      .filter(Boolean)
                      .map(
                        (relatedRecord) =>
                          ({
                            type: 'record',
                            id: String(relatedRecord.id),
                            name:
                              String(
                                relatedRecord[
                                  foreignTableProvider.tableSchema.nameField
                                ],
                              ) || '',
                            record: relatedRecord,
                          }),
                      ),
                  },
                };
              }
            }

            return current;
          },
          {},
        );
      } else {
        throw new Error('Unknown expansion ' + relationship);
      }
    }

    return relationships;
  }

  async retrieveRecords(
    context: DenimDataContext,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    let passedQuery = query;
    let expansion = null;

    if (query) {
      const { expand, ...plainQuery } = query;
      expansion = expand;
      passedQuery = plainQuery;
    }

    // Retrieve the records.
    const records = await this.query(passedQuery);

    // Perform expansions (if any).
    if (expansion) {
      const expandedRecords = await this.expandRecords(context, records, expansion);

      Object.keys(expandedRecords).forEach((relationship) => {
        Object.keys(expandedRecords[relationship]).forEach((recordId) => {
          const record = records.find(({ id }) => id === recordId);

          if (record) {
            record[relationship] = expandedRecords[relationship][recordId];
          }
        });
      });
    }

    return records;
  }
}
