import dayjs from 'dayjs';
import {
  DenimColumn,
  DenimColumnType,
  DenimQueryConditionOrGroup,
  DenimQueryOperator,
  DenimRecord,
  DenimTable,
} from '../core';

export default class DenimLocalQuery {
  static normalizeValue(fieldSchema: DenimColumn, value: any): any {
    if (value) {
      if (fieldSchema.type === DenimColumnType.Number) {
        return Number(value);
      }

      if (fieldSchema.type === DenimColumnType.DateTime) {
        return new Date(value);
      }

      if (fieldSchema.type === DenimColumnType.ForeignKey) {
        if (fieldSchema.properties.multiple) {
          return value.records.map(({ id }: any) => id);
        }

        return value.id;
      }

      if (fieldSchema.type === DenimColumnType.Text) {
        return String(value);
      }
    }

    return value;
  }

  static matches(
    schema: DenimTable,
    record: DenimRecord,
    conditions: DenimQueryConditionOrGroup,
  ): boolean {
    if (conditions.conditionType === 'single') {
      const field = conditions.field;
      const fieldSchema = schema.columns.find(({ name }) => name === field);

      if (!fieldSchema) {
        throw new Error('Unknown field ' + field + '.');
      }

      const { operator, value } = conditions;
      const fieldValue = this.normalizeValue(fieldSchema, record[field]);

      if (operator === DenimQueryOperator.Equals) {
        return fieldValue === value;
      } else if (operator === DenimQueryOperator.NotEquals) {
        return !this.matches(schema, record, {
          ...conditions,
          operator: DenimQueryOperator.Equals,
        });
      } else if (operator === DenimQueryOperator.StringContains) {
        return String(fieldValue).indexOf(value) > -1;
      } else if (operator === DenimQueryOperator.StringNotContains) {
        return !this.matches(schema, record, {
          ...conditions,
          operator: DenimQueryOperator.StringContains,
        });
      } else if (operator === DenimQueryOperator.GreaterThan) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return dayjs(fieldValue).isAfter(value);
        }

        return fieldValue > value;
      } else if (operator === DenimQueryOperator.GreaterThanOrEqual) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return dayjs(fieldValue).isAfter(value) || dayjs(fieldValue).isSame(value);
        }

        return fieldValue >= value;
      } else if (operator === DenimQueryOperator.LessThan) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return dayjs(fieldValue).isBefore(value) || dayjs(fieldValue).isSame(value);
        }

        return fieldValue < value;
      } else if (operator === DenimQueryOperator.LessThanOrEqual) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return dayjs(fieldValue).isBefore(value) || dayjs(fieldValue).isSame(value);
        }

        return fieldValue <= value;
      } else if (operator === DenimQueryOperator.Null) {
        return typeof(fieldValue) === 'undefined' || fieldValue === null;
      } else if (operator === DenimQueryOperator.NotNull) {
        return !this.matches(schema, record, {
          ...conditions,
          operator: DenimQueryOperator.Null,
        });
      }

      throw new Error('Unsupported operator ' + operator);
    }

    if (conditions.conditionType === 'group') {
      return conditions.conditions.reduce((last, next) => {
        if (conditions.type === 'AND') {
          return last && this.matches(schema, record, next);
        }

        return last || this.matches(schema, record, next);
      }, conditions.type === 'AND');
    }

    return true;
  }
}
