import { DenimSchemaSource } from '.';
import { DenimDataContext, DenimTable } from '../core';
import DenimValidator from './DenimValidator';

export default class DenimCombinedSchemaSource<
  T extends DenimDataContext
> extends DenimSchemaSource<T> {
  public schemas: DenimSchemaSource<any>[];

  constructor(...schemaSources: DenimSchemaSource<any>[]) {
    super({
      tables: schemaSources.reduce<DenimTable[]>((current, next) => {
        return [...current, ...next.schema.tables];
      }, []),
    });

    this.schemas = schemaSources;
  }

  createValidator(table: string): DenimValidator<T> {
    for (let i = 0; i < this.schemas.length; i++) {
      const schema = this.schemas[i];
      const tableSchema = schema.hasTableSchema(table);

      if (tableSchema) {
        return schema.createValidator(table);
      }
    }

    throw new Error('Table ' + table + ' not found in any schema source.');
  }
}
