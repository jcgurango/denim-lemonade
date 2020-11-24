export interface DenimUser {
  id: string;
}

export interface DenimDataContext {
  user: DenimUser;
}

export type Expansion = string[];

export interface DenimPlainQuery {
  conditions?: DenimQueryConditionGroup;
  page?: number;
  pageSize?: number;
}

export interface DenimQuery extends DenimPlainQuery {
  expand?: Expansion;
}

export type DenimQueryConditionOrGroup = DenimQueryCondition | DenimQueryConditionGroup;

export interface DenimQueryConditionGroup {
  conditionType: 'group';
  type: 'AND' | 'OR';
  conditions: DenimQueryConditionOrGroup[];
}

export enum DenimQueryOperator {
  Equals,
  NotEquals,
  StringContains,
  StringNotContains,
  GreaterThan,
  LessThan,
  GreaterThanOrEqual,
  LessThanOrEqual,
  NotNull,
  Null,
}

export interface DenimQueryCondition {
  conditionType: 'single';
  field: string;
  operator: DenimQueryOperator;
  value: any;
}

export interface DenimTableValidator {
  validate: (context: DenimDataContext, record: DenimRecord) => Promise<Boolean>;
}

export interface DenimRecord {
  id?: string;
  [field: string]: DenimRelatedRecord | DenimRelatedRecordCollection | string | number | null | undefined;
}

export interface DenimRelatedRecordCollection {
  type: 'record-collection';
  records: DenimRelatedRecord[];
}

export interface DenimRelatedRecord {
  type: 'record';
  id: string;
  name?: string;
  record?: DenimRecord;
}
