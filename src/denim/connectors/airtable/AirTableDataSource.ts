import Airtable from 'airtable';
import {
  AirTable,
} from './types/schema';
import { DenimDataContext } from '../../core';
import { AirTableDataProvider } from '.';
import { DenimDataSource, DenimTableDataProvider } from '../../service';
import AirTableValidator from './AirTableValidator';
import AirTableSchemaSource from './AirTableSchemaSource';

export default class AirTableDataSource<T extends DenimDataContext, S extends AirTableSchemaSource<T>> extends DenimDataSource<T, S> {
  public base: any;
  private airtableSchema: AirTable[];

  constructor(schema: S, baseId?: string) {
    super(schema);
    this.base = baseId ? Airtable.base(baseId) : null;
    this.airtableSchema = schema.airtableSchema;
  }

  public createDataProvider(table: string): DenimTableDataProvider<T, S> {
    const tableSchema = this.airtableSchema.find(
      ({ name, id }) => name === table || id === table,
    );
    const denimTableSchema = this.schemaSource.schema.tables.find(({ id, name }) => name === table || id === table);

    if (!tableSchema || !denimTableSchema) {
      throw new Error('Unable to find table ' + table + ' in schema.');
    }

    return new AirTableDataProvider(this, denimTableSchema, new AirTableValidator(denimTableSchema, tableSchema), tableSchema);
  }
}
