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
import { transformAll } from '@demvsystems/yup-ast';

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
    await Promise.all(
      rootExpansions.map(async (relationship) => {
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

          if (relatedRecordIds.length > 0) {
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
                retrieveAll: true,
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
                            field.records
                              .map(({ id }) => id)
                              .includes(String(id)),
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
          }
        } else {
          throw new Error('Unknown expansion ' + relationship);
        }
      }),
    );

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
    const [
      hookedContext,
      hookedId,
      hookedExpansion,
    ] = await this.dataSource.executeHooks(
      'pre-create',
      this.tableSchema.name,
      context,
      id,
      expansion,
    );

    const record = await this.retrieve(hookedId);
    let expand = hookedExpansion;

    if (record && expand) {
      await this.expandRecords(context, [record], expand);
    }

    const [, hookedRecord] = await this.dataSource.executeHooks(
      'post-create',
      this.tableSchema.name,
      hookedContext,
      record,
    );

    return hookedRecord;
  }

  async retrieveRecords(
    context: T,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    const [hookedContext, hookedQuery] = await this.dataSource.executeHooks(
      'pre-retrieve-records',
      this.tableSchema.name,
      context,
      query,
    );
    let passedQuery = hookedQuery || {};

    // Retrieve the records.
    const records = await this.query(passedQuery);

    // Perform expansions (if any).
    if (passedQuery.expand) {
      await this.expandRecords(context, records, passedQuery.expand);
    }

    const [, , hookedRecords] = await this.dataSource.executeHooks(
      'post-retrieve-records',
      this.tableSchema.name,
      hookedContext,
      hookedQuery,
      records,
    );

    return hookedRecords;
  }

  async createRecord(context: T, record: DenimRecord): Promise<DenimRecord> {
    const [hookedContext, hookedRecord] = await this.dataSource.executeHooks(
      'pre-create',
      this.tableSchema.name,
      context,
      record,
    );

    const validator = transformAll(
      this.validator.createValidator(hookedContext),
    );

    const [
      hookedContextPreValidate,
      hookedRecordPreValidate,
      hookedValidator,
    ] = await this.dataSource.executeHooks(
      'pre-create-validate',
      this.tableSchema.name,
      hookedContext,
      hookedRecord,
      validator,
    );

    const validRecord = await hookedValidator.validate(
      hookedRecordPreValidate,
      {
        abortEarly: false,
      },
    );

    const [
      hookedContextPostValidate,
      hookedRecordPostValidate,
    ] = await this.dataSource.executeHooks(
      'post-create-validate',
      this.tableSchema.name,
      hookedContextPreValidate,
      validRecord,
    );

    // Create the record.
    const newRecord = await this.save(hookedRecordPostValidate);

    // Expand the record.
    await this.expandRecords(context, [newRecord], []);

    const [, hookedRecordPost] = await this.dataSource.executeHooks(
      'post-create',
      this.tableSchema.name,
      hookedContextPostValidate,
      newRecord,
    );

    return hookedRecordPost;
  }

  async updateRecord(
    context: T,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    const [
      hookedContext,
      hookedId,
      hookedRecord,
    ] = await this.dataSource.executeHooks(
      'pre-update',
      this.tableSchema.name,
      context,
      id,
      record,
    );

    const validator = transformAll(
      this.validator.createValidator(hookedContext),
    );

    // Retrieve the record.
    let existingRecord = await this.retrieveRecord(hookedContext, hookedId);

    existingRecord = {
      ...hookedRecord,
      ...record,
    };

    const [
      hookedContextPreValidate,
      hookedRecordPreValidate,
      hookedValidator,
    ] = await this.dataSource.executeHooks(
      'pre-update-validate',
      this.tableSchema.name,
      hookedContext,
      existingRecord,
      validator,
    );

    // Validate the updated record.
    const validRecord = await hookedValidator.validate(
      hookedRecordPreValidate,
      {
        abortEarly: false,
      },
    );

    const [
      hookedContextPostValidate,
      hookedRecordPostValidate,
    ] = await this.dataSource.executeHooks(
      'post-update-validate',
      this.tableSchema.name,
      hookedContextPreValidate,
      validRecord,
    );

    const updatedRecord = await this.save(hookedRecordPostValidate);

    const [, hookedRecordPost] = await this.dataSource.executeHooks(
      'post-update',
      this.tableSchema.name,
      hookedContextPostValidate,
      updatedRecord,
    );

    // Return the updated record.
    return hookedRecordPost;
  }

  async deleteRecord(context: DenimDataContext, id: string): Promise<void> {
    const [hookedContext, hookedId] = await this.dataSource.executeHooks(
      'pre-delete',
      this.tableSchema.name,
      context,
      id,
    );
    await this.delete(hookedId);
    await this.dataSource.executeHooks(
      'post-delete',
      this.tableSchema.name,
      hookedContext,
      id,
    );
  }
}
