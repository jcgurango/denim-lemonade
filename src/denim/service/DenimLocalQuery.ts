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

      let { operator, value } = conditions;
      const fieldValue = this.normalizeValue(fieldSchema, record[field]);

      if (value?.id) {
        value = value.id;
      }

      if (operator === DenimQueryOperator.Equals) {
        return fieldValue === value;
      } else if (operator === DenimQueryOperator.DoesNotEqual) {
        return !this.matches(schema, record, {
          ...conditions,
          operator: DenimQueryOperator.Equals,
        });
      } else if (operator === DenimQueryOperator.Contains) {
        return fieldValue && fieldValue.indexOf(value) > -1;
      } else if (operator === DenimQueryOperator.DoesNotContain) {
        return !this.matches(schema, record, {
          ...conditions,
          operator: DenimQueryOperator.Contains,
        });
      } else if (operator === DenimQueryOperator.GreaterThan) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return dayjs(fieldValue).isAfter(value);
        }

        return fieldValue > value;
      } else if (operator === DenimQueryOperator.GreaterThanOrEqual) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return (
            dayjs(fieldValue).isAfter(value) || dayjs(fieldValue).isSame(value)
          );
        }

        return fieldValue >= value;
      } else if (operator === DenimQueryOperator.LessThan) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return (
            dayjs(fieldValue).isBefore(value) || dayjs(fieldValue).isSame(value)
          );
        }

        return fieldValue < value;
      } else if (operator === DenimQueryOperator.LessThanOrEqual) {
        if (fieldSchema.type === DenimColumnType.DateTime) {
          return (
            dayjs(fieldValue).isBefore(value) || dayjs(fieldValue).isSame(value)
          );
        }

        return fieldValue <= value;
      } else if (operator === DenimQueryOperator.Null) {
        return typeof fieldValue === 'undefined' || fieldValue === null;
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

  static validOperatorsFor(column: DenimColumn): DenimQueryOperator[] {
    if (column.type === DenimColumnType.Boolean) {
      return [
        DenimQueryOperator.Equals,
        DenimQueryOperator.DoesNotEqual,
        DenimQueryOperator.Null,
        DenimQueryOperator.NotNull,
      ];
    }

    if (
      column.type === DenimColumnType.DateTime ||
      column.type === DenimColumnType.Number
    ) {
      return [
        DenimQueryOperator.Equals,
        DenimQueryOperator.DoesNotEqual,
        DenimQueryOperator.GreaterThan,
        DenimQueryOperator.GreaterThanOrEqual,
        DenimQueryOperator.LessThan,
        DenimQueryOperator.LessThanOrEqual,
        DenimQueryOperator.Null,
        DenimQueryOperator.NotNull,
      ];
    }

    if (
      column.type === DenimColumnType.ForeignKey ||
      column.type === DenimColumnType.Select ||
      column.type === DenimColumnType.MultiSelect
    ) {
      if (
        (column.type === DenimColumnType.ForeignKey &&
          column.properties.multiple) ||
        column.type === DenimColumnType.MultiSelect
      ) {
        return [
          DenimQueryOperator.Contains,
          DenimQueryOperator.DoesNotContain,
          DenimQueryOperator.NotNull,
          DenimQueryOperator.Null,
        ];
      }

      return [
        DenimQueryOperator.Equals,
        DenimQueryOperator.DoesNotEqual,
        DenimQueryOperator.NotNull,
        DenimQueryOperator.Null,
      ];
    }

    if (column.type === DenimColumnType.Text) {
      return [
        DenimQueryOperator.Equals,
        DenimQueryOperator.DoesNotEqual,
        DenimQueryOperator.Contains,
        DenimQueryOperator.DoesNotContain,
        DenimQueryOperator.NotNull,
        DenimQueryOperator.Null,
      ];
    }

    return [
      DenimQueryOperator.Equals,
      DenimQueryOperator.DoesNotEqual,
      DenimQueryOperator.Contains,
      DenimQueryOperator.DoesNotContain,
      DenimQueryOperator.GreaterThan,
      DenimQueryOperator.LessThan,
      DenimQueryOperator.GreaterThanOrEqual,
      DenimQueryOperator.LessThanOrEqual,
      DenimQueryOperator.NotNull,
      DenimQueryOperator.Null,
    ];
  }
}
