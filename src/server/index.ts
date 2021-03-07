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
import {
  DenimDataContext,
  DenimQueryOperator,
  DenimRecord,
} from '../denim/core';
import LarkAuthentication from './LarkAuthentication';
import { DenimCombinedDataSource } from '../denim/service';
import LemonadeValidations from '../validation';
import LemonadeAuthenticator from './LemonadeAuthenticator';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyLuy77TiMrMgCUY',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');

const dataSource = () => {
  const coreSchema = new AirTableSchemaSource<
    {
      userData?: DenimRecord;
    } & DenimDataContext
  >(require('../schema/airtable-schema.json'));
  const coreData = new AirTableDataSource<
    {
      userData?: DenimRecord;
    } & DenimDataContext,
    AirTableSchemaSource<
      {
        userData?: DenimRecord;
      } & DenimDataContext
    >
  >(coreSchema, process.env.CORE_BASE_ID);

  const movementSchema = new AirTableSchemaSource<
    {
      userData?: DenimRecord;
    } & DenimDataContext
  >(require('../schema/airtable-movement-schema.json'));
  const movementData = new AirTableDataSource<
    {
      userData?: DenimRecord;
    } & DenimDataContext,
    AirTableSchemaSource<
      {
        userData?: DenimRecord;
      } & DenimDataContext
    >
  >(movementSchema, process.env.MOVEMENT_BASE_ID);

  LemonadeValidations(coreSchema);
  LemonadeValidations(movementSchema);

  return new DenimCombinedDataSource(coreData, movementData);
};

const data = dataSource();
const securedData = dataSource();

const denimAuth = LemonadeAuthenticator(securedData.schemaSource.findTableSchema('Employee'));

denimAuth.attach(securedData);

const employeeDataProvider = data.createDataProvider('Employee');
const departmentDataProvider = data.createDataProvider('Department');

const fs = require('fs');
const lark = new LarkUpdater(
  String(process.env.LARK_APP_ID),
  String(process.env.LARK_APP_SECRET),
);

const larkAuth = new LarkAuthentication(lark, 'test-secret-key');
const dataRouter = DenimDataSourceRouter(securedData);
const authMiddleware = larkAuth.middleware(async (id, req, res, next) => {
  // Find the user.
  const [employee] = await employeeDataProvider.retrieveRecords(
    {},
    {
      conditions: {
        conditionType: 'single',
        field: 'Lark ID',
        operator: DenimQueryOperator.Equals,
        value: id,
      },
    },
  );

  if (employee) {
    (req as any).denimContext = {
      userData: employee,
    };
  }

  return next();
});

app.use('/api/auth/me', cors(), authMiddleware, (req, res) => {
  if ((req as any).denimContext) {
    return res.json({
      ...(req as any).denimContext,
      roles: denimAuth.getRolesFor((req as any).denimContext.userData),
    });
  }

  return res.json(null);
});

app.use('/api/data', cors(), authMiddleware, dataRouter);

app.use('/api/auth', cors(), larkAuth.loginEndpoint());

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
        await employeeDataProvider.updateRecord(
          {},
          String(originalEmployee.id),
          {
            'Lark ID': employee.open_id,
          },
        );
      }
    },
  );

  updateCoordinator.poll(0);
}
