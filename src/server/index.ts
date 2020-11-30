import express from 'express';
import Airtable from 'airtable';
import { AirTableDataSource } from '../denim/connectors/airtable';
import DenimDataSourceRouter from '../denim/express/DenimDataSourceRouter';
import AirTableSchemaSource from '../denim/connectors/airtable/AirTableSchemaSource';
import UpdateCoordinator from './sync/UpdateCoordinator';
import { DenimDataRetriever } from './sync/retrievers/DenimDataRetriever';
import { EmployeeMapper } from './sync/mappers/EmployeeMapper';
import LarkUpdater from './sync/updaters/LarkUpdater';
import { DepartmentMapper } from './sync/mappers/DepartmentMapper';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyAhv3IWg6qeJRZb',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');
const schema = new AirTableSchemaSource<{}>(require('../schema/airtable-schema.json'));
const data = new AirTableDataSource(schema, 'appjkBnHNyutcO3Wr');
const fs = require('fs');
const lark = new LarkUpdater('cli_9f4928350b2b9009', 'kNkgJYee06mDHfnnmgs6RfWtBy1gEtQJ');

app.use('/data', cors(), DenimDataSourceRouter(data));

app.listen(9090, () => console.log('Listening...'));

const updateCoordinator = new UpdateCoordinator({
  saveLastCheck: async (lastCheck) => fs.writeFileSync('.lastcheck', lastCheck),
  saveBuckets: async (buckets) => fs.writeFileSync('.buckets', JSON.stringify(buckets)),
  readLastCheck: async () => {
    if (fs.existsSync('.lastcheck')) {
      return parseInt(fs.readFileSync('.lastcheck'));
    }

    return null;
  },
  readBuckets: async () => {
    if (fs.existsSync('.buckets')) {
      return JSON.parse(fs.readFileSync('.buckets'));
    }

    return { };
  },
});

const employeeDataProvider = data.createDataProvider('Employee');
const departmentDataProvider = data.createDataProvider('Department');

updateCoordinator.registerRetriever(
  'departments',
  DenimDataRetriever(departmentDataProvider, null, 'Last Modified', { }),
  DepartmentMapper,
);

updateCoordinator.registerRetriever(
  'employees',
  DenimDataRetriever(employeeDataProvider, null, 'Last Modified', { }),
  EmployeeMapper,
);

updateCoordinator.registerUpdater(
  'departments',
  lark.department(),
);

updateCoordinator.registerUpdater(
  'employees',
  lark.employee(),
  async (employee: any) => {
    // Write the new ID back into AirTable.
    const airtableId = employee.custom_attrs.airTableId;
  },
);

updateCoordinator.poll(0);
