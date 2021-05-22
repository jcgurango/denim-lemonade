import { AirTable, AirTableColumn } from './types/schema';
import {
  DenimRecord,
  DenimQuery,
  DenimSchema,
  DenimColumnType,
  DenimSelectProperties,
  DenimQueryOperator,
  DenimQueryConditionOrGroup,
  DenimQueryConditionGroup,
  DenimTable,
  DenimColumn,
  DenimDataSourceV2,
} from 'denim';
import Base from 'airtable/lib/base';
import Record from 'airtable/lib/record';
import { QueryParams } from 'airtable/lib/query_params';
import Airtable from 'airtable';

const getSelectProperties = (column: AirTableColumn): DenimSelectProperties => {
  if (column.type === 'select' || column.type === 'multiSelect') {
    return {
      options:
        column.typeOptions?.choiceOrder?.map((choice) => ({
          value: column.typeOptions?.choices[choice].name || '',
          label: column.typeOptions?.choices[choice].name || '',
        })) || [],
    };
  }

  return { options: [] };
};

const convertColumn = (
  schema: AirTable[],
  table: AirTable,
  column: AirTableColumn
): DenimColumn => {
  if (column.type === 'text' || column.type === 'phone') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.Text,
      properties: {
        long: false,
      },
    };
  }

  if (column.type === 'multilineText') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.Text,
      properties: {
        long: true,
      },
    };
  }

  if (column.type === 'select') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.Select,
      properties: getSelectProperties(column),
    };
  }

  if (column.type === 'multiSelect') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.MultiSelect,
      properties: getSelectProperties(column),
    };
  }

  if (column.type === 'checkbox') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.Boolean,
      properties: undefined,
    };
  }

  if (column.type === 'date') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.DateTime,
      properties: {
        includesTime: column.typeOptions?.isDateTime,
      },
    };
  }

  if (column.type === 'number') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.Number,
      properties: undefined,
    };
  }

  if (column.type === 'foreignKey') {
    return {
      name: column.name,
      label: column.name,
      type: DenimColumnType.ForeignKey,
      properties: {
        foreignTableId: column.typeOptions?.foreignTableId || '',
        multiple: column.typeOptions?.relationship === 'many',
      },
    };
  }

  if (column.type === 'lookup') {
    // Find the lookup column.
    const relationshipColumn = table.columns.find(
      ({ id }) => id === column.typeOptions?.relationColumnId
    );

    if (relationshipColumn && relationshipColumn.type === 'foreignKey') {
      const foreignTable = schema.find(
        ({ id }) => id === relationshipColumn.typeOptions?.foreignTableId
      );

      if (foreignTable) {
        const foreignColumn = foreignTable.columns.find(
          ({ id }) => id === column.typeOptions?.foreignTableRollupColumnId
        );

        if (foreignColumn) {
          return {
            ...convertColumn(schema, foreignTable, foreignColumn),
            defaultControlProps: {
              disabled: true,
            },
          };
        }
      }
    }
  }

  if (column.type === 'formula' && column.typeOptions?.resultType) {
    const formulaColumn = {
      ...column,
      type: column.typeOptions.resultType,
    } as AirTableColumn;

    return {
      ...convertColumn(schema, table, formulaColumn as AirTableColumn),
      defaultControlProps: {
        disabled: true,
      },
    };
  }

  return {
    name: column.name,
    label: column.name,
    type: DenimColumnType.ReadOnly,
    properties: undefined,
  };
};

const convertSchema = (schema: AirTable[]): DenimSchema => {
  return {
    tables: schema.map((airtable) => {
      return {
        id: airtable.id,
        name: airtable.name,
        label: airtable.name,
        nameField: airtable.columns[0].name,
        columns: airtable.columns.map(
          convertColumn.bind(null, schema, airtable)
        ),
      };
    }),
  };
};

export default class AirTableDataSourceV2 extends DenimDataSourceV2 {
  public base: Base;
  public airtableSchema: AirTable[];

  constructor(base: Base | string, schema: AirTable[]) {
    super();
    this.base =
      typeof base === 'string' ? ((Airtable.base(base) as any) as Base) : base;
    this.schema = convertSchema(schema);
    this.airtableSchema = schema;
  }

  public static configure(
    params: Pick<
      Airtable.AirtableOptions,
      | 'apiKey'
      | 'endpointUrl'
      | 'apiVersion'
      | 'noRetryIfRateLimited'
      | 'requestTimeout'
    >
  ) {
    Airtable.configure(params);
  }

  private mapDenimRecordToAirTableFields(
    table: string,
    record: DenimRecord
  ): any {
    const tableSchema = this.getTable(table);

    // Turn any foreign keys into denim data.
    const newFields: any = {};

    Object.keys(record).forEach((column) => {
      const columnSchema = tableSchema.columns.find(
        ({ name }) => name === column
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

  private mapAirtableToDenimRecord(
    table: string,
    record: Record<any>
  ): DenimRecord {
    const airtableSchema = this.airtableSchema.find(
      ({ name, id }) => name === table || id === table
    );

    if (!airtableSchema) {
      throw new Error('No table found: ' + table);
    }

    // Turn any foreign keys into denim data.
    const newFields: DenimRecord = {};

    if (record.id) {
      newFields.id = record.id;
    }

    Object.keys(record.fields).forEach((column) => {
      const fieldValue = record.fields[column];
      (newFields as any)[column] = fieldValue;

      const columnSchema = airtableSchema.columns.find(
        ({ name }) => name === column
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
    right: string
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

  private conditionToFormula(
    tableSchema: DenimTable,
    condition: DenimQueryConditionOrGroup
  ): string {
    if (condition.conditionType === 'group') {
      return this.conditionGroupToFormula(tableSchema, condition);
    }

    if (condition.conditionType === 'single') {
      let left =
        condition.field === 'id' ? 'RECORD_ID()' : `{${condition.field}}`;
      let right = `'${condition.value}'`;
      const column = tableSchema.columns.find(
        ({ name }) => name === condition.field
      );

      if (column && column.type === DenimColumnType.Text) {
        left = 'LOWER(' + left + ')';
        right = 'LOWER(' + right + ')';
      }

      return `${this.operatorToFormula(condition.operator, left, right)}`;
    }

    return `1 = 1`;
  }

  private conditionGroupToFormula(
    tableSchema: DenimTable,
    condition: DenimQueryConditionGroup
  ): string {
    return `${condition.type}(${condition.conditions
      .map((c) => this.conditionToFormula(tableSchema, c))
      .join(`, `)})`;
  }

  protected async retrieve(
    table: string,
    id: string
  ): Promise<DenimRecord | null> {
    // Retrieve the record.
    const record = await this.base.table(table).find(id);

    if (record) {
      return this.mapAirtableToDenimRecord(table, record);
    }

    return null;
  }

  protected async query(
    table: string,
    query?: DenimQuery
  ): Promise<DenimRecord[]> {
    const params: QueryParams<any> = {};
    const tableSchema = this.getTable(table);

    if (query?.conditions) {
      params.filterByFormula = this.conditionToFormula(
        tableSchema,
        query.conditions
      );
    }

    if (query?.pageSize) {
      params.pageSize = query.pageSize;
    }

    if (query?.view || tableSchema.defaultView) {
      const view = query?.view || tableSchema.defaultView;

      if (view === 'related') {
        params.fields = [tableSchema.nameField];
      } else {
        params.view = query?.view || tableSchema.defaultView;
      }
    }

    if (query?.sort) {
      if (Array.isArray(query.sort)) {
        params.sort = query.sort.map((sort) => ({
          field: sort.column,
          direction: sort.ascending ? 'asc' : 'desc',
        }));
      } else {
        params.sort = [
          {
            field: query.sort.column,
            direction: query.sort.ascending ? 'asc' : 'desc',
          },
        ];
      }
    }

    // Retrieve the records.
    const atQuery = this.base.table(table).select(params);

    if (query?.page && query.page > 1) {
      return new Promise(async (resolve) => {
        let pageNum = 1;

        await atQuery.eachPage((page, nextPage) => {
          if (pageNum === query.page) {
            resolve(
              page.map((record) => this.mapAirtableToDenimRecord(table, record))
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
        this.mapAirtableToDenimRecord(table, record)
      );
    }

    const records = await atQuery.firstPage();

    return records.map((record) =>
      this.mapAirtableToDenimRecord(table, record)
    );
  }

  protected async save(
    table: string,
    record: DenimRecord
  ): Promise<DenimRecord> {
    if (record.id) {
      const atRecord = await this.base
        .table(table)
        .update(record.id, this.mapDenimRecordToAirTableFields(table, record));

      return this.mapAirtableToDenimRecord(table, atRecord);
    }

    const atRecord = await this.base
      .table(table)
      .create(this.mapDenimRecordToAirTableFields(table, record));

    return this.mapAirtableToDenimRecord(table, atRecord[0]);
  }

  protected async delete(table: string, id: string): Promise<void> {
    await this.base.table(table).destroy(id);
  }
}
