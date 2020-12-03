import {
  DenimDataSource,
  DenimSchemaSource,
  DenimAuthorizationAction,
  DenimLocalQuery,
} from '.';
import { DenimQuery, DenimQueryConditionOrGroup, DenimRecord } from '../core';
import {
  DenimAuthenticationContext,
  DenimAuthorizationRole,
} from './types/auth';

export type RolesCallback = (user: DenimRecord) => string[];

export default class DenimAuthenticator<T extends DenimAuthenticationContext> {
  public roles: DenimAuthorizationRole[];

  constructor(roles: DenimAuthorizationRole[]) {
    this.roles = roles;
  }

  protected getAuthorizationActionFromKey(
    obj: any,
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
  ): DenimAuthorizationAction {
    return obj[actionKey];
  }

  protected authorize(
    userData: DenimRecord | undefined,
    roles: string[],
    actionKey: 'readAction' | 'createAction' | 'updateAction' | 'deleteAction',
    table: string,
  ): DenimAuthorizationAction {
    const userRoles = <DenimAuthorizationRole[]>(
      roles
        .map((role) => this.roles.find(({ id }) => id === role))
        .filter(Boolean)
    );
    let query: DenimQueryConditionOrGroup | null = null;

    for (let i = 0; i < roles.length; i++) {
      const role = userRoles[i];

      // Check if this table is in the role.
      const roleTable = role.tables.find(({ table: ta }) =>
        typeof ta === 'string' ? ta === table : ta.test(table),
      );

      if (roleTable) {
        const action = this.getAuthorizationActionFromKey(role, actionKey);

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
          const authorization = await this.authorize(
            context.userData,
            context.userRoles,
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
        let authorization = await this.authorize(
          context.userData,
          context.userRoles,
          'createAction',
          table,
        );

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
      type: 'pre-create-validate',
      table: /.*/g,
      callback: async (table, context, record, validator) => {
        const authorization = await this.authorize(
          context.userData,
          context.userRoles,
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
      type: 'pre-update-validate',
      table: /.*/g,
      callback: async (table, context, record, validator) => {
        const authorization = await this.authorize(
          context.userData,
          context.userRoles,
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
          throw new Error('Unauthorized record update.');
        }

        return [context, record, validator];
      },
    });

    dataSource.registerHook({
      type: 'pre-delete',
      table: /.*/g,
      callback: async (table, context, id) => {
        const authorization = await this.authorize(
          context.userData,
          context.userRoles,
          'createAction',
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
