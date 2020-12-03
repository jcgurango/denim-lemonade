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
import { DenimQueryOperator, DenimRecord } from '../denim/core';
import LarkAuthentication from './LarkAuthentication';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyAhv3IWg6qeJRZb',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');
const schema = new AirTableSchemaSource<{}>(
  require('../schema/airtable-schema.json'),
);
const data = new AirTableDataSource(schema, 'appjkBnHNyutcO3Wr');
const fs = require('fs');
const lark = new LarkUpdater(
  'cli_9f4c99b38b37100a',
  'wF6wJHfm0wCUERavJXx0fbqsAcKAZr3x',
);
const auth = new LarkAuthentication(lark, 'test-secret-key');

app.use(
  '/data',
  cors(),
  auth.middleware(async (id, req, res, next) => {
    // Find the user.
    console.log(id);

    const [employee] = await employeeDataProvider.retrieveRecords({}, {
      conditions: {
        conditionType: 'single',
        field: 'Lark ID',
        operator: DenimQueryOperator.Equals,
        value: id,
      }
    });

    if (employee) {
      console.log(employee);
    }

    return next();
  }),
  DenimDataSourceRouter(data),
);
app.use('/auth', auth.loginEndpoint());

app.listen(9090, () => console.log('Listening...'));

const updateCoordinator = new UpdateCoordinator({
  saveLastCheck: async (lastCheck) => fs.writeFileSync('.lastcheck', lastCheck),
  saveBuckets: async (buckets) =>
    fs.writeFileSync('.buckets', JSON.stringify(buckets)),
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

    return {};
  },
});

const employeeDataProvider = data.createDataProvider('Employee');
const departmentDataProvider = data.createDataProvider('Department');

updateCoordinator.registerRetriever(
  'departments',
  DenimDataRetriever(departmentDataProvider, null, 'Last Modified', {}),
);

updateCoordinator.registerUpdater(
  'departments',
  DepartmentMapper.forward,
  lark.department(),
);

updateCoordinator.registerRetriever(
  'employees',
  DenimDataRetriever(employeeDataProvider, null, 'Last Modified', {}),
);

updateCoordinator.registerUpdater(
  'employees',
  EmployeeMapper.forward,
  lark.employee(),
  async (employee: any, originalEmployee: DenimRecord) => {
    if (!originalEmployee['Lark ID'] && employee.open_id) {
      await employeeDataProvider.updateRecord({}, String(originalEmployee.id), {
        'Lark ID': employee.open_id,
      });
    }
  },
);

updateCoordinator.poll(0);
