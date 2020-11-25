import * as Yup from 'yup';
import { ObjectSchema, Schema } from 'yup';
import {
  DenimColumn,
  DenimColumnType,
  DenimDataContext,
  DenimSchema,
  DenimTable,
} from '../core';

const RecordSchemaShape = {
  type: Yup.string().required().equals(['record']),
  id: Yup.string().required(),
  name: Yup.string().nullable(),
  record: Yup.mixed().nullable(),
};

const RecordCollectionSchemaShape = {
  type: Yup.string().required().equals(['record-collection']),
  record: Yup.array(Yup.object().shape(RecordSchemaShape)),
};

export const CommonShapes = {
  Record: RecordSchemaShape,
  RecordCollection: RecordCollectionSchemaShape,
};

export const CommonSchema = {
  Record: Yup.object().shape(CommonShapes.Record),
  RecordCollection: Yup.object().shape(CommonShapes.RecordCollection),
};

interface ValidationHook {
  table: string | RegExp;
  validation: (
    context: DenimDataContext,
    table: string,
    column: DenimColumn | null,
    validation: Schema<any, object>,
  ) => Schema<any, object>;
}

export default class DenimValidator<T extends DenimDataContext> {
  private schema: DenimTable;
  public validationHooks: ValidationHook[];

  constructor(schema: DenimTable) {
    this.schema = schema;
    this.validationHooks = [];
  }

  createForeignKeyValidator(
    context: T,
    table: DenimTable,
    field: DenimColumn,
  ): Schema<any, object> {
    // Validate the shape.
    if (field.type === DenimColumnType.ForeignKey) {
      if (field.properties.multiple) {
        return CommonSchema.RecordCollection.nullable(true).default(null);
      } else {
        return CommonSchema.Record.nullable(true).default(null);
      }
    }

    return Yup.mixed();
  }

  createFieldValidator(
    context: T,
    table: DenimTable,
    field: DenimColumn,
  ): Schema<any, object> {
    switch (field.type) {
      case DenimColumnType.ForeignKey:
        return this.createForeignKeyValidator(context, table, field);
      case DenimColumnType.Boolean:
        return Yup.boolean().nullable(true);
      case DenimColumnType.DateTime:
        return Yup.date().nullable(true);
      case DenimColumnType.Select:
        return Yup.string().nullable(true).oneOf(
          [null].concat(<any>(field.properties.options.map(({ value }) => value))),
        );
      case DenimColumnType.MultiSelect:
        return Yup.array(
          Yup.string().oneOf(
            field.properties.options.map(({ value }) => value),
          ),
        ).nullable(true);
      case DenimColumnType.Number:
        return Yup.number().nullable(true);
      case DenimColumnType.Text:
        return Yup.string().nullable(true);
      case DenimColumnType.ReadOnly:
        return Yup.mixed().nullable(true);
    }
  }

  createValidator(
    context: T,
  ): ObjectSchema<any, object> {
    const shape: { [key: string]: Schema<any, object> } = {};

    this.schema.columns.forEach((value) => {
      shape[value.name] = this.createFieldValidator(context, this.schema, value);
      shape[value.name] = this.executeValidationHooks(
        this.schema.name,
        context,
        value,
        shape[value.name],
      );
    });

    return <Yup.ObjectSchema<any, object>>(
      this.executeValidationHooks(
        this.schema.name,
        context,
        null,
        Yup.object().shape(shape),
      )
    );
  }

  registerValidationHook(
    table: string | RegExp,
    validation: (
      context: DenimDataContext,
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
    context: DenimDataContext,
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
