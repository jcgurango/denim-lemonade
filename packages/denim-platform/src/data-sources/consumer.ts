import {
  DenimCombinedDataSourceV2,
  DenimDataSourceV2,
  DenimAuthenticatorV2,
  DenimAuthorizationRole,
  evaluateSchema,
} from 'denim';
import {
  SchemaResult as AirTableSchemaResult,
  AirTableDataSourceV2,
} from 'denim-airtable';
import Airtable from 'airtable';
import appSchemaSource from './app-schema';

// Data source for the consumer backend.
const consumerDataSource = async (schemaSource: DenimDataSourceV2) => {
  const dataConnections = await schemaSource.retrieveRecords(
    'data-connections',
    {
      retrieveAll: true,
    }
  );

  const sources: DenimDataSourceV2[] = [];

  dataConnections.forEach((connection) => {
    const config: any = JSON.parse(
      String(connection.connectionConfiguration || '{ }')
    );

    if (connection.type === 'airtable') {
      const result: AirTableSchemaResult = JSON.parse(String(connection.cache));
      const airtable = new Airtable({
        apiKey: result.apiKey,
      });

      if (config.selectedBases) {
        const selectedBases: string[] = config.selectedBases;

        selectedBases.forEach((base) => {
          if (result.bases[base]) {
            sources.push(
              new AirTableDataSourceV2(
                airtable.base(base),
                result.bases[base].tables
              )
            );
          }
        });
      }
    }
  });

  const dataSource = new DenimCombinedDataSourceV2(...sources);
  const [appSettings] = await schemaSource.retrieveRecords('app-setup');
  let authenticator: DenimAuthenticatorV2 | undefined;
  let usersTableName: string | undefined;
  let usernameColumn: string | undefined;
  let passwordColumn: string | undefined;

  if (appSettings) {
    if (
      appSettings['users-table'] &&
      appSettings['username-column'] &&
      appSettings['password-column']
    ) {
      const usersTable = dataSource.getTable(
        String(appSettings['users-table'])
      );
      const rolesSchema = await appSchemaSource.retrieveRecords('roles', {
        retrieveAll: true,
      });
      const roles = rolesSchema.map<DenimAuthorizationRole>((role) => {
        const defaultSchema = JSON.parse(String(role.defaultSchema));
        const tablesSchema = JSON.parse(String(role.tablesSchema || '[]'));

        return {
          id: String(role.id),
          ...defaultSchema,
          tables: tablesSchema,
          roleQuery: role.query && JSON.parse(String(role.query)),
        };
      });

      authenticator = new DenimAuthenticatorV2(
        roles,
        usersTable,
        dataSource,
        (userData, value) => {
          return evaluateSchema(value, {
            user: userData,
          });
        }
      );

      usersTableName = String(appSettings['users-table']);
      usernameColumn = String(appSettings['username-column']);
      passwordColumn = String(appSettings['password-column']);
    }
  }

  return {
    dataSource,
    authenticator,
    usersTableName,
    usernameColumn,
    passwordColumn,
  };
};

export default consumerDataSource;
