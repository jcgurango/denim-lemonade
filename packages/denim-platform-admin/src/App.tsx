import React from 'react';
import { useState, useEffect, FunctionComponent } from 'react';
import { DenimRemoteDataSourceV2 } from 'denim';
import { DenimApplicationV2, useDenimApplication, DenimApplicationContext } from 'denim-forms';
import './App.css';
import Connections from './screens/Connections';
import Screens from './screens/Screens';
import { DenimSchema } from 'denim';
import PageContainer from './components/PageContainer';
import Roles from './screens/Roles';

const apiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || `${window.location.origin}/app-schema`;
const apiConsumerBaseUrl =
  process.env.REACT_APP_API_BASE_URL || `${window.location.origin}/consumer`;
const dataSource = new DenimRemoteDataSourceV2(apiBaseUrl);
const consumerDataSource = new DenimRemoteDataSourceV2(apiConsumerBaseUrl);
export const getSchema = async () =>
  (await dataSource.retrieveRecords('consumer-schema')) as any as DenimSchema;

dataSource.registerHook({
  type: 'field-validation',
  table: 'data-connections',
  callback: async (table, columns, columnSchema, validation) => {
    if (['name', 'type'].includes(columnSchema.name)) {
      return [columns, columnSchema, validation.required()];
    }

    return [columns, columnSchema, validation];
  },
});

dataSource.registerHook({
  type: 'field-validation',
  table: 'screens',
  callback: async (table, columns, columnSchema, validation) => {
    if (['name'].includes(columnSchema.name)) {
      return [columns, columnSchema, validation.required()];
    }

    return [columns, columnSchema, validation];
  },
});

dataSource.registerHook({
  type: 'post-create',
  table: 'app-setup',
  callback: async (table, record) => {
    await dataSource.retrieveSchema();

    return [record];
  },
});

dataSource.registerHook({
  type: 'post-update',
  table: 'app-setup',
  callback: async (table, id, record) => {
    await dataSource.retrieveSchema();

    return [id, record];
  },
});

export const FromConsumer: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await consumerDataSource.retrieveSchema();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        dataSource: consumerDataSource,
      }}
    >
      {children}
    </DenimApplicationContext.Provider>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await dataSource.retrieveSchema();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <DenimApplicationV2
      dataSource={dataSource}
      ContainerComponent={PageContainer}
    >
      <Connections />
      <Screens />
      <Roles />
    </DenimApplicationV2>
  );
}

export default App;
