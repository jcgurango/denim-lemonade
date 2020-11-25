import { NumberSchema, Schema, StringSchema } from 'yup';
import {
  DenimColumn,
  DenimDataContext,
  DenimTable,
} from '../../core';
import DenimValidator from '../../service/DenimValidator';
import { AirTable } from './types/schema';

export default class AirTableValidator<T extends DenimDataContext> extends DenimValidator<T> {
  public airtableSchema: AirTable;

  constructor(schema: DenimTable, airtableSchema: AirTable) {
    super(schema);
    this.airtableSchema = airtableSchema;
  }

  public createFieldValidator(
    context: T,
    table: DenimTable,
    field: DenimColumn,
  ): Schema<any, object> {
    let validation = super.createFieldValidator(context, table, field);

    // Find the corresponding AirTable field.
    const atField = this.airtableSchema.columns.find(({ name }) => name === field.name);

    if (atField) {
      // Add additional validations for the AirTable types.
      if (
        atField.type === 'text' ||
        (atField.type === 'multilineText' && atField.typeOptions)
      ) {
        if (atField.typeOptions?.validatorName == 'email') {
          return (<StringSchema<any, object>>validation).email();
        }

        if (atField.typeOptions?.validatorName == 'url') {
          return (<StringSchema<any, object>>validation).url();
        }
      }

      if (atField.type === 'phone') {
        return (<StringSchema<any, object>>validation).matches(
          /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g,
        );
      }

      if (atField.type === 'number') {
        if (
          atField?.typeOptions &&
          atField.typeOptions.validatorName === 'positive'
        ) {
          return (<NumberSchema<any, object>>validation).min(0);
        }
      }
    }

    return validation;
  }
}
