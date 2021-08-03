import express from 'express';
import {
  DenimDataSourceV2Router,
  DenimAuthenticatorMiddleware,
} from 'denim-express';
import UpdateCoordinator from './sync/UpdateCoordinator';
import { DenimDataRetriever } from './sync/retrievers/DenimDataRetriever';
import { EmployeeMapper } from './sync/mappers/EmployeeMapper';
import LarkUpdater from './sync/updaters/LarkUpdater';
import { DepartmentMapper } from './sync/mappers/DepartmentMapper';
import { DenimQueryOperator, DenimRecord } from 'denim';
import LarkAuthentication from './LarkAuthentication';
import LemonadeAuthenticator from './LemonadeAuthenticator';
import LemonadeDataSource from './LemonadeDataSource';
import { AirTableDataSourceV2 } from 'denim-airtable';

AirTableDataSourceV2.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY,
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const larkAdmin = require('lark-airtable-connector/src/services/lark-admin');
const attendance =
  require('lark-airtable-connector/src/services/retrievers/attendance-retriever')(
    larkAdmin
  );

const app = express();
const cors = require('cors');

const data = LemonadeDataSource;
const denimAuth = LemonadeAuthenticator(data.getTable('Employee'), data);

const fs = require('fs');
const lark = new LarkUpdater(
  String(process.env.LARK_APP_ID),
  String(process.env.LARK_APP_SECRET)
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
  dataRouter
);

app.use('/api/auth', cors(), larkAuth.loginEndpoint());
app.use('/api/auth/me', cors(), authMiddleware, (req, res) => {
  return res.json((req as any).user || null);
});

app.listen(9090, () => console.log('Listening...'));

(async () => {
  console.log('Syncing master records from PayDay...');

  const sync = async (
    paydayTable: string,
    lemonadeTable: string,
    fieldMap: { [key: string]: string }
  ) => {
    console.log(`Syncing ${paydayTable} => ${lemonadeTable}...`);

    const paydayRecords = await LemonadeDataSource.retrieveRecords(paydayTable);

    for (let i = 0; i < paydayRecords.length; i++) {
      const record = paydayRecords[i];
      const updateRecord: DenimRecord = {
        'PDY ID': record.id,
      };

      Object.keys(fieldMap).forEach((key) => {
        updateRecord[fieldMap[key]] = record[key];
      });

      // Look for an existing record.
      const [existingRecord] = await LemonadeDataSource.retrieveRecords(
        lemonadeTable,
        {
          conditions: {
            conditionType: 'single',
            field: 'PDY ID',
            operator: DenimQueryOperator.Equals,
            value: record.id,
          },
        }
      );

      if (record.CompanyId) {
        const [companyRecord] = await LemonadeDataSource.retrieveRecords(
          'Companies',
          {
            conditions: {
              conditionType: 'single',
              field: 'PDY ID',
              operator: DenimQueryOperator.Equals,
              value: record.CompanyId,
            },
          }
        );

        if (companyRecord) {
          updateRecord.Company = {
            type: 'record',
            id: companyRecord.id || '',
          };
        }
      }

      if (existingRecord) {
        await LemonadeDataSource.updateRecord(
          lemonadeTable,
          existingRecord.id || '',
          updateRecord
        );
      } else {
        await LemonadeDataSource.createRecord(lemonadeTable, updateRecord);
      }
    }
  };

  await sync('pdy-wages', 'Wage Zones', {
    Code: 'REGION',
    Description: 'Description',
    Amount: 'Minimum Wage',
  });

  await sync('pdy-jobs-status', 'Account Statuses', {
    Status: 'Name',
  });

  await sync('pdy-groupings', 'Payroll Groupings', {
    Code: 'Name',
    Description: 'Description',
  });

  await sync('pdy-companies', 'Companies', {
    Code: 'CODE',
    Name: 'Company Name',
    Address: 'Address',
    ZipCode: 'ZIP Code',
    ContactPerson: 'Contact Person',
    Position: 'Contact Position',
    FaxNo: 'Fax Number',
    MobileNo: 'Mobile Number',
    TelephoneNo: 'Telephone Number',
    Pagibig: 'PAGIBIG ID',
    PhilHealth: 'PHILHEALTH ID',
    SSS: 'SSS ID',
    TaxId: 'TIN NUMBER',
  });

  await sync('pdy-nationalities', 'Nationalities', {
    Name: 'Name',
  });

  await sync('pdy-days-per-year', 'Days of Work Per Year', {
    Name: 'Days',
  });

  await sync('pdy-employment-status', 'Employment Statuses', {
    Status: 'Name',
  });

  await sync('pdy-pay-basis', 'Pay Basis', {
    Basis: 'Name',
  });

  await sync('pdy-locations', 'Workplaces', {
    Code: 'Code',
    Name: 'Workplace',
  });
})();

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

updateCoordinator.registerRetriever(
  'departments',
  DenimDataRetriever(data, 'Department', null, 'Last Modified')
);

updateCoordinator.registerUpdater(
  'departments',
  DepartmentMapper.forward,
  lark.department(),
  async (
    { department_info: department }: any,
    originalDepartment: DenimRecord
  ) => {
    if (!originalDepartment['Lark ID'] && department.id) {
      await data.updateRecord('Department', String(originalDepartment.id), {
        'Lark ID': department.id,
      });
    }
  }
);

updateCoordinator.registerRetriever(
  'employees',
  DenimDataRetriever(
    data,
    'Employee',
    {
      expand: ['Department'],
    },
    'Last Modified'
  )
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
  }
);

(async () => {
  console.log('Initializing lark admin...');
  await larkAdmin.init();
  console.log('Lark admin initialized.');
})();

if (process.env.ENABLE_SYNC) {
  updateCoordinator.poll(200);
}
