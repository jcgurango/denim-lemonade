import { DenimJsonDataSource, DenimColumnType } from 'denim';
import { AirTable, AirTableSchemaRetriever } from 'denim-airtable';
import fs from 'fs';
import path from 'path';
import { DenimRecord } from 'denim';
import { refreshConsumerRouter, setFrontendSchema } from '../routes/consumer';
import { refreshAppSchemaRouter } from '../routes/app-schema';

enum DataConnectionType {
  DataSource = 'data-source',
}

export const dataConnectionTypes: { [key: string]: DataConnectionType } = {
  airtable: DataConnectionType.DataSource,
};

const appSchemaSource = new DenimJsonDataSource('app-schema', {
  tables: [
    {
      id: 'data-connections',
      name: 'data-connections',
      label: 'Connections',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Connection Name',
          properties: {},
        },
        {
          name: 'type',
          type: DenimColumnType.Select,
          label: 'Type',
          properties: {
            options: [
              {
                label: 'AirTable',
                value: 'airtable',
              },
            ],
          },
        },
        {
          name: 'credentials',
          type: DenimColumnType.Text,
          label: 'Credentials',
          properties: {},
        },
        {
          name: 'cache',
          type: DenimColumnType.Text,
          label: 'Cache',
          properties: {},
        },
        {
          name: 'connectionConfiguration',
          type: DenimColumnType.Text,
          label: 'Connection Configuration',
          properties: {},
        },
        {
          name: 'update',
          type: DenimColumnType.Boolean,
          label: 'Refresh Schema',
          properties: undefined,
        },
      ],
    },
    {
      id: 'screens',
      name: 'screens',
      label: 'Screens',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Screen Name',
          properties: {},
        },
        {
          name: 'roles',
          type: DenimColumnType.ForeignKey,
          label: 'Allowed Roles',
          properties: {
            foreignTableId: 'roles',
            multiple: true,
          },
        },
        {
          name: 'paths',
          type: DenimColumnType.Text,
          label: 'Paths',
          properties: {},
        },
        {
          name: 'schema',
          type: DenimColumnType.Text,
          label: 'Screen Schema',
          properties: {},
        },
      ],
    },
    {
      id: 'roles',
      name: 'roles',
      label: 'Roles',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Role Name',
          properties: {},
        },
        {
          name: 'query',
          type: DenimColumnType.Text,
          label: 'Role Query',
          properties: {},
        },
        {
          name: 'defaultSchema',
          type: DenimColumnType.Text,
          label: 'Default Schema',
          properties: {},
        },
        {
          name: 'tablesSchema',
          type: DenimColumnType.Text,
          label: 'Tables Schema',
          properties: {},
        },
      ],
    },
    {
      id: 'app-setup',
      name: 'app-setup',
      label: 'App Setup',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Name',
          properties: {},
        },
        {
          name: 'users-table',
          type: DenimColumnType.Text,
          label: 'Users Table',
          properties: {},
        },
        {
          name: 'username-column',
          type: DenimColumnType.Text,
          label: 'Username Column',
          properties: {},
        },
        {
          name: 'password-column',
          type: DenimColumnType.Text,
          label: 'Password Column',
          properties: {},
        },
      ],
    },
    {
      id: 'consumer-schema',
      name: 'consumer-schema',
      label: 'Consumer Schema',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Name',
          properties: {},
        },
      ],
    },
  ],
});

const refreshCache = async (record: DenimRecord) => {
  if (record.type === 'airtable') {
    // Retrieve AirTable schemas.
    const { email, password } = JSON.parse(String(record.credentials));

    const result = await AirTableSchemaRetriever.retrieveSchema(
      email,
      password
    );

    return JSON.stringify(result);
  }

  return null;
};

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'pre-create',
  callback: async (table, record) => {
    record.cache = await refreshCache(record);

    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'post-update-validate',
  callback: async (table, record) => {
    if (record.update) {
      record.cache = await refreshCache(record);
      record.update = false;
    }

    return [record];
  },
});

appSchemaSource.registerHook({
  table: /data-connections|roles/g,
  type: 'post-create',
  callback: async (table, record) => {
    await refreshConsumerRouter();

    return [record];
  },
});

appSchemaSource.registerHook({
  table: /data-connections|roles/g,
  type: 'post-update',
  callback: async (table, id, record) => {
    await refreshConsumerRouter();

    return [id, record];
  },
});

appSchemaSource.registerHook({
  table: /data-connections|roles/g,
  type: 'post-delete',
  callback: async (table, id) => {
    await refreshConsumerRouter();

    return [id];
  },
});

appSchemaSource.registerHook({
  table: 'app-setup',
  type: 'post-create',
  callback: async (table, record) => {
    await refreshAppSchemaRouter();
    await refreshConsumerFrontend();
    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'app-setup',
  type: 'post-update',
  callback: async (table, id, record) => {
    await refreshAppSchemaRouter();
    await refreshConsumerFrontend();
    return [id, record];
  },
});

export const refreshConsumerFrontend = async () => {
  // Retrieve screens.
  const schema: any = {
    screens: [],
    hasAuthentication: false,
  };
  const screens = await appSchemaSource.retrieveRecords('screens');
  const [appSetup] = await appSchemaSource.retrieveRecords('app-setup');

  screens.forEach((screen: any) => {
    schema.screens.push({
      ...screen,
      paths: JSON.parse(screen.paths || '[]'),
      schema: JSON.parse(screen.schema || '[]'),
    });
  });
  
  schema.hasAuthentication = !!(appSetup && appSetup['users-table'] && appSetup['username-column'] && appSetup['password-column']);
  setFrontendSchema(schema);

  /*
  await new Promise<void>((resolve, reject) => {
    fs.writeFile(
      path.join(__dirname, '../../../denim-platform-web/src/schema.ts'),
      'export const applicationSchema: any = ' + JSON.stringify(schema) + ';',
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
  */
};

appSchemaSource.registerHook({
  table: 'screens',
  type: 'post-create',
  callback: async (table, record) => {
    await refreshConsumerFrontend();

    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'screens',
  type: 'post-update',
  callback: async (table, id, record) => {
    await refreshConsumerFrontend();

    return [id, record];
  },
});

appSchemaSource.registerHook({
  table: 'screens',
  type: 'post-delete',
  callback: async (table, id) => {
    await refreshConsumerFrontend();

    return [id];
  },
});

export default appSchemaSource;
