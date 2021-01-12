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

  getForeignTableProvider(table: string) {
    return this.dataSource.createDataProvider(table);
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
          const foreignTableProvider = this.getForeignTableProvider(
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
            const relatedRecords = await foreignTableProvider.findById(
              context,
              childExpansions[relationship],
              ...relatedRecordIds,
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

  async findById(
    context: T,
    expansion?: Expansion,
    ...ids: string[]
  ): Promise<DenimRecord[]> {
    const [
      hookedContext,
      hookedIds,
      hookedExpansion,
    ] = await this.dataSource.executeHooks(
      'pre-find',
      this.tableSchema.name,
      context,
      ids,
      expansion,
    );

    const query: DenimQuery = {
      conditions: {
        conditionType: 'group',
        type: 'OR',
        conditions: hookedIds.map((id) => ({
          conditionType: 'single',
          field: 'id',
          operator: DenimQueryOperator.Equals,
          value: id,
        })),
      },
      expand: hookedExpansion,
      retrieveAll: true,
    };

    const [
      queryHookedContext,
      queryHookedIds,
      hookedQuery,
      queryHookedExpansion,
    ] = await this.dataSource.executeHooks(
      'pre-find-query',
      this.tableSchema.name,
      hookedContext,
      hookedIds,
      query,
      hookedExpansion,
    );

    const records = await this.query(hookedQuery);

    const [
      postHookedContext,
      ,
      ,
      hookedRecords,
      postHookedExpansion,
    ] = await this.dataSource.executeHooks(
      'post-find',
      this.tableSchema.name,
      queryHookedContext,
      queryHookedIds,
      hookedQuery,
      records,
      queryHookedExpansion,
    );

    if (postHookedExpansion) {
      this.expandRecords(postHookedContext, hookedRecords, postHookedExpansion);
    }

    return hookedRecords;
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
      'pre-retrieve-record',
      this.tableSchema.name,
      context,
      id,
      expansion,
    );

    const record = await this.retrieve(hookedId);

    const [
      preHookedContext,
      preHookedId,
      expand,
      hookedRecord,
    ] = await this.dataSource.executeHooks(
      'pre-retrieve-record-expand',
      this.tableSchema.name,
      hookedContext,
      hookedId,
      hookedExpansion,
      record,
    );

    if (hookedRecord && expand) {
      await this.expandRecords(context, [hookedRecord], expand);
    }

    const [, postHookedRecord] = await this.dataSource.executeHooks(
      'post-retrieve-record',
      this.tableSchema.name,
      preHookedContext,
      hookedRecord,
    );

    return postHookedRecord;
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

    const [
      preHookedContext,
      hookedRecords,
      preHookedQuery,
    ] = await this.dataSource.executeHooks(
      'pre-retrieve-records-expand',
      this.tableSchema.name,
      hookedContext,
      records,
      hookedQuery,
    );

    // Perform expansions (if any).
    if (passedQuery.expand) {
      await this.expandRecords(context, hookedRecords, passedQuery.expand);
    }

    const [, , postHookedRecords] = await this.dataSource.executeHooks(
      'post-retrieve-records',
      this.tableSchema.name,
      preHookedContext,
      preHookedQuery,
      hookedRecords,
    );

    return postHookedRecords;
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
    const existingRecord = await this.retrieveRecord(hookedContext, hookedId);

    const fullRecord = {
      ...(existingRecord || {}),
      ...hookedRecord,
    };

    const [
      hookedContextPreValidate,
      hookedRecordPreValidate,
      hookedValidator,
    ] = await this.dataSource.executeHooks(
      'pre-update-validate',
      this.tableSchema.name,
      hookedContext,
      fullRecord,
      validator,
    );

    // Validate the updated record.
    const validRecord: DenimRecord = await hookedValidator.validate(
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

    // Update any values that are different from their initial values.
    const saveRequest: DenimRecord = {
      id: hookedRecordPostValidate.id,
    };

    Object.keys(hookedRecordPostValidate).forEach((key) => {
      let initialValue = existingRecord ? existingRecord[key] : null;
      let newValue = hookedRecordPostValidate[key];

      if (
        initialValue &&
        typeof initialValue === 'object' &&
        initialValue.type === 'record'
      ) {
        initialValue = initialValue.id;
      }

      if (
        newValue &&
        typeof newValue === 'object' &&
        newValue.type === 'record'
      ) {
        newValue = newValue.id;
      }

      if (
        initialValue &&
        typeof initialValue === 'object' &&
        initialValue.type === 'record-collection'
      ) {
        initialValue =
          initialValue.records.map(({ id }) => id).join(',') || null;
      }

      if (
        newValue &&
        typeof newValue === 'object' &&
        newValue.type === 'record-collection'
      ) {
        newValue = newValue.records.map(({ id }) => id).join(',') || null;
      }

      if (Array.isArray(initialValue)) {
        initialValue = initialValue.join(',');
      }

      if (Array.isArray(newValue)) {
        newValue = newValue.join(',');
      }

      if (initialValue != newValue) {
        saveRequest[key] = hookedRecordPostValidate[key];
      }
    });

    const updatedRecord = await this.save(saveRequest);

    const [, , hookedRecordPost] = await this.dataSource.executeHooks(
      'post-update',
      this.tableSchema.name,
      hookedContextPostValidate,
      updatedRecord.id,
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
