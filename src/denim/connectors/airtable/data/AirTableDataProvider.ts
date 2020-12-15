import Record from 'airtable/lib/record';
import Table from 'airtable/lib/table';
import { QueryParams } from 'airtable/lib/query_params';
import { AirTableDataSource } from '..';
import {
  DenimColumnType,
  DenimDataContext,
  DenimQuery,
  DenimQueryConditionGroup,
  DenimQueryConditionOrGroup,
  DenimQueryOperator,
  DenimRecord,
  DenimTable,
} from '../../../core';
import { AirTable } from '../types/schema';
import { DenimTableDataProvider } from '../../../service';
import DenimValidator from '../../../service/DenimValidator';
import AirTableSchemaSource from '../AirTableSchemaSource';

/**
 * Data provider for a single AirTable.
 */
export default class AirTableDataProvider<
  T extends DenimDataContext,
  S extends AirTableSchemaSource<T>
> extends DenimTableDataProvider<T, S> {
  public tableData: Table;
  private airtableSchema: AirTable;

  constructor(
    dataSource: AirTableDataSource<T, S>,
    schema: DenimTable,
    validator: DenimValidator<T>,
    airtableSchema: AirTable,
  ) {
    super(dataSource, schema, validator);
    this.tableData = dataSource.base.table(airtableSchema.name);
    this.airtableSchema = airtableSchema;
  }

  private mapDenimRecordToAirTableFields(record: DenimRecord): any {
    // Turn any foreign keys into denim data.
    const newFields: any = {};

    Object.keys(record).forEach((column) => {
      const columnSchema = this.tableSchema.columns.find(
        ({ name }) => name === column,
      );

      const fieldValue = record[column];

      if (!columnSchema || columnSchema.type === DenimColumnType.ReadOnly) {
        return;
      }

      newFields[column] = fieldValue;

      if (
        fieldValue &&
        typeof fieldValue === 'object' &&
        (fieldValue.type === 'record' ||
          fieldValue.type === 'record-collection')
      ) {
        if (fieldValue.type === 'record') {
          newFields[column] = [fieldValue.id];
        }

        if (fieldValue.type === 'record-collection') {
          newFields[column] = fieldValue.records.map(({ id }) => id);
        }
      }
    });

    return newFields;
  }

  private mapAirtableToDenimRecord(record: Record): DenimRecord {
    // Turn any foreign keys into denim data.
    const newFields: DenimRecord = {};

    if (record.id) {
      newFields.id = record.id;
    }

    Object.keys(record.fields).forEach((column) => {
      const fieldValue = record.fields[column];
      (<any>newFields)[column] = fieldValue;

      const columnSchema = this.airtableSchema.columns.find(
        ({ name }) => name === column,
      );

      if (fieldValue && Array.isArray(fieldValue)) {
        if (columnSchema?.type === 'foreignKey') {
          if (columnSchema.typeOptions?.relationship === 'many') {
            // Retrieve the name field asynchronously.
            newFields[column] = {
              type: 'record-collection',
              records: fieldValue.map((id) => ({
                type: 'record',
                id,
                name: '',
              })),
            };
          }

          if (
            columnSchema.typeOptions?.relationship === 'one' &&
            fieldValue[0]
          ) {
            newFields[column] = {
              type: 'record',
              id: fieldValue[0],
              name: '',
            };
          }
        }
      }
    });

    return newFields;
  }

  private operatorToFormula(
    operator: DenimQueryOperator,
    left: string,
    right: string,
  ): string {
    switch (operator) {
      case DenimQueryOperator.Equals:
        return `${left} = ${right}`;
      case DenimQueryOperator.DoesNotEqual:
        return `${left} != ${right}`;
      case DenimQueryOperator.Contains:
        return `FIND(${right}, ${left})`;
      case DenimQueryOperator.DoesNotContain:
        return `NOT(FIND(${right}, ${left}))`;
      case DenimQueryOperator.GreaterThan:
        return `${left} > ${right}`;
      case DenimQueryOperator.LessThan:
        return `${left} < ${right}`;
      case DenimQueryOperator.GreaterThanOrEqual:
        return `${left} >= ${right}`;
      case DenimQueryOperator.LessThanOrEqual:
        return `${left} <= ${right}`;
      case DenimQueryOperator.NotNull:
        return `NOT(${left} = '')`;
      case DenimQueryOperator.Null:
        return `${left} = ''`;
    }
  }

  private conditionToFormula(condition: DenimQueryConditionOrGroup): string {
    if (condition.conditionType === 'group') {
      return this.conditionGroupToFormula(condition);
    }

    if (condition.conditionType === 'single') {
      let left = condition.field === 'id' ? 'RECORD_ID()' : `{${condition.field}}`;
      let right = `'${condition.value}'`;
      const column = this.tableSchema.columns.find(({ name }) => name === condition.field);

      if (column && column.type === DenimColumnType.Text) {
        left = 'LOWER(' + left + ')';
        right = 'LOWER(' + right + ')';
      }

      return `${this.operatorToFormula(
        condition.operator,
        left,
        right,
      )}`;
    }

    return `1 = 1`;
  }

  private conditionGroupToFormula(condition: DenimQueryConditionGroup): string {
    return `${condition.type}(${condition.conditions
      .map((c) => this.conditionToFormula(c))
      .join(`, `)})`;
  }

  protected async retrieve(id: string): Promise<DenimRecord | null> {
    // Retrieve the record.
    const record = await this.tableData.find(id);

    if (record) {
      return this.mapAirtableToDenimRecord(record);
    }

    return null;
  }

  protected async query(query?: DenimQuery): Promise<DenimRecord[]> {
    const params: QueryParams = {};

    if (query?.conditions) {
      params.filterByFormula = this.conditionToFormula(query.conditions);
    }

    if (query?.pageSize) {
      params.pageSize = query.pageSize;
    }

    if (query?.view || this.tableSchema.defaultView) {
      const view = query?.view || this.tableSchema.defaultView;

      if (view === 'related') {
        params.fields = [this.tableSchema.nameField];
      } else {
        params.view = query?.view || this.tableSchema.defaultView;
      }
    }

    // Retrieve the records.
    const atQuery = this.tableData.select(params);

    if (query?.page && query.page > 1) {
      return new Promise(async (resolve) => {
        let pageNum = 1;

        await atQuery.eachPage((page, nextPage) => {
          if (pageNum === query.page) {
            resolve(
              page.map((record) => this.mapAirtableToDenimRecord(record)),
            );
            return;
          }

          pageNum++;
          nextPage();
        });

        resolve([]);
      });
    }

    if (query?.retrieveAll) {
      return (await atQuery.all()).map((record) =>
        this.mapAirtableToDenimRecord(record),
      );
    }

    const records = await atQuery.firstPage();

    return records.map((record) => this.mapAirtableToDenimRecord(record));
  }

  protected async save(record: DenimRecord): Promise<DenimRecord> {
    console.log(record);
    if (record.id) {
      const atRecord = await this.tableData.update(
        record.id,
        this.mapDenimRecordToAirTableFields(record),
      );

      return this.mapAirtableToDenimRecord(atRecord);
    }

    const atRecord = await this.tableData.create(
      this.mapDenimRecordToAirTableFields(record),
    );

    return this.mapAirtableToDenimRecord(atRecord);
  }

  protected async delete(id: string): Promise<void> {
    await this.tableData.destroy(id);
  }
}
