import * as Yup from 'yup';
import { ObjectSchema, Schema } from 'yup';
import {
  DenimColumn,
  DenimColumnType,
  DenimDataContext,
  DenimSchema,
  DenimTable,
  YupAst,
} from '../core';

const RecordSchemaShape = {
  type: [['yup.string'], ['yup.required'], ['yup.equals', ['record']]],
  id: [['yup.string', ['yup.required']]],
  name: [['yup.string'], ['yup.nullable', true]],
  record: [['yup.mixed'], ['yup.nullable']],
};

const RecordCollectionSchemaShape = {
  type: Yup.string().required().equals(['record-collection']),
  record: [
    ['yup.array', [['yup.object'], ['yup.shape', RecordSchemaShape]]],
  ],
};

export const CommonShapes = {
  Record: RecordSchemaShape,
  RecordCollection: RecordCollectionSchemaShape,
};

interface ValidationHook {
  table: string | RegExp;
  validation: (
    context: DenimDataContext,
    table: string,
    column: DenimColumn | null,
    validation: YupAst,
  ) => YupAst;
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
  ): YupAst {
    // Validate the shape.
    if (field.type === DenimColumnType.ForeignKey) {
      if (field.properties.multiple) {
        return [['yup.object'], ['yup.shape', CommonShapes.RecordCollection], ['yup.nullable', true], ['yup.default', null]];
      } else {
        return [['yup.object'], ['yup.shape', CommonShapes.Record], ['yup.nullable', true], ['yup.default', null]];
      }
    }

    return ['yup.mixed'];
  }

  createFieldValidator(
    context: T,
    table: DenimTable,
    field: DenimColumn,
  ): YupAst {
    switch (field.type) {
      case DenimColumnType.ForeignKey:
        return this.createForeignKeyValidator(context, table, field);
      case DenimColumnType.Boolean:
        return ['yup.boolean', ['yup.nullable', true]];
      case DenimColumnType.DateTime:
        return ['yup.date', ['yup.nullable', true]];
      case DenimColumnType.Select:
        return [
          ['yup.string'],
          ['yup.nullable', true],
          [
            'yup.oneOf',
            [null].concat(
              <any>field.properties.options.map(({ value }) => value),
            ),
          ],
        ];
      case DenimColumnType.MultiSelect:
        return [
          ['yup.nullable', true],
          [
            'yup.array',
            [
              ['yup.string'],
              ['yup.oneOf', field.properties.options.map(({ value }) => value)],
            ],
          ],
        ];
      case DenimColumnType.Number:
        return [['yup.number'], ['yup.nullable', true]];
      case DenimColumnType.Text:
        return [['yup.string'], ['yup.nullable', true]];
      case DenimColumnType.ReadOnly:
        return [['yup.mixed'], ['yup.nullable', true]];
    }
  }

  createValidator(context: T): YupAst {
    const shape: { [key: string]: YupAst } = {};

    this.schema.columns.forEach((value) => {
      shape[value.name] = this.createFieldValidator(
        context,
        this.schema,
        value,
      );
      shape[value.name] = this.executeValidationHooks(
        this.schema.name,
        context,
        value,
        shape[value.name],
      );
    });

    return this.executeValidationHooks(this.schema.name, context, null, [
      ['yup.object'],
      ['yup.shape', shape],
    ]);
  }

  registerValidationHook(
    table: string | RegExp,
    validation: (
      context: DenimDataContext,
      table: string,
      column: DenimColumn | null,
      validation: YupAst,
    ) => YupAst,
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
    validation: YupAst,
  ): YupAst {
    return this.validationHooks
      .filter(({ table: t }) =>
        typeof t === 'string' ? table === t : t.test(table),
      )
      .reduce((current, next) => {
        return next.validation(context, table, column, current);
      }, validation);
  }
}
