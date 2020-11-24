import * as Yup from 'yup';
import { Schema } from 'yup';
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
  DenimColumn,
} from '../core';

const RecordSchema = Yup.object().shape({
  type: Yup.string().required().equals(['record']),
  id: Yup.string().required(),
  name: Yup.string().nullable(),
  record: Yup.mixed().nullable(),
});

const RecordCollectionSchema = Yup.object().shape({
  type: Yup.string().required().equals(['record-collection']).notRequired(),
  record: Yup.array(RecordSchema).notRequired(),
});

const CommonSchema = {
  Record: RecordSchema,
  RecordCollection: RecordCollectionSchema,
};

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
  protected abstract save(record: DenimRecord): Promise<DenimRecord>;
  protected abstract delete(id: string): Promise<void>;

  getDefaultExpand() {
    // Expand foreign records 1 level to get names.
    return this.tableSchema.columns
      .filter(({ type }) => type === DenimColumnType.ForeignKey)
      .map(({ name }) => name);
  }

  async expandRecords(
    context: DenimDataContext,
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

  async retrieveRecords(
    context: DenimDataContext,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    let passedQuery = query || {};
    let expansion = null;

    if (query) {
      const { expand, ...plainQuery } = query;
      expansion = expand;
      passedQuery = plainQuery;
    }

    if (!passedQuery.expand) {
      passedQuery.expand = [];
      passedQuery.expand.push(...this.getDefaultExpand());
    }

    // Retrieve the records.
    const records = await this.query(passedQuery);

    // Perform expansions (if any).
    if (expansion) {
      await this.expandRecords(
        context,
        records,
        expansion,
      );
    }

    return records;
  }

  async retrieveRecord(
    context: DenimDataContext,
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

  async createRecord(
    context: DenimDataContext,
    record: DenimRecord,
  ): Promise<DenimRecord | null> {
    const validator = this.createValidator(context);
    
    // Validate the record.
    if (await validator.validate(record, { abortEarly: false })) {
      // Create the record.
      const newRecord = await this.save(record);

      // Expand the record.
      await this.expandRecords(context, [newRecord], this.getDefaultExpand());

      return newRecord;
    }

    return null;
  }

  async updateRecord(
    context: DenimDataContext,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord | null> {
    const validator = this.createValidator(context);

    // Retrieve the record.
    let existingRecord = await this.retrieveRecord(context, id, this.getDefaultExpand());

    existingRecord = {
      ...existingRecord,
      ...record,
    };

    // Expand the new record.
    await this.expandRecords(context, [existingRecord], this.getDefaultExpand());

    // Validate the updated record.
    if (await validator.validate(existingRecord, { abortEarly: false })) {
      const record = await this.save(existingRecord);

      // Expand the record again.
      await this.expandRecords(context, [record], this.getDefaultExpand());

      // Return the updated record.
      return record;
    }

    return null;
  }

  async deleteRecord(
    context: DenimDataContext,
    id: string,
  ): Promise<void> {
    await this.delete(id);
  }

  createForeignKeyValidator(
    context: DenimDataContext,
    field: DenimColumn,
  ): Schema<any, object> {
    // Validate the shape.
    if (field.type === DenimColumnType.ForeignKey) {
      if (field.properties.multiple) {
        return CommonSchema.RecordCollection.nullable(true).default(null);
      } else {
        return CommonSchema.Record.nullable(true).default(null);
      }
    }

    return Yup.mixed();
  }

  createFieldValidator(
    context: DenimDataContext,
    field: DenimColumn,
  ): Schema<any, object> {
    switch (field.type) {
      case DenimColumnType.ForeignKey:
        return this.createForeignKeyValidator(context, field);
      case DenimColumnType.Boolean:
        return Yup.boolean();
      case DenimColumnType.DateTime:
        return Yup.date();
      case DenimColumnType.Select:
        return Yup.string().oneOf(
          field.properties.options.map(({ value }) => value),
        );
      case DenimColumnType.MultiSelect:
        return Yup.array(
          Yup.string().oneOf(
            field.properties.options.map(({ value }) => value),
          ),
        );
      case DenimColumnType.Number:
        return Yup.number();
      case DenimColumnType.Text:
        return Yup.string();
      case DenimColumnType.ReadOnly:
        return Yup.mixed();
    }
  }

  createValidator(context: DenimDataContext): Yup.ObjectSchema<any, object> {
    const shape: { [key: string]: Schema<any, object> } = {};

    this.tableSchema.columns.forEach((value) => {
      shape[value.name] = this.createFieldValidator(context, value);
      shape[value.name] = this.dataSource.executeValidationHooks(
        this.tableSchema.name,
        context,
        value,
        shape[value.name],
      );
    });

    return <Yup.ObjectSchema<any, object>>(this.dataSource.executeValidationHooks(
      this.tableSchema.name,
      context,
      null,
      Yup.object().shape(shape),
    ));
  }
}
