import {
  DenimDataSource,
  DenimSchemaSource,
  DenimAuthorizationAction,
  DenimLocalQuery,
} from '.';
import { DenimQuery, DenimQueryConditionOrGroup, DenimRecord, DenimTable } from '../core';
import {
  DenimAuthenticationContext,
  DenimAuthorizationRole,
} from './types/auth';

export type RolesCallback = (user: DenimRecord) => string[];

export default class DenimAuthenticator<T extends DenimAuthenticationContext> {
  public roles: DenimAuthorizationRole[];
  public userSchema: DenimTable;

  constructor(roles: DenimAuthorizationRole[], userSchema: DenimTable) {
    this.roles = roles;
    this.userSchema = userSchema;
  }

  protected getAuthorizationActionFromKey(
    obj: any,
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
  ): DenimAuthorizationAction {
    return obj[actionKey];
  }

  protected authorize(
    userData: DenimRecord | undefined,
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
    table: string,
  ): DenimAuthorizationAction {
    const userRoles = this.roles.filter(({ roleQuery }) => {
      return !roleQuery || (!!userData && DenimLocalQuery.matches(this.userSchema, userData, roleQuery));
    });
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

  protected substituteQueryValue(
    context: DenimAuthenticationContext,
    value: any,
  ) {
    if (value.$user) {
      return context.userData && context.userData[value.$user];
    }

    return value;
  }

  protected substituteQueryValues(
    context: DenimAuthenticationContext,
    conditions: DenimQueryConditionOrGroup,
  ): DenimQueryConditionOrGroup {
    if (conditions.conditionType === 'group') {
      return {
        ...conditions,
        conditions: conditions.conditions.map((condition) =>
          this.substituteQueryValues(context, condition),
        ),
      };
    } else if (conditions.conditionType === 'single') {
      return {
        ...conditions,
        value: this.substituteQueryValue(context, conditions.value),
      };
    }

    return conditions;
  }

  public attach(dataSource: DenimDataSource<T, DenimSchemaSource<T>>) {
    dataSource.registerHook({
      type: 'post-retrieve-record',
      table: /.*/g,
      callback: async (table, context, id, expansion, record) => {
        if (record) {
          const authorization = this.authorize(
            context.userData,
            'readAction',
            table,
          );

          if (
            authorization === 'block' ||
            (authorization !== 'allow' &&
              !DenimLocalQuery.matches(
                dataSource.schemaSource.findTableSchema(table),
                record,
                this.substituteQueryValues(context, authorization),
              ))
          ) {
            return [context, id, expansion, null];
          }
        }

        return [context, id, expansion, record];
      },
    });

    dataSource.registerHook({
      type: 'pre-retrieve-records',
      table: /.*/g,
      callback: async (table, context, query) => {
        let authorization = this.authorize(
          context.userData,
          'readAction',
          table,
        );

        console.log('Records', table, authorization);

        if (authorization === 'block') {
          throw new Error('Unauthorized query.');
        } else if (authorization !== 'allow') {
          authorization = this.substituteQueryValues(context, authorization);

          let newQuery: DenimQuery = {
            conditions: authorization,
          };

          if (query) {
            newQuery = {
              ...query,
              conditions: query.conditions
                ? {
                    conditionType: 'group',
                    type: 'AND',
                    conditions: [query.conditions, authorization],
                  }
                : authorization,
            };
          }

          return [context, newQuery];
        }

        return [context, query];
      },
    });

    dataSource.registerHook({
      type: 'pre-create',
      table: /.*/g,
      callback: async (table, context, record) => {
        const authorization = this.authorize(
          context.userData,
          'createAction',
          table,
        );

        // Check for allowed fields.
        if (typeof(authorization) !== 'string' && authorization.allowedFields) {
          Object.keys(record).forEach((column) => {
            if (!authorization.allowedFields?.includes(column)) {
              throw new Error('Unauthorized field values.');
            }
          });
        }

        return [context, record];
      },
    });

    dataSource.registerHook({
      type: 'pre-create-validate',
      table: /.*/g,
      callback: async (table, context, record, validator) => {
        const authorization = this.authorize(
          context.userData,
          'createAction',
          table,
        );

        if (
          authorization === 'block' ||
          (authorization !== 'allow' &&
            !DenimLocalQuery.matches(
              dataSource.schemaSource.findTableSchema(table),
              record,
              this.substituteQueryValues(context, authorization),
            ))
        ) {
          throw new Error('Unauthorized record creation.');
        }

        return [context, record, validator];
      },
    });

    dataSource.registerHook({
      type: 'pre-update',
      table: /.*/g,
      callback: async (table, context, id, record) => {
        const authorization = this.authorize(
          context.userData,
          'updateAction',
          table,
        );

        // Check for allowed fields.
        if (typeof(authorization) !== 'string' && authorization.allowedFields) {
          Object.keys(record).forEach((column) => {
            if (!authorization.allowedFields?.includes(column)) {
              throw new Error('Unauthorized field values.');
            }
          });
        }

        return [context, id, record];
      },
    });

    dataSource.registerHook({
      type: 'pre-update-validate',
      table: /.*/g,
      callback: async (table, context, record, validator) => {
        const authorization = this.authorize(
          context.userData,
          'updateAction',
          table,
        );

        if (
          authorization === 'block' ||
          (authorization !== 'allow' &&
            !DenimLocalQuery.matches(
              dataSource.schemaSource.findTableSchema(table),
              record,
              this.substituteQueryValues(context, authorization),
            ))
        ) {
          throw new Error('Unauthorized record update.');
        }

        return [context, record, validator];
      },
    });

    dataSource.registerHook({
      type: 'pre-delete',
      table: /.*/g,
      callback: async (table, context, id) => {
        const authorization = this.authorize(
          context.userData,
          'deleteAction',
          table,
        );

        if (authorization === 'block') {
          throw new Error('Unauthorized record deletion.');
        } else if (authorization !== 'allow') {
          // Retrieve the record.
          const tableProvider = dataSource.createDataProvider(table);
          const record = await tableProvider.retrieveRecord(context, id);

          if (
            record &&
            !DenimLocalQuery.matches(
              dataSource.schemaSource.findTableSchema(table),
              record,
              this.substituteQueryValues(context, authorization),
            )
          ) {
            throw new Error('Unauthorized record deletion.');
          }
        }

        return [context, id];
      },
    });
  }
}
