import Record from 'airtable/lib/record';
import Table from 'airtable/lib/table';
import { QueryParams } from 'airtable/lib/query_params';
import { AirTableDataSource } from '..';
import {
  DenimQuery,
  DenimQueryConditionGroup,
  DenimQueryConditionOrGroup,
  DenimQueryOperator,
  DenimRecord,
  DenimTable,
} from '../../../core';
import { AirTable } from '../types/schema';
import { DenimTableDataProvider } from '../../../service';

export default class AirTableDataProvider extends DenimTableDataProvider {
  public tableData: Table;
  private airtableSchema: AirTable;

  constructor(
    dataSource: AirTableDataSource,
    schema: DenimTable,
    airtableSchema: AirTable,
  ) {
    super(dataSource, schema);
    this.tableData = dataSource.base.table(airtableSchema.name);
    this.airtableSchema = airtableSchema;
  }

  private mapAirtableToDenimRecord(record: Record): DenimRecord {
    // Turn any foreign keys into denim data.
    Object.keys(record.fields).forEach((column) => {
      const fieldValue = record.fields[column];

      if (fieldValue && Array.isArray(fieldValue)) {
        const columnSchema = this.airtableSchema.columns.find(
          ({ name }) => name === column,
        );

        if (columnSchema && columnSchema.type === 'foreignKey') {
          if (columnSchema.typeOptions?.relationship === 'many') {
            // Retrieve the name field asynchronously.
            record.fields[column] = {
              type: 'record-collection',
              records: fieldValue.map((id) => ({
                type: 'record-collection',
                id,
                name: '',
              })),
            };
          }

          if (
            columnSchema.typeOptions?.relationship === 'one' &&
            fieldValue[0]
          ) {
            record.fields[column] = {
              type: 'record',
              id: fieldValue[0],
              name: '',
            };
          }
        }
      }
    });

    return {
      id: record.id,
      ...record.fields,
    };
  }

  private operatorToFormula(operator: DenimQueryOperator, left: string, right: string): string {
    switch (operator) {
      case DenimQueryOperator.Equals:
        return `${left} = ${right}`;
      case DenimQueryOperator.NotEquals:
        return `${left} != ${right}`;
      case DenimQueryOperator.StringContains:
        return `FIND(${right}, ${left}) > -1`;
      case DenimQueryOperator.StringNotContains:
        return `FIND(${right}, ${left}) = -1`;
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
      return `${this.operatorToFormula(condition.operator, condition.field === 'id' ? 'RECORD_ID()' : `{${condition.field}}`, `'${condition.value}'`)}`;
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
      params.filterByFormula = this.conditionGroupToFormula(query.conditions);
    }

    // Retrieve the records.
    const atQuery = this.tableData.select(params);
    const records = await atQuery.all();

    return records.map((record) => this.mapAirtableToDenimRecord(record));
  }

  protected save(record: DenimRecord): Promise<void> {
    throw new Error('Method not implemented.');
  }

  protected delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
