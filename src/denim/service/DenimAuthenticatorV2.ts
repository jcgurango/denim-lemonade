import {
  DenimAuthorizationAction,
  DenimDataSourceV2,
  DenimLocalQuery,
} from '.';
import {
  DenimColumnType,
  DenimQueryConditionOrGroup,
  DenimRecord,
  DenimRelatedRecord,
  DenimTable,
} from '../core';
import { DenimAuthorizationRole } from './types/auth';

export type RolesCallback = (user: DenimRecord) => string[];

export default class DenimAuthenticatorV2 {
  public roles: DenimAuthorizationRole[];
  public userSchema: DenimTable;
  public dataSource: DenimDataSourceV2;

  constructor(
    roles: DenimAuthorizationRole[],
    userSchema: DenimTable,
    dataSource: DenimDataSourceV2,
  ) {
    this.roles = roles;
    this.userSchema = userSchema;
    this.dataSource = dataSource;
  }

  protected getAuthorizationActionFromKey(
    obj: any,
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
  ): DenimAuthorizationAction {
    return obj[actionKey];
  }

  public authorizeFromRoles(
    userRoles: DenimAuthorizationRole[],
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
    table: string,
  ): DenimAuthorizationAction {
    let query: DenimQueryConditionOrGroup | null = null;

    for (let i = 0; i < userRoles.length; i++) {
      const role = userRoles[i];

      // Check if this table is in the role.
      const roleTable = role.tables.find(({ table: ta }) =>
        typeof ta === 'string' ? ta === table : ta.test(table),
      );

      if (roleTable) {
        const action = this.getAuthorizationActionFromKey(roleTable, actionKey);

        if (action === 'allow') {
          return 'allow';
        } else if (action !== 'block') {
          query = action;
        }
      }

      if (this.getAuthorizationActionFromKey(role, actionKey) === 'allow') {
        return 'allow';
      }
    }

    if (query) {
      return query;
    }

    return 'block';
  }

  public authorizeFromRoleNames(
    roleNames: string[],
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
    table: string,
  ): DenimAuthorizationAction {
    const userRoles = this.roles.filter(({ id }) => roleNames.includes(id));
    let query: DenimQueryConditionOrGroup | null = null;

    for (let i = 0; i < userRoles.length; i++) {
      const role = userRoles[i];

      // Check if this table is in the role.
      const roleTable = role.tables.find(({ table: ta }) =>
        typeof ta === 'string' ? ta === table : ta.test(table),
      );

      if (roleTable) {
        const action = this.getAuthorizationActionFromKey(roleTable, actionKey);

        if (action === 'allow') {
          return 'allow';
        } else if (action !== 'block') {
          query = action;
        }
      }

      if (this.getAuthorizationActionFromKey(role, actionKey) === 'allow') {
        return 'allow';
      }
    }

    if (query) {
      return query;
    }

    return 'block';
  }

  public authorizeQuery(
    userData: DenimRecord,
    action: DenimAuthorizationAction,
    query?: DenimQueryConditionOrGroup,
  ): DenimQueryConditionOrGroup | undefined {
    if (action === 'allow') {
      return query;
    } else if (action === 'block') {
      throw new Error('Unauthorized query.');
    }

    if (action.allowedFields && query) {
      const checkQuery = (condition: DenimQueryConditionOrGroup) => {
        if (!action.allowedFields) {
          return;
        }

        if (condition.conditionType === 'single') {
          if (!action.allowedFields.includes(condition.field)) {
            throw new Error('Unauthorized query.');
          }
        }
      };

      checkQuery(query);
    }

    if ('conditionType' in action) {
      const newQuery = query
        ? {
            conditionType: 'group',
            type: 'AND',
            conditions: [query, action],
          }
        : action;

      return this.substituteQueryValues(
        userData,
        newQuery as DenimQueryConditionOrGroup,
      );
    }

    if (query) {
      return this.substituteQueryValues(userData, query);
    }
  }

  public authorize(
    userData: DenimRecord | undefined,
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
    table: string,
  ): DenimAuthorizationAction {
    const userRoles = this.roles.filter(({ roleQuery }) => {
      return (
        !roleQuery ||
        (!!userData &&
          DenimLocalQuery.matches(this.userSchema, userData, roleQuery))
      );
    });

    return this.authorizeFromRoles(userRoles, actionKey, table);
  }

  public authorizeField(
    table: string,
    field: string,
    roles: string[],
    record?: DenimRecord,
  ): boolean {
    // Field-level isn't implemented yet. Table level will have to do for now.
    const authorizationAction = this.authorizeFromRoles(
      this.roles.filter(({ id }) => roles.includes(id)),
      record?.id ? 'createAction' : 'updateAction',
      table,
    );

    if (typeof authorizationAction === 'object') {
      if (authorizationAction.allowedFields) {
        return authorizationAction.allowedFields.includes(field);
      }

      return true;
    }

    return authorizationAction === 'allow';
  }

  public getRolesFor(userData: DenimRecord): string[] {
    return this.roles
      .filter(({ roleQuery }) => {
        return (
          !roleQuery ||
          (!!userData &&
            DenimLocalQuery.matches(this.userSchema, userData, roleQuery))
        );
      })
      .map(({ id }) => id);
  }

  protected substituteQueryValue(userData: DenimRecord, value: any) {
    if (value && value.$user) {
      return userData && userData[value.$user];
    }

    return value;
  }

  protected substituteQueryValues(
    userData: DenimRecord,
    conditions: DenimQueryConditionOrGroup,
  ): DenimQueryConditionOrGroup {
    if (conditions.conditionType === 'group') {
      return {
        ...conditions,
        conditions: conditions.conditions.map((condition) =>
          this.substituteQueryValues(userData, condition),
        ),
      };
    } else if (conditions.conditionType === 'single') {
      return {
        ...conditions,
        value: this.substituteQueryValue(userData, conditions.value),
      };
    }

    return conditions;
  }

  public filterRecord(
    userData: DenimRecord,
    table: string,
    record: DenimRecord,
    actionKey:
      | 'readAction'
      | 'createAction'
      | 'updateAction'
      | 'deleteAction' = 'readAction',
  ) {
    const action = this.authorize(userData, actionKey, table);
    const tableSchema = this.dataSource.getTable(table);

    if (typeof action === 'object') {
      if (
        action.conditionType &&
        !DenimLocalQuery.matches(
          tableSchema,
          record,
          this.substituteQueryValues(userData, action),
        )
      ) {
        return null;
      }

      return Object.keys(record).reduce<DenimRecord>((current, key) => {
        if (
          !action.allowedFields ||
          (key === 'id' || action.allowedFields.includes(key))
        ) {
          const value = record[key];

          if (value && typeof value === 'object') {
            const columnSchema = tableSchema.columns.find(
              ({ name }) => name === key,
            );

            if (columnSchema?.type === DenimColumnType.ForeignKey) {
              if (value.type === 'record' && value.record) {
                const filteredRecord = this.filterRecord(
                  userData,
                  columnSchema.properties.foreignTableId,
                  value.record,
                  actionKey,
                );

                if (filteredRecord) {
                  value.record = filteredRecord;
                }

                return {
                  ...current,
                  [key]: value,
                };
              }

              if (value.type === 'record-collection') {
                value.records = value.records
                  .map<DenimRelatedRecord | null>((relatedRecord) => {
                    if (relatedRecord.record) {
                      const filteredRecord = this.filterRecord(
                        userData,
                        columnSchema.properties.foreignTableId,
                        relatedRecord.record,
                      );

                      if (!filteredRecord) {
                        return null;
                      }
                    }

                    return relatedRecord;
                  })
                  .filter((record) => Boolean(record))
                  .map<DenimRelatedRecord>(
                    (record) => record as DenimRelatedRecord,
                  );
              }
            }
          }

          return {
            ...current,
            [key]: value,
          };
        }

        return {
          ...current,
        };
      }, {});
    }

    return record;
  }
}
