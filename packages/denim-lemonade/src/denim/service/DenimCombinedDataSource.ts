import { DenimDataSource, DenimSchemaSource } from '.';
import {
  DenimColumnType,
  DenimDataContext,
  DenimRecord,
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
} from '../core';
import DenimCombinedSchemaSource from './DenimCombinedSchemaSource';
import DenimTableDataProvider from './DenimTableDataProvider';
import { DenimDataSourceHook } from './types/hooks';

export default class DenimCombinedDataSource<
  T extends DenimDataContext
> extends DenimDataSource<T, DenimSchemaSource<T>> {
  public sources: DenimDataSource<any, DenimSchemaSource<T>>[];

  constructor(...dataSources: DenimDataSource<T, DenimSchemaSource<T>>[]) {
    super(
      new DenimCombinedSchemaSource(
        ...dataSources.map(({ schemaSource }) => schemaSource),
      ),
    );
    this.sources = dataSources;
  }

  createDataProvider(
    table: string,
  ): DenimTableDataProvider<T, DenimSchemaSource<T>> {
    for (let i = 0; i < this.sources.length; i++) {
      const source = this.sources[i];
      const tableSchema = source.schemaSource.hasTableSchema(table);

      if (tableSchema) {
        const dataProvider = source.createDataProvider(table);
        dataProvider.getForeignTableProvider = (table) =>
          this.createDataProvider(table);
        return dataProvider;
      }
    }

    throw new Error('Table ' + table + ' not found in any data source.');
  }

  registerHook(hook: DenimDataSourceHook<any>) {
    this.sources.forEach((source) => {
      source.registerHook(hook);
    });
  }

  findSourceWithTable(table: string) {
    for (let i = 0; i < this.sources.length; i++) {
      const dataSource = this.sources[i];
      const schema = dataSource.schemaSource.hasTableSchema(table);

      if (schema) {
        return {
          dataSource,
          schema,
        };
      }
    }

    return null;
  }

  registerLink(
    table: string,
    foreignTable: string,
    fieldName: string,
    multiple: boolean = false,
  ) {
    const source = this.findSourceWithTable(table);
    const foreignSource = this.findSourceWithTable(foreignTable);

    if (!source) {
      throw new Error('Unknown table ' + table + ' while creating link.');
    }

    if (!foreignSource) {
      throw new Error(
        'Unknown table ' + foreignTable + ' while creating link.',
      );
    }

    // Replace the schema in the source table.
    const sourceColumn = source.schema.columns.find(
      ({ name }) => name === fieldName,
    );

    if (!sourceColumn) {
      throw new Error('Unknown field ' + fieldName + ' while creating link.');
    }

    sourceColumn.type = DenimColumnType.ForeignKey;
    sourceColumn.properties = {
      foreignTableId: foreignTable,
      multiple,
    };

    const convertOutputRecord = (record: DenimRecord): DenimRecord => {
      if (record[fieldName] && typeof record[fieldName] === 'string') {
        if (multiple) {
          return {
            ...record,
            [fieldName]: {
              type: 'record-collection',
              records: String(record[fieldName])
                .split(',')
                .filter(Boolean)
                .map((id) => ({
                  type: 'record',
                  id,
                })),
            },
          };
        }

        return {
          ...record,
          [fieldName]: {
            type: 'record',
            id: String(record[fieldName]),
          },
        };
      }

      return record;
    };

    // Register hooks for all retrieval methods.
    source.dataSource.registerHook({
      type: 'pre-retrieve-records-expand',
      table,
      callback: async (table, context, records, query) => {
        return [context, records.map(convertOutputRecord), query];
      },
    });

    source.dataSource.registerHook({
      type: 'pre-retrieve-record-expand',
      table,
      callback: async (table, context, id, expansion, record) => {
        return [context, id, expansion, record ? convertOutputRecord(record) : record];
      },
    });

    source.dataSource.registerHook({
      type: 'post-find',
      table,
      callback: async (table, context, ids, query, records, expansion) => {
        return [context, ids, query, records.map(convertOutputRecord), expansion];
      },
    });

    source.dataSource.registerHook({
      type: 'post-update',
      table,
      callback: async (table, context, id, record) => {
        return [context, id, convertOutputRecord(record)];
      },
    });

    source.dataSource.registerHook({
      type: 'post-create',
      table,
      callback: async (table, context, record) => {
        return [context, convertOutputRecord(record)];
      },
    });

    // Register hooks for create/update methods.
    const convertInputRecord = (record: DenimRecord): DenimRecord => {
      if (record[fieldName]) {
        if (multiple) {
          const value = (<DenimRelatedRecordCollection>(record[fieldName]));

          return {
            ...record,
            [fieldName]: value.records.map(({ id }) => id).join(',') + ',',
          };
        }

        const value = (<DenimRelatedRecord>(record[fieldName]));

        return {
          ...record,
          [fieldName]: value.id,
        };
      }

      return record;
    };

    source.dataSource.registerHook({
      type: 'post-create-validate',
      table,
      callback: async (table, context, record) => {
        return [context, convertInputRecord(record)];
      },
    });

    source.dataSource.registerHook({
      type: 'post-update-validate',
      table,
      callback: async (table, context, record) => {
        return [context, convertInputRecord(record)];
      },
    });
  }
}
