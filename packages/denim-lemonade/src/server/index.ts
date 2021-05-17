import express from 'express';
import Airtable from 'airtable';
import DenimDataSourceV2Router from '../denim/express/DenimDataSourceV2Router';
import DenimAuthenticatorMiddleware from '../denim/express/DenimAuthenticatorMiddleware';
import UpdateCoordinator from './sync/UpdateCoordinator';
import { DenimDataRetriever } from './sync/retrievers/DenimDataRetriever';
import { EmployeeMapper } from './sync/mappers/EmployeeMapper';
import LarkUpdater from './sync/updaters/LarkUpdater';
import { DepartmentMapper } from './sync/mappers/DepartmentMapper';
import { DenimQueryOperator, DenimRecord } from '../denim/core';
import LarkAuthentication from './LarkAuthentication';
import LemonadeAuthenticator from './LemonadeAuthenticator';
import LemonadeDataSource from './LemonadeDataSource';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyLuy77TiMrMgCUY',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');

const data = LemonadeDataSource;
const denimAuth = LemonadeAuthenticator(data.getTable('Employee'), data);

const fs = require('fs');
const lark = new LarkUpdater(
  String(process.env.LARK_APP_ID),
  String(process.env.LARK_APP_SECRET),
);

const larkAuth = new LarkAuthentication(lark, 'test-secret-key');
const dataRouter = DenimDataSourceV2Router(data);
const authMiddleware = larkAuth.middleware(async (id, req, res, next) => {
  // Find the user.
  const [employee] = await data.retrieveRecords('Employee', {
    conditions: {
      conditionType: 'single',
      field: 'Lark ID',
      operator: DenimQueryOperator.Equals,
      value: id,
    },
  });

  if (employee) {
    (req as any).user = employee;
  }

  return next();
});

app.use(
  '/api/data',
  cors(),
  authMiddleware,
  DenimAuthenticatorMiddleware(data, denimAuth),
  dataRouter,
);

app.use('/api/auth', cors(), larkAuth.loginEndpoint());
app.use('/api/auth/me', cors(), authMiddleware, (req, res) => {
  return res.json((req as any).user || null);
});

app.listen(9090, () => console.log('Listening...'));

if (process.env.ENABLE_SYNC) {
  const updateCoordinator = new UpdateCoordinator({
    saveLastCheck: async (lastCheck) =>
      fs.writeFileSync('.lastcheck', lastCheck),
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

  updateCoordinator.registerRetriever(
    'departments',
    DenimDataRetriever(data, 'Department', null, 'Last Modified'),
  );

  updateCoordinator.registerUpdater(
    'departments',
    DepartmentMapper.forward,
    lark.department(),
  );

  updateCoordinator.registerRetriever(
    'employees',
    DenimDataRetriever(data, 'Employee', null, 'Last Modified'),
  );

  updateCoordinator.registerUpdater(
    'employees',
    EmployeeMapper.forward,
    lark.employee(),
    async (employee: any, originalEmployee: DenimRecord) => {
      if (!originalEmployee['Lark ID'] && employee.open_id) {
        await data.updateRecord('Employee', String(originalEmployee.id), {
          'Lark ID': employee.open_id,
        });
      }
    },
  );

  updateCoordinator.poll(0);
}
