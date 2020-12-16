import dayjs from 'dayjs';
import { DenimColumnType } from './denim/core';
import { DenimSchemaSource } from './denim/service';

export const LemonadeValidations = (schemaSource: DenimSchemaSource<any>) => {
  const originalCreateValidator = schemaSource.createValidator.bind(
    schemaSource,
  );

  schemaSource.createValidator = (...args) => {
    const validator = originalCreateValidator(...args);

    validator.registerValidationHook(
      /.+/g,
      (context, table, column, validation) => {
        if (column && column.type === DenimColumnType.DateTime) {
          return [
            ...validation,
            [
              'yup.test',
              {
                test: (value: any) => {
                  const date = dayjs(value);

                  if (date.isValid()) {
                    return date.isAfter('1/1/1000');
                  }

                  return true;
                },
                message: '${path} must be a valid date'
              },
            ],
          ];
        }

        return validation;
      },
    );

    return validator;
  };
};

export default LemonadeValidations;
