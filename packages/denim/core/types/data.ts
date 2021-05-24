export interface DenimDataContext {
  tags?: { [key: string]: any };
}

export type Expansion = string[];

export interface DenimPlainQuery {
  conditions?: DenimQueryConditionOrGroup;
  page?: number;
  pageSize?: number;
  view?: 'related' | string;
  retrieveAll?: boolean;
  sort?: DenimSortExpression | DenimSortExpression[];
}

export interface DenimQuery extends DenimPlainQuery {
  expand?: Expansion;
}

export interface DenimSortExpression {
  column: string;
  ascending?: boolean;
}

export type DenimQueryConditionOrGroup = DenimQueryCondition | DenimQueryConditionGroup;

export interface DenimQueryConditionGroup {
  conditionType: 'group';
  type: 'AND' | 'OR';
  conditions: DenimQueryConditionOrGroup[];
}

export enum DenimQueryOperator {
  Equals = 'eq',
  DoesNotEqual = 'neq',
  Contains = 'contains',
  DoesNotContain = 'ncontains',
  GreaterThan = 'gt',
  LessThan = 'lt',
  GreaterThanOrEqual = 'gte',
  LessThanOrEqual = 'lte',
  NotNull = 'notnull',
  Null = 'null',
}

export interface DenimQueryCondition {
  conditionType: 'single';
  field: string;
  operator: DenimQueryOperator;
  value: any;
}

export interface DenimRecord {
  id?: string;
  [field: string]: DenimRelatedRecord | DenimRelatedRecordCollection | string | number | boolean | null | undefined;
}

export interface DenimRelatedRecordCollection {
  type: 'record-collection';
  records: DenimRelatedRecord[];
}

export interface DenimRelatedRecord {
  type: 'record';
  id: string;
  name?: string;
  record?: DenimRecord | null;
}
