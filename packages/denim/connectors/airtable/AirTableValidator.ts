import {
  DenimColumn,
  DenimDataContext,
  DenimTable,
  YupAst,
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
  ): YupAst {
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
          return [
            ...validation,
            ['yup.email']
          ] as YupAst;
        }

        if (atField.typeOptions?.validatorName == 'url') {
          return [
            ...validation,
            ['yup.url']
          ] as YupAst;
        }
      }

      if (atField.type === 'phone') {
        return [
          ...validation,
          ['yup.matches', /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/g]
        ] as YupAst;
      }

      if (atField.type === 'number') {
        if (
          atField?.typeOptions &&
          atField.typeOptions.validatorName === 'positive'
        ) {
          return [
            ...validation,
            ['yup.min', 0]
          ] as YupAst;
        }
      }
    }

    return validation;
  }
}
