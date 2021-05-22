import { BaseSchema } from 'yup';
import { DenimValidator } from '.';
import { DenimColumn, DenimDataContext, DenimSchema, DenimTable } from '../core';

interface ValidationHook<T extends DenimDataContext> {
  table: string | RegExp;
  validation: (
    context: T,
    table: string,
    column: DenimColumn | null,
    validation: BaseSchema<any, object>,
  ) => BaseSchema<any, object>;
}

export default abstract class DenimSchemaSource<T extends DenimDataContext> {
  public schema: DenimSchema;
  public validationHooks: ValidationHook<T>[];

  constructor(schema: DenimSchema) {
    this.schema = schema;
    this.validationHooks = [];
  }

  abstract createValidator(table: string): DenimValidator<T>;

  hasTableSchema(table: string): DenimTable | undefined {
    return this.schema.tables.find(({ id, name }) => id === table || name === table);
  }

  findTableSchema(table: string): DenimTable {
    const tableSchema = this.schema.tables.find(({ id, name }) => id === table || name === table);

    if (!tableSchema) {
      throw new Error('Unknown table ' + table + '.');
    }

    return tableSchema;
  }
}
