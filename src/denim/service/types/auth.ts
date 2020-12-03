import { DenimDataContext, DenimQueryConditionOrGroup, DenimRecord } from '../../core';

export interface DenimAuthenticationContext extends DenimDataContext {
  userData?: DenimRecord;
  userRoles: string[];
}

export type DenimAuthorizationAction = 'allow' | 'block' | DenimQueryConditionOrGroup;

export interface DenimAuthorizationRole {
  id: string;
  readAction: DenimAuthorizationAction;
  createAction: DenimAuthorizationAction;
  updateAction: DenimAuthorizationAction;
  deleteAction: DenimAuthorizationAction;
  tables: DenimAuthorizationTable[];
}

export interface DenimAuthorizationTable {
  table: string | RegExp;
  readAction: DenimAuthorizationAction;
  createAction: DenimAuthorizationAction;
  updateAction: DenimAuthorizationAction;
  deleteAction: DenimAuthorizationAction;
}
