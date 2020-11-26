import { DenimDataSource, DenimSchemaSource } from '.';
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
import DenimValidator from './DenimValidator';

type RelationshipMap = { [relationship: string]: RelationshipRecordMap };
type RelationshipRecordMap = {
  [id: string]: DenimRelatedRecord | DenimRelatedRecordCollection | null;
};

export default abstract class DenimTableDataProvider<
  T extends DenimDataContext,
  S extends DenimSchemaSource<T>
> {
  private dataSource: DenimDataSource<T, S>;
  public tableSchema: DenimTable;
  protected validator: DenimValidator<T>;

  constructor(
    source: DenimDataSource<T, S>,
    schema: DenimTable,
    validator: DenimValidator<T>,
  ) {
    this.dataSource = source;
    this.tableSchema = schema;
    this.validator = validator;
  }

  protected abstract retrieve(id: string): Promise<DenimRecord | null>;
  protected abstract query(query?: DenimQuery): Promise<DenimRecord[]>;
  protected abstract save(record: DenimRecord): Promise<DenimRecord>;
  protected abstract delete(id: string): Promise<void>;

  getDefaultExpand() {
    // Expand foreign records 1 level to get names.
    return this.tableSchema.columns
      .filter(({ type }) => type === DenimColumnType.ForeignKey)
      .map(({ name }) => name);
  }

  async expandRecords(
    context: T,
    records: DenimRecord[],
    expansion: Expansion,
  ): Promise<void> {
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
                      .map((relatedRecord) => ({
                        type: 'record',
                        id: String(relatedRecord.id),
                        name:
                          String(
                            relatedRecord[
                              foreignTableProvider.tableSchema.nameField
                            ],
                          ) || '',
                        record: relatedRecord,
                      })),
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

    // Write back to the records.
    Object.keys(relationships).forEach((relationship) => {
      Object.keys(relationships[relationship]).forEach((recordId) => {
        const record = records.find(({ id }) => id === recordId);

        if (record) {
          record[relationship] = relationships[relationship][recordId];
        }
      });
    });
  }

  async retrieveRecord(
    context: T,
    id: string,
    expansion?: Expansion,
  ): Promise<DenimRecord | null> {
    const record = await this.retrieve(id);
    let expand = expansion;

    if (!expand) {
      expand = this.getDefaultExpand();
    }

    if (expand && record) {
      await this.expandRecords(context, [record], expand);
    }

    return record;
  }

  async retrieveRecords(
    context: T,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    let passedQuery = query || {};

    if (!passedQuery.expand) {
      passedQuery.expand = [];
      passedQuery.expand.push(...this.getDefaultExpand());
    }

    // Retrieve the records.
    const records = await this.query(passedQuery);

    // Perform expansions (if any).
    if (passedQuery?.expand) {
      await this.expandRecords(context, records, passedQuery?.expand);
    }

    return records;
  }

  async createRecord(context: T, record: DenimRecord): Promise<DenimRecord> {
    const validator = this.validator.createValidator(context);

    const validRecord = await validator.validate(record, { abortEarly: false });

    // Create the record.
    const newRecord = await this.save(validRecord);

    // Expand the record.
    await this.expandRecords(context, [newRecord], this.getDefaultExpand());

    return newRecord;
  }

  async updateRecord(
    context: T,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    const validator = this.validator.createValidator(context);

    // Retrieve the record.
    let existingRecord = await this.retrieveRecord(
      context,
      id,
      this.getDefaultExpand(),
    );

    existingRecord = {
      ...existingRecord,
      ...record,
    };

    // Expand the new record.
    await this.expandRecords(
      context,
      [existingRecord],
      this.getDefaultExpand(),
    );

    // Validate the updated record.
    const validRecord = await validator.validate(existingRecord, {
      abortEarly: false,
    });

    const updatedRecord = await this.save(validRecord);

    // Expand the record again.
    await this.expandRecords(context, [updatedRecord], this.getDefaultExpand());

    // Return the updated record.
    return updatedRecord;
  }

  async deleteRecord(context: DenimDataContext, id: string): Promise<void> {
    await this.delete(id);
  }
}
