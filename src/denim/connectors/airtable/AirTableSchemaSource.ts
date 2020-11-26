import { DenimColumnType, DenimSchema, DenimSelectProperties } from '../../core';
import { DenimSchemaSource, DenimValidator } from '../../service';
import AirTableValidator from './AirTableValidator';
import { AirTable, AirTableColumn } from './types/schema';

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

export default class AirTableSchemaSource<T> extends DenimSchemaSource<T> {
  public airtableSchema: AirTable[];

  public static convertSchema(schema: AirTable[]): DenimSchema {
    return {
      tables: schema.map((airtable) => {
        return {
          id: airtable.id,
          name: airtable.name,
          label: airtable.name,
          nameField: airtable.columns[0].name,
          columns: airtable.columns.map((column) => {
            if (column.type === 'text' || column.type === 'phone') {
              return {
                name: column.name,
                type: DenimColumnType.Text,
                properties: {
                  long: false,
                },
              };
            }

            if (column.type === 'multilineText') {
              return {
                name: column.name,
                type: DenimColumnType.Text,
                properties: {
                  long: true,
                },
              };
            }

            if (column.type === 'select') {
              return {
                name: column.name,
                type: DenimColumnType.Select,
                properties: getSelectProperties(column),
              };
            }

            if (column.type === 'multiSelect') {
              return {
                name: column.name,
                type: DenimColumnType.MultiSelect,
                properties: getSelectProperties(column),
              };
            }

            if (column.type === 'checkbox') {
              return {
                name: column.name,
                type: DenimColumnType.Boolean,
              };
            }

            if (column.type === 'date') {
              return {
                name: column.name,
                type: DenimColumnType.DateTime,
                properties: {
                  includesTime: column.typeOptions?.isDateTime,
                },
              };
            }

            if (column.type === 'number') {
              return {
                name: column.name,
                type: DenimColumnType.Number,
              };
            }

            if (column.type === 'foreignKey') {
              return {
                name: column.name,
                type: DenimColumnType.ForeignKey,
                properties: {
                  foreignTableId: column.typeOptions?.foreignTableId || '',
                  multiple: column.typeOptions?.relationship === 'many',
                },
              };
            }

            return {
              name: column.name,
              type: DenimColumnType.ReadOnly,
            };
          }),
        };
      }),
    };
  }

  constructor(airtableSchema: AirTable[]) {
    super(AirTableSchemaSource.convertSchema(airtableSchema));
    this.airtableSchema = airtableSchema;
  }

  createValidator(table: string): DenimValidator<T> {
    const tableSchema = this.airtableSchema.find(
      ({ name, id }) => name === table || id === table,
    );

    const denimTableSchema = this.schema.tables.find(({ id, name }) => name === table || id === table);

    if (!denimTableSchema || !tableSchema) {
      throw new Error('Unknown table ' + table + '.');
    }

    return new AirTableValidator(denimTableSchema, tableSchema);
  }
}
