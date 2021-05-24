import dayjs from 'dayjs';
import { DenimColumnType, YupAst, DenimDataSourceV2 } from 'denim';

export const LemonadeValidations = (dataSource: DenimDataSourceV2) => {
  dataSource.registerHook({
    type: 'field-validation',
    table: /.*/g,
    callback: async (table, tableSchema, columnSchema, validation) => {
      if (columnSchema && columnSchema.type === DenimColumnType.DateTime) {
        return [
          tableSchema,
          columnSchema,
          validation.test({
            test: (value: any) => {
              const date = dayjs(value);

              if (date.isValid()) {
                return date.isAfter('1/1/1000');
              }

              return true;
            },
            // eslint-disable-next-line no-template-curly-in-string
            message: '${path} must be a valid date'
          }),
        ];
      }

      return [tableSchema, columnSchema, validation];
    },
  });
};
