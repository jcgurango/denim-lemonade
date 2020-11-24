import Record from 'airtable/lib/record';
import Table from 'airtable/lib/table';
import { QueryParams } from 'airtable/lib/query_params';
import { AirTableDataSource } from '..';
import {
  DenimColumn,
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
import { NumberSchema, Schema, StringSchema } from 'yup';

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

      if (fieldValue && typeof(fieldValue) === 'object' && (fieldValue.type === 'record' || fieldValue.type === 'record-collection')) {
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
      (<any>(newFields))[column] = fieldValue;

      if (fieldValue && Array.isArray(fieldValue)) {
        const columnSchema = this.airtableSchema.columns.find(
          ({ name }) => name === column,
        );

        if (columnSchema && columnSchema.type === 'foreignKey') {
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
      return `${this.operatorToFormula(
        condition.operator,
        condition.field === 'id' ? 'RECORD_ID()' : `{${condition.field}}`,
        `'${condition.value}'`,
      )}`;
    }

    return `1 = 1`;
  }

  private conditionGroupToFormula(condition: DenimQueryConditionGroup): string {
    return `${condition.type}(${condition.conditions
      .map((c) => this.conditionToFormula(c))
      .join(`, `)})`;
  }

  public createFieldValidator(
    context: DenimDataContext,
    field: DenimColumn,
  ): Schema<any, object> {
    let validation = super.createFieldValidator(context, field);

    // Find the corresponding AirTable field.
    const atField = this.airtableSchema.columns.find(
      ({ name }) => name === field.name,
    );

    if (atField) {
      // Add additional validations for the AirTable types.
      if (
        atField.type === 'text' ||
        (atField.type === 'multilineText' && atField.typeOptions)
      ) {
        if (atField.typeOptions?.validatorName == 'email') {
          return (<StringSchema<any, object>>validation).email();
        }

        if (atField.typeOptions?.validatorName == 'url') {
          return (<StringSchema<any, object>>validation).url();
        }
      }

      if (atField.type === 'phone') {
        return (<StringSchema<any, object>>validation).matches(
          /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g,
        );
      }

      if (atField.type === 'number') {
        if (
          atField?.typeOptions &&
          atField.typeOptions.validatorName === 'positive'
        ) {
          return (<NumberSchema<any, object>>validation).min(0);
        }
      }
    }

    return validation;
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

    if (query?.pageSize) {
      params.pageSize = query.pageSize;
    }

    // Retrieve the records.
    const atQuery = this.tableData.select(params);

    if (query?.page) {
      return new Promise((resolve) => {
        let pageNum = 1;

        atQuery.eachPage((page, nextPage) => {
          if (pageNum === query.page) {
            resolve(
              page.map((record) => this.mapAirtableToDenimRecord(record)),
            );
            return;
          }

          pageNum++;
          nextPage();
        });
      });
    }

    const records = await atQuery.all();

    return records.map((record) => this.mapAirtableToDenimRecord(record));
  }

  protected async save(record: DenimRecord): Promise<DenimRecord> {
    if (record.id) {
      const atRecord = await this.tableData.update(record.id, this.mapDenimRecordToAirTableFields(record));

      return this.mapAirtableToDenimRecord(atRecord);
    }

    const atRecord = await this.tableData.create(this.mapDenimRecordToAirTableFields(record));

    return this.mapAirtableToDenimRecord(atRecord);
  }

  protected async delete(id: string): Promise<void> {
    await this.tableData.destroy(id);
  }
}
