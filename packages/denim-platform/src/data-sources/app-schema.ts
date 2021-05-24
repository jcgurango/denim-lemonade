import { DenimJsonDataSource, DenimColumnType } from 'denim';
import { AirTable, AirTableSchemaRetriever } from 'denim-airtable';
import { DenimRecord } from 'denim/core';
import { refreshConsumerRouter } from '../routes/consumer';

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
          label: 'Update',
          properties: undefined,
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
          name: 'schema',
          type: DenimColumnType.Text,
          label: 'Role Schema',
          properties: {},
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
          name: 'title',
          type: DenimColumnType.Text,
          label: 'Screen Title',
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
  ],
});

const updateDataConnection = async (record: DenimRecord) => {
  if (record.type === 'airtable') {
    // Retrieve AirTable schemas.
    const { email, password } = JSON.parse(String(record.credentials));

    const result = await AirTableSchemaRetriever.retrieveSchema(
      email,
      password
    );

    record.cache = JSON.stringify(result);
  }
};

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'pre-create',
  callback: async (table, record) => {
    await updateDataConnection(record);

    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'pre-update-validate',
  callback: async (table, record) => {
    if (record.update) {
      await updateDataConnection(record);
      record.update = false;
    }

    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'post-create',
  callback: async (table, record) => {
    await refreshConsumerRouter();

    return [record];
  },
});

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'post-update',
  callback: async (table, id, record) => {
    await refreshConsumerRouter();

    return [id, record];
  },
});

appSchemaSource.registerHook({
  table: 'data-connections',
  type: 'post-delete',
  callback: async (table, id) => {
    await refreshConsumerRouter();

    return [id];
  },
});

export default appSchemaSource;
