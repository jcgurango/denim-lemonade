import { Schema } from 'yup';
import { DenimValidator } from '.';
import { DenimColumn, DenimDataContext, DenimSchema } from '../core';

interface ValidationHook<T extends DenimDataContext> {
  table: string | RegExp;
  validation: (
    context: T,
    table: string,
    column: DenimColumn | null,
    validation: Schema<any, object>,
  ) => Schema<any, object>;
}

export default abstract class DenimSchemaSource<T extends DenimDataContext> {
  public schema: DenimSchema;
  public validationHooks: ValidationHook<T>[];

  constructor(schema: DenimSchema) {
    this.schema = schema;
    this.validationHooks = [];
  }

  abstract createValidator(table: string): DenimValidator<T>;

  registerValidationHook(
    table: string | RegExp,
    validation: (
      context: T,
      table: string,
      column: DenimColumn | null,
      validation: Schema<any, object>,
    ) => Schema<any, object>,
  ) {
    this.validationHooks.push({
      table,
      validation,
    });
  }

  executeValidationHooks(
    table: string,
    context: T,
    column: DenimColumn | null,
    validation: Schema<any, object>,
  ): Schema<any, object> {
    return this.validationHooks
      .filter(({ table: t }) =>
        typeof t === 'string' ? table === t : t.test(table),
      )
      .reduce((current, next) => {
        return next.validation(context, table, column, current);
      }, validation);
  }
}
