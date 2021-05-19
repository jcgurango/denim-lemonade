import { transformAll } from '@demvsystems/yup-ast';
import dayjs from 'dayjs';
import { Schema } from 'yup';
import {
  DenimQuery,
  DenimRecord,
  DenimSchema,
  DenimTable,
  Expansion,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
  DenimColumnType,
  DenimQueryOperator,
  YupAst,
  DenimColumn,
} from '../core';
import { DenimDataSourceHookV2 } from './types/hooksV2';
import { DenimWorkflowContext } from './types/workflow';

type RelationshipMap = { [relationship: string]: RelationshipRecordMap };

type RelationshipRecordMap = {
  [id: string]: DenimRelatedRecord | DenimRelatedRecordCollection | null;
};

type AdditionalValidation = {
  validation: YupAst;
  table?: string | RegExp;
  field?: string | RegExp;
};

const RecordSchemaShape = {
  type: [['yup.string'], ['yup.required'], ['yup.equals', ['record']]],
  id: [['yup.string', ['yup.required']]],
  name: [['yup.string'], ['yup.nullable', true]],
  record: [['yup.mixed'], ['yup.nullable', true]],
};

const RecordCollectionSchemaShape = {
  type: [
    ['yup.string'],
    ['yup.required'],
    ['yup.equals', ['record-collection']],
  ],
  record: [['yup.array', [['yup.object'], ['yup.shape', RecordSchemaShape]]]],
};

export const CommonShapes = {
  Record: RecordSchemaShape,
  RecordCollection: RecordCollectionSchemaShape,
};

export default abstract class DenimDataSourceV2 {
  public schema: DenimSchema = {
    tables: [],
  };
  public hooks: DenimDataSourceHookV2[] = [];
  public extraValidations: AdditionalValidation[] = [];
  private validationCache: {
    [table: string]: Schema<any, object>;
  } = {};

  registerHook(hook: DenimDataSourceHookV2) {
    this.hooks.push(hook);
  }

  registerExtraValidation(validation: AdditionalValidation) {
    this.extraValidations.push(validation);
  }

  public getTableNames(): string[] {
    return this.schema.tables.map((table) => table.name);
  }

  public getWorkflowNames(): string[] {
    return this.schema.workflows?.map((workflow) => workflow.name) || [];
  }

  public hasTable(table: string): boolean {
    return !!this.schema.tables.find(
      (tbl) => tbl.name === table || tbl.id === table,
    );
  }

  public getTable(table: string): DenimTable {
    const tableSchema = this.schema.tables.find(
      ({ id, name }) => id === table || name === table,
    );

    if (!tableSchema) {
      throw new Error('Unknown table ' + table + '.');
    }

    return tableSchema;
  }

  public async validate(
    table: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    let validator = this.validationCache[table];

    if (!validator) {
      const tableSchema = this.getTable(table);
      const validationSchema = await this.createValidator(
        tableSchema.name,
        tableSchema.columns,
      );
      validator = transformAll(validationSchema);
      this.validationCache[table] = validator;
    }

    const validatedRecord = await validator.validate(record, {
      abortEarly: false,
    });

    return validatedRecord;
  }

  protected abstract retrieve(
    table: string,
    id: string,
  ): Promise<DenimRecord | null>;
  protected abstract query(
    table: string,
    query?: DenimQuery,
  ): Promise<DenimRecord[]>;
  protected abstract save(
    table: string,
    record: DenimRecord,
  ): Promise<DenimRecord>;
  protected abstract delete(table: string, id: string): Promise<void>;

  async expandRecords(
    table: string,
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
        const column = this.getTable(table).columns.find(
          ({ name }) => name === relationship,
        );

        if (
          column?.type === DenimColumnType.ForeignKey &&
          column?.properties?.foreignTableId
        ) {
          const foreignTable = this.getTable(
            column?.properties?.foreignTableId,
          );

          // Collect related IDs.
          const relatedRecordIds = records.reduce<string[]>((current, next) => {
            const field = next[relationship];

            if (typeof field === 'object') {
              if (field?.type === 'record' && field?.id) {
                if (field.record) {
                  return current;
                }

                return current.concat(field.id);
              }

              if (field?.type === 'record-collection') {
                return current.concat(
                  field.records
                    .map(({ id, record }) => (record ? '' : id))
                    .filter(Boolean),
                );
              }
            }

            return current;
          }, []);

          if (relatedRecordIds.length > 0) {
            // Retrieve the related records.
            const relatedRecords = await this.findById(
              foreignTable.id,
              childExpansions[relationship],
              ...relatedRecordIds,
            );

            relationships[relationship] = records.reduce<RelationshipRecordMap>(
              (current, next) => {
                const field = next[relationship];

                if (typeof field === 'object') {
                  if (field?.type === 'record' && field?.id && !field.record) {
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
                              String(relatedRecord[foreignTable.nameField]) ||
                              '',
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
                        records: field.records.map((record) => {
                          if (record.record) {
                            return record;
                          }

                          const relatedRecord = relatedRecords.find(
                            ({ id }) => record.id === id,
                          );

                          if (relatedRecord) {
                            return {
                              type: 'record',
                              id: String(relatedRecord.id),
                              name:
                                String(relatedRecord[foreignTable.nameField]) ||
                                '',
                              record: relatedRecord,
                            };
                          }

                          return record;
                        }),
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
    table: string,
    expansion?: Expansion,
    ...ids: string[]
  ): Promise<DenimRecord[]> {
    const [hookedIds, hookedExpansion] = await this.executeHooks(
      'pre-find',
      table,
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
      queryHookedIds,
      hookedQuery,
      queryHookedExpansion,
    ] = await this.executeHooks(
      'pre-find-query',
      table,
      hookedIds,
      query,
      hookedExpansion,
    );

    const records = await this.query(table, hookedQuery);

    const [, , hookedRecords, postHookedExpansion] = await this.executeHooks(
      'post-find',
      table,
      queryHookedIds,
      hookedQuery,
      records,
      queryHookedExpansion,
    );

    if (postHookedExpansion) {
      this.expandRecords(table, hookedRecords, postHookedExpansion);
    }

    return hookedRecords;
  }

  async retrieveRecord(
    table: string,
    id: string,
    expansion?: Expansion,
  ): Promise<DenimRecord | null> {
    const [hookedId, hookedExpansion] = await this.executeHooks(
      'pre-retrieve-record',
      table,
      id,
      expansion,
    );

    const record = await this.retrieve(table, hookedId);

    const [, expand, hookedRecord] = await this.executeHooks(
      'pre-retrieve-record-expand',
      table,
      hookedId,
      hookedExpansion,
      record,
    );

    if (hookedRecord && expand) {
      await this.expandRecords(table, [hookedRecord], expand);
    }

    const [postHookedRecord] = await this.executeHooks(
      'post-retrieve-record',
      table,
      hookedRecord,
    );

    return postHookedRecord;
  }

  async retrieveRecords(
    table: string,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    const [hookedQuery] = await this.executeHooks(
      'pre-retrieve-records',
      table,
      query,
    );
    let passedQuery = hookedQuery || {};

    // Retrieve the records.
    const records = await this.query(table, passedQuery);

    const [hookedRecords, preHookedQuery] = await this.executeHooks(
      'pre-retrieve-records-expand',
      table,
      records,
      hookedQuery,
    );

    // Perform expansions (if any).
    if (passedQuery.expand) {
      await this.expandRecords(table, hookedRecords, passedQuery.expand);
    }

    const [, postHookedRecords] = await this.executeHooks(
      'post-retrieve-records',
      table,
      preHookedQuery,
      hookedRecords,
    );

    return postHookedRecords;
  }

  async createRecord(table: string, record: DenimRecord): Promise<DenimRecord> {
    const [hookedRecord] = await this.executeHooks('pre-create', table, record);

    const [hookedRecordPreValidate] = await this.executeHooks(
      'pre-create-validate',
      table,
      hookedRecord,
    );

    const validRecord = await this.validate(table, hookedRecordPreValidate);

    const [hookedRecordPostValidate] = await this.executeHooks(
      'post-create-validate',
      table,
      validRecord,
    );

    // Create the record.
    const newRecord = await this.save(table, hookedRecordPostValidate);

    // Expand the record.
    await this.expandRecords(table, [newRecord], []);

    const [hookedRecordPost] = await this.executeHooks(
      'post-create',
      table,
      newRecord,
    );

    return hookedRecordPost;
  }

  async updateRecord(
    table: string,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    const [hookedId, hookedRecord] = await this.executeHooks(
      'pre-update',
      table,
      id,
      record,
    );

    // Retrieve the record.
    const existingRecord = await this.retrieveRecord(table, hookedId);

    const fullRecord = {
      ...(existingRecord || {}),
      ...hookedRecord,
    };

    const [hookedRecordPreValidate] = await this.executeHooks(
      'pre-update-validate',
      table,
      fullRecord,
    );

    // Validate the updated record.
    const validRecord: DenimRecord = await this.validate(
      table,
      hookedRecordPreValidate,
    );

    const [hookedRecordPostValidate] = await this.executeHooks(
      'post-update-validate',
      table,
      validRecord,
    );

    // Update any values that are different from their initial values.
    const saveRequest: DenimRecord = {
      id: hookedRecordPostValidate.id,
    };

    Object.keys(record || { }).forEach((key) => {
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

      // eslint-disable-next-line eqeqeq
      if (initialValue != newValue) {
        saveRequest[key] = hookedRecordPostValidate[key];
      }
    });

    const updatedRecord = await this.save(table, saveRequest);

    const [, hookedRecordPost] = await this.executeHooks(
      'post-update',
      table,
      updatedRecord.id,
      updatedRecord,
    );

    // Return the updated record.
    return hookedRecordPost;
  }

  async deleteRecord(table: string, id: string): Promise<void> {
    const [hookedId] = await this.executeHooks('pre-delete', table, id);
    await this.delete(table, hookedId);
    await this.executeHooks('post-delete', table, id);
  }

  async executeHooks<T extends any[]>(
    type: string,
    table: string,
    ...args: T
  ): Promise<T> {
    const hooks = this.hooks.filter(
      ({ type: t, table: ta }) =>
        t === type && (typeof ta === 'string' ? table === ta : ta.test(table)),
    );
    let currentArguments = args;

    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      const callback: any = hook.callback;
      currentArguments = await callback(table, ...currentArguments);
    }

    return currentArguments;
  }

  createForeignKeyValidator(field: DenimColumn): YupAst {
    // Validate the shape.
    if (field.type === DenimColumnType.ForeignKey) {
      if (field.properties.multiple) {
        return [
          ['yup.object'],
          ['yup.shape', CommonShapes.RecordCollection],
          ['yup.nullable', true],
          ['yup.default', null],
        ];
      } else {
        return [
          ['yup.object'],
          ['yup.shape', CommonShapes.Record],
          ['yup.nullable', true],
          ['yup.default', null],
        ];
      }
    }

    return ['yup.mixed'];
  }

  createFieldValidator(field: DenimColumn): YupAst {
    switch (field.type) {
      case DenimColumnType.ForeignKey:
        return this.createForeignKeyValidator(field);
      case DenimColumnType.Boolean:
        return [['yup.boolean'], ['yup.nullable', true]];
      case DenimColumnType.DateTime:
        if (!field.properties.includesTime) {
          return [
            ['yup.string'],
            ['yup.nullable', true],
            [
              'yup.transform',
              function (this: any, value: any) {
                if (!value) {
                  return null;
                }

                // First validate that this is a date.
                const parsed = dayjs(value);

                if (parsed.isValid()) {
                  return parsed.format('YYYY-MM-DD');
                }

                return new Date('');
              },
            ],
            ['yup.typeError', field.name + ' must be a valid date.'],
          ];
        }

        return [['yup.date'], ['yup.nullable', true]];
      case DenimColumnType.Select:
        return [
          ['yup.string'],
          ['yup.nullable', true],
          [
            'yup.oneOf',
            [null].concat(
              field.properties.options.map(({ value }) => value) as any,
            ),
          ],
        ];
      case DenimColumnType.MultiSelect:
        return [
          [
            'yup.array',
            [
              ['yup.string'],
              ['yup.oneOf', field.properties.options.map(({ value }) => value)],
            ],
          ],
          ['yup.nullable', true],
        ];
      case DenimColumnType.Number:
        return [
          ['yup.number'],
          [
            'yup.transform',
            function (this: any, value: any, originalValue: any) {
              if (isNaN(value) && typeof originalValue === 'string') {
                return +originalValue.replace(/,/g, '');
              }

              return value;
            },
          ],
          ['yup.nullable', true],
        ];
      case DenimColumnType.Text:
        return [['yup.string'], ['yup.nullable', true]];
      case DenimColumnType.ReadOnly:
        return [['yup.mixed'], ['yup.nullable', true]];
    }
  }

  async createValidator(
    tableName: string,
    columns: DenimColumn[],
  ): Promise<YupAst> {
    const shape: { [key: string]: YupAst } = {};

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];

      const [, , validation] = await this.executeHooks(
        'field-validation',
        tableName,
        columns,
        column,
        this.createFieldValidator(column),
      );

      shape[column.name] = validation;
    }

    const [, newShape] = await this.executeHooks(
      'table-validation',
      tableName,
      columns,
      shape,
    );

    return [['yup.object'], ['yup.shape', newShape]];
  }

  public async executeWorkflow(
    workflowName: string,
    input: DenimRecord,
    context: DenimWorkflowContext,
  ) {
    // Find the workflow in the schema.
    const workflow = this.schema.workflows?.find(
      ({ name }) => name === workflowName,
    );

    if (!workflow) {
      throw new Error('Unknown workflow ' + workflow);
    }

    const workflowFunction: any = (this as any)[workflow.name];

    if (!workflowFunction || typeof workflowFunction !== 'function') {
      throw new Error(
        'Workflow function ' + workflow.name + ' not implemented.',
      );
    }

    // Create a validator.
    const validator = transformAll(
      await this.createValidator('workflow/' + workflow.name, workflow.inputs),
    );

    const validatedInput = await validator.validate(input);

    return await workflowFunction(validatedInput, context);
  }
}
