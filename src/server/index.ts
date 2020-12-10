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
import { DenimAuthenticator } from '../denim/service';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyLuy77TiMrMgCUY',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');

const schema = new AirTableSchemaSource<{
  userData?: DenimRecord;
}>(
  require('../schema/airtable-schema.json'),
);
const data = new AirTableDataSource<{}, AirTableSchemaSource<{}>>(schema, 'appjkBnHNyutcO3Wr');

const securedSchema = new AirTableSchemaSource<{
  userData?: DenimRecord;
}>(require('../schema/airtable-schema.json'));
const securedData = new AirTableDataSource<
  {
    userData?: DenimRecord;
    tags?: { [key: string]: any };
  },
  AirTableSchemaSource<{ userData?: DenimRecord }>
>(securedSchema, 'appjkBnHNyutcO3Wr');

const denimAuth = new DenimAuthenticator(
  [
    {
      id: 'hr',
      readAction: 'allow',
      createAction: 'allow',
      updateAction: 'allow',
      deleteAction: 'allow',
      tables: [],
      roleQuery: {
        conditionType: 'single',
        field: 'Is HR',
        operator: DenimQueryOperator.Equals,
        value: true,
      },
    },
    {
      id: 'employee',
      readAction: 'block',
      createAction: 'block',
      updateAction: 'block',
      deleteAction: 'block',
      tables: [
        {
          table: 'Employee',
          createAction: 'block',
          readAction: {
            conditionType: 'group',
            type: 'OR',
            conditions: [
              {
                conditionType: 'single',
                field: 'id',
                operator: DenimQueryOperator.Equals,
                value: {
                  $user: 'id',
                },
              },
              {
                conditionType: 'single',
                field: 'id',
                operator: DenimQueryOperator.Equals,
                value: {
                  $user: 'Direct Manager',
                },
              }
            ],
          },
          updateAction: {
            conditionType: 'single',
            field: 'id',
            operator: DenimQueryOperator.Equals,
            value: {
              $user: 'id',
            },
            allowedFields: ['First Name', 'Last Name', 'Email'],
          },
        },
        {
          table: 'Leave Scheme',
          createAction: 'block',
          readAction: 'allow',
          updateAction: 'block',
        },
        {
          table: 'Department',
          createAction: 'block',
          readAction: 'allow',
          updateAction: 'block',
        },
        {
          table: 'Job Title',
          createAction: 'block',
          readAction: 'allow',
          updateAction: 'block',
        },
        {
          table: 'Job Roles',
          createAction: 'block',
          readAction: 'allow',
          updateAction: 'block',
        },
        {
          table: 'Employee Allowance',
          createAction: 'block',
          readAction: 'allow',
          updateAction: 'block',
        }
      ],
      roleQuery: {
        conditionType: 'single',
        field: 'Is HR',
        operator: DenimQueryOperator.DoesNotEqual,
        value: true,
      },
    },
  ],
  schema.findTableSchema('Employee'),
);

denimAuth.attach(securedData);

const fs = require('fs');
const lark = new LarkUpdater(
  'cli_9f4c99b38b37100a',
  'wF6wJHfm0wCUERavJXx0fbqsAcKAZr3x',
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
    (<any>req).denimContext = {
      userData: employee,
    };
  }

  return next();
});

app.use('/auth/me', cors(), authMiddleware, (req, res) => {
  if ((<any>(req)).denimContext) {
    return res.json({
      ...(<any>(req)).denimContext,
      roles: denimAuth.getRolesFor((<any>(req)).denimContext.userData),
    });
  }

  return res.json(null);
});

app.use(
  '/data',
  cors(),
  authMiddleware,
  dataRouter,
);

app.use('/auth', cors(), larkAuth.loginEndpoint());

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

//updateCoordinator.poll(0);
