import fsnp from 'fs';
import path from 'path';
import randomString from 'random-string';
import { DenimDataSourceV2 } from '.';
import {
  DenimRecord,
  DenimQuery,
  DenimSchema,
  DenimColumnType,
  DenimRelatedRecordCollection,
  DenimRelatedRecord,
  DenimTable,
} from '../core';
import DenimLocalQuery from './DenimLocalQuery';

const fs = {
  mkdir: (path: fsnp.PathLike) =>
    new Promise<void>((resolve, reject) => {
      fsnp.mkdir(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }),
  readFile: (path: fsnp.PathLike) =>
    new Promise<string>((resolve, reject) => {
      fsnp.readFile(path, { encoding: 'utf-8' }, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    }),
  readdir: (path: fsnp.PathLike) =>
    new Promise<string[]>((resolve, reject) => {
      fsnp.readdir(path, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    }),
  writeFile: (path: fsnp.PathLike, data: any) =>
    new Promise<void>((resolve, reject) => {
      fsnp.writeFile(path, data, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }),
  unlink: (path: fsnp.PathLike) =>
    new Promise<void>((resolve, reject) => {
      fsnp.unlink(path, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    }),
};

export default class DenimJsonDataSource extends DenimDataSourceV2 {
  public rootPath: string;

  constructor(rootPath: string, schema: DenimSchema) {
    super();
    this.schema = schema;
    this.rootPath = rootPath;
  }

  public async initialize() {
    if (!fsnp.existsSync(this.rootPath)) {
      await fs.mkdir(this.rootPath);
    }

    // Check for table folders.
    for (let i = 0; i < this.schema.tables.length; i++) {
      const table = this.schema.tables[i];
      const tablePath = path.join(this.rootPath, table.id);

      if (!fsnp.existsSync(tablePath)) {
        await fs.mkdir(tablePath);
      }
    }
  }

  private mapRecord(data: any, tableSchema: DenimTable) {
    Object.keys(data).forEach((key) => {
      const columnSchema = tableSchema.columns.find(
        (column) => column.name === key
      );

      if (columnSchema?.type === DenimColumnType.ForeignKey) {
        if (columnSchema.properties.multiple) {
          data[key] = {
            type: 'record-collection',
            records: data[key].map((id: string) => ({
              type: 'record',
              id,
              name: '',
              record: null,
            })),
          } as DenimRelatedRecordCollection;
        } else {
          data[key] = {
            type: 'record',
            id: data[key],
          } as DenimRelatedRecord;
        }
      }
    });
  }

  protected async retrieve(
    table: string,
    id: string
  ): Promise<DenimRecord | null> {
    const tableSchema = this.getTable(table);
    const tablePath = path.join(this.rootPath, tableSchema.id);
    const recordPath = path.join(tablePath, `${id}.json`);

    if (fsnp.existsSync(tablePath)) {
      return this.retrieveRecordFromPath(id, recordPath, tableSchema);
    }

    return null;
  }

  private async retrieveRecordFromPath(
    id: string,
    recordPath: string,
    tableSchema: DenimTable
  ) {
    const data = {
      id,
      ...JSON.parse(await fs.readFile(recordPath)),
    };

    this.mapRecord(data, tableSchema);
    return data;
  }

  protected async query(
    table: string,
    query?: DenimQuery
  ): Promise<DenimRecord[]> {
    const tableSchema = this.getTable(table);
    const tablePath = path.join(this.rootPath, tableSchema.id);
    const collectedRecords: DenimRecord[] = [];

    const recordList = await fs.readdir(tablePath);

    for (let i = 0; i < recordList.length; i++) {
      const record = await this.retrieveRecordFromPath(
        recordList[i].split('.')[0],
        path.join(tablePath, recordList[i]),
        tableSchema
      );

      if (
        !query?.conditions ||
        DenimLocalQuery.matches(tableSchema, record, query.conditions)
      ) {
        collectedRecords.push(record);
      }
    }

    if (query?.sort) {
      const sortExpression = Array.isArray(query.sort)
        ? query.sort
        : [query.sort];

      this.expandRecords(
        table,
        collectedRecords,
        sortExpression
          .map(({ column }) => column)
          .filter((column) => {
            return (
              tableSchema.columns.find((c) => c.name === column)?.type ===
              DenimColumnType.ForeignKey
            );
          })
      );

      collectedRecords.sort((a, b) => {
        for (let i = 0; i < sortExpression.length; i++) {
          const sort = sortExpression[i];
          let valueA = a[sort.column];
          let valueB = b[sort.column];

          if (typeof valueA === 'object' && valueA?.type === 'record') {
            valueA = valueA.name;
          }

          if (typeof valueB === 'object' && valueB?.type === 'record') {
            valueB = valueB.name;
          }

          if (
            typeof valueA === 'object' &&
            valueA?.type === 'record-collection'
          ) {
            if (valueA.records[0]) {
              valueA = valueA.records[0].name;
            } else {
              valueA = '';
            }
          }

          if (
            typeof valueB === 'object' &&
            valueB?.type === 'record-collection'
          ) {
            if (valueB.records[0]) {
              valueB = valueB.records[0].name;
            } else {
              valueB = '';
            }
          }

          if ((valueA as any) > (valueB as any)) {
            return sortExpression[i].ascending ? 1 : -1;
          }

          if ((valueA as any) < (valueB as any)) {
            return sortExpression[i].ascending ? -1 : 1;
          }
        }

        return 0;
      });
    }

    if (query && !query.retrieveAll && query.pageSize && query.page) {
      return collectedRecords.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize
      );
    }

    return collectedRecords;
  }

  protected async save(
    table: string,
    record: DenimRecord
  ): Promise<DenimRecord> {
    const tableSchema = this.getTable(table);
    const tablePath = path.join(this.rootPath, tableSchema.id);
    const id = record.id || randomString({ length: 32 });
    const recordPath = path.join(tablePath, `${id}.json`);
    let currentRecord: DenimRecord = {};

    if (fsnp.existsSync(recordPath)) {
      currentRecord = await this.retrieveRecordFromPath(
        id,
        recordPath,
        tableSchema
      );
    }

    let storedRecord: any = {
      id,
      ...currentRecord,
      ...record,
    };

    Object.keys(storedRecord).forEach((key) => {
      const value = storedRecord[key];

      if (typeof(value) === 'object' && value?.type === 'record-collection') {
        storedRecord[key] = value.records.map(({ id }: any) => id);
      }

      if (typeof(value) === 'object' && value?.type === 'record') {
        storedRecord[key] = value.id;
      }
    });

    await fs.writeFile(recordPath, JSON.stringify(storedRecord));

    return {
      id,
      ...currentRecord,
      ...record,
    };
  }

  protected async delete(table: string, id: string): Promise<void> {
    const tableSchema = this.getTable(table);
    const tablePath = path.join(this.rootPath, tableSchema.id);
    const recordPath = path.join(tablePath, `${id}.json`);

    if (fsnp.existsSync(recordPath)) {
      await fs.unlink(recordPath);
    }
  }
}
