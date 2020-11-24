import Airtable from 'airtable';
import {
  AirTable,
  AirTableColumn,
} from './types/schema';
import { DenimColumnType, DenimSchema, DenimSelectProperties } from '../../core';
import { AirTableDataProvider } from '.';
import { DenimDataSource, DenimTableDataProvider } from '../../service';

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

export default class AirTableDataSource extends DenimDataSource {
  public base: any;
  private airtableSchema: AirTable[];

  private static convertSchema(schema: AirTable[]): DenimSchema {
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

  constructor(schema: AirTable[], baseId: string) {
    super(AirTableDataSource.convertSchema(schema));
    this.base = Airtable.base(baseId);
    this.airtableSchema = schema;
  }

  public createDataProvider(table: string): DenimTableDataProvider {
    const tableSchema = this.airtableSchema.find(
      ({ name, id }) => name === table || id === table,
    );
    const denimTableSchema = this.schema.tables.find(({ id, name }) => name === table || id === table);

    if (!tableSchema || !denimTableSchema) {
      throw new Error('Unable to find table ' + table + ' in schema.');
    }

    return new AirTableDataProvider(this, denimTableSchema, tableSchema);
  }
}
