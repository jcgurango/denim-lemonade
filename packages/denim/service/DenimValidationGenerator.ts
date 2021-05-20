import dayjs from 'dayjs';
import {
  DenimColumn,
  DenimColumnType,
  DenimTable,
  YupAst,
} from '../core';

const RecordSchemaShape = {
  type: [['yup.string'], ['yup.required'], ['yup.equals', ['record']]],
  id: [['yup.string', ['yup.required']]],
  name: [['yup.string'], ['yup.nullable', true]],
  record: [['yup.mixed'], ['yup.nullable', true]],
};

const RecordCollectionSchemaShape = {
  type: [
    ['yup.string'],
    ['yup.required'],
    ['yup.equals', ['record-collection']],
  ],
  record: [['yup.array', [['yup.object'], ['yup.shape', RecordSchemaShape]]]],
};

export const CommonShapes = {
  Record: RecordSchemaShape,
  RecordCollection: RecordCollectionSchemaShape,
};

export default class DenimValidationGenerator {
  static createForeignKeyValidator(
    field: DenimColumn,
  ): YupAst {
    // Validate the shape.
    if (field.type === DenimColumnType.ForeignKey) {
      if (field.properties.multiple) {
        return [
          ['yup.object'],
          ['yup.shape', CommonShapes.RecordCollection],
          ['yup.nullable', true],
          ['yup.default', null],
        ];
      } else {
        return [
          ['yup.object'],
          ['yup.shape', CommonShapes.Record],
          ['yup.nullable', true],
          ['yup.default', null],
        ];
      }
    }

    return ['yup.mixed'];
  }

  static createFieldValidator(
    field: DenimColumn,
  ): YupAst {
    switch (field.type) {
      case DenimColumnType.ForeignKey:
        return DenimValidationGenerator.createForeignKeyValidator(field);
      case DenimColumnType.Boolean:
        return [['yup.boolean'], ['yup.nullable', true]];
      case DenimColumnType.DateTime:
        if (!field.properties.includesTime) {
          return [
            ['yup.string'],
            ['yup.nullable', true],
            [
              'yup.transform',
              function (this: any, value: any) {
                if (!value) {
                  return null;
                }

                // First validate that this is a date.
                const parsed = dayjs(value);

                if (parsed.isValid()) {
                  return parsed.format('YYYY-MM-DD');
                }

                return new Date('');
              },
            ],
            ['yup.typeError', field.name + ' must be a valid date.'],
          ];
        }

        return [['yup.date'], ['yup.nullable', true]];
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
          [
            'yup.array',
            [
              ['yup.string'],
              ['yup.oneOf', field.properties.options.map(({ value }) => value)],
            ],
          ],
          ['yup.nullable', true],
        ];
      case DenimColumnType.Number:
        return [
          ['yup.number'],
          ['yup.transform', function (this: any, value: any, originalValue: any) {
            if (isNaN(value) && typeof(originalValue) === 'string') {
              return +originalValue.replace(/\,/g, '');
            }

            return value;
          }],
          ['yup.nullable', true],
        ];
      case DenimColumnType.Text:
        return [['yup.string'], ['yup.nullable', true]];
      case DenimColumnType.ReadOnly:
        return [['yup.mixed'], ['yup.nullable', true]];
    }
  }

  static createValidatorShape(schema: DenimTable): any {
    const shape: { [key: string]: YupAst } = {};

    schema.columns.forEach((value) => {
      shape[value.name] = DenimValidationGenerator.createFieldValidator(
        value,
      );
    });

    return shape;
  }
}
