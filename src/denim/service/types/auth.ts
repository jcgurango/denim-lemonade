import { DenimDataContext, DenimQueryConditionOrGroup, DenimRecord } from '../../core';

export interface DenimAuthenticationContext extends DenimDataContext {
  userData?: DenimRecord;
}

export interface AllowedFields {
  allowedFields?: string[];
}

export type DenimAuthorizationAction = 'allow' | 'block' | (DenimQueryConditionOrGroup & AllowedFields);

export interface DenimAuthorizationRole {
  id: string;
  readAction: DenimAuthorizationAction;
  createAction: DenimAuthorizationAction;
  updateAction: DenimAuthorizationAction;
  deleteAction: DenimAuthorizationAction;
  tables: DenimAuthorizationTable[];
  roleQuery?: DenimQueryConditionOrGroup;
}

export interface DenimAuthorizationTable {
  table: string | RegExp;
  readAction?: DenimAuthorizationAction;
  createAction?: DenimAuthorizationAction;
  updateAction?: DenimAuthorizationAction;
  deleteAction?: DenimAuthorizationAction;
}
