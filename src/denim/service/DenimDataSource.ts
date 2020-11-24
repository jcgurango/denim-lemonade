import { Schema } from 'yup';
import { DenimColumn, DenimDataContext, DenimSchema } from '../core';
import DenimTableDataProvider from './DenimTableDataProvider';

interface ValidationHook {
  table: string | RegExp;
  validation: (context: DenimDataContext, table: string, column: DenimColumn | null, validation: Schema<any, object>) => Schema<any, object>;
}

export default abstract class DenimDataSource {
  public schema: DenimSchema;
  public validationHooks: ValidationHook[];

  constructor(schema: DenimSchema) {
    this.schema = schema;
    this.validationHooks = [];
  }

  abstract createDataProvider(table: string): DenimTableDataProvider;

  registerValidationHook(table: string | RegExp, validation: (context: DenimDataContext, table: string, column: DenimColumn | null, validation: Schema<any, object>) => Schema<any, object>) {
    this.validationHooks.push({
      table,
      validation,
    });
  }

  executeValidationHooks(table: string, context: DenimDataContext, column: DenimColumn | null, validation: Schema<any, object>): Schema<any, object> {
    return this.validationHooks.filter(({ table: t }) => typeof(t) === 'string' ? table === t : t.test(table)).reduce((current, next) => {
      return next.validation(context, table, column, current);
    }, validation);
  }
}
