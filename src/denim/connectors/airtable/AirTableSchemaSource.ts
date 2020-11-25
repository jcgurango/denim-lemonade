import { AirTableDataSource } from '.';
import { DenimSchemaSource, DenimValidator } from '../../service';
import AirTableValidator from './AirTableValidator';
import { AirTable } from './types/schema';

export default class AirTableSchemaSource<T> extends DenimSchemaSource<T> {
  public airtableSchema: AirTable[];

  constructor(airtableSchema: AirTable[]) {
    super(AirTableDataSource.convertSchema(airtableSchema));
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
