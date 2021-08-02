import {
  DenimColumn,
  DenimColumnType,
  DenimQuery,
  DenimRecord,
  DenimTable,
  DenimDataSourceV2,
  DenimLocalQuery,
} from 'denim';
import bent from 'bent';

type PaydayCredentials = { merchant_id: string; merchant_key: string };

const textField = (name: string, label: string = ''): DenimColumn => {
  return {
    name,
    label: label || name,
    type: DenimColumnType.Text,
    properties: {},
  };
};

const booleanField = (name: string, label: string = ''): DenimColumn => {
  return {
    name,
    label: label || name,
    type: DenimColumnType.Boolean,
    properties: undefined,
  };
};

const readToWriteMap: {
  [key: string]: string;
} = {
  EmployeeId: 'employee_id',
  Lastname: 'last_name',
  Firstname: 'first_name',
  Middlename: 'middle_name',
  Birthdate: 'birthdate',
  Pagibig: 'pagibig',
  PhilHealth: 'phil_health',
  SSS: 'sss',
  TaxId: 'tax_id',
  Company: 'company',
  Location: 'location',
  Wage: 'wage',
  EmploymentStatus: 'employment_status',
  JobsStatus: 'job_status',
  DaysPerYear: 'days_per_year',
  Paybasis: 'pay_basis',
  MonthlyRate: 'monthly_rate',
  BasicRate: 'basic_rate',
  Ecola: 'ecola',
  BasicAdjustment: 'basic_adjustment',
  Grouping: 'grouping',
  PaymentMethod: 'payment_method',
  BankAccount: 'bank_account',
  DateHired: 'date_hired',
  StartDate: 'start_date',
  RegularizationDate: 'regularization_date',
  ResignationDate: 'resignation_date',
  MobileNo: 'mobile_no',
  TelephoneNo: 'telephone_no',
  Email: 'email',
  Nationality: 'nationality',
  Sex: 'sex',
  CivilStatus: 'civil_status',
};

export default class PaydayDataSource extends DenimDataSourceV2 {
  public baseUrl: string;
  public credentials: PaydayCredentials;

  constructor(baseUrl: string, credentials: PaydayCredentials) {
    super();
    this.baseUrl = baseUrl;
    this.credentials = credentials;

    this.schema = {
      tables: [
        {
          id: 'pdy-locations',
          name: 'pdy-locations',
          nameField: 'Name',
          label: 'Locations',
          columns: [
            textField('Code'),
            textField('CompanyId'),
            textField('Name'),
          ],
        },
        {
          id: 'pdy-wages',
          name: 'pdy-wages',
          nameField: 'Description',
          label: 'Wages',
          columns: [
            textField('Code'),
            textField('Description'),
            {
              name: 'Amount',
              label: 'Amount',
              type: DenimColumnType.Number,
              properties: undefined,
            },
          ],
        },
        {
          id: 'pdy-groupings',
          name: 'pdy-groupings',
          nameField: 'Description',
          label: 'Groupings',
          columns: [textField('Code'), textField('Description')],
        },
        {
          id: 'pdy-employment/status',
          name: 'pdy-employment-status',
          nameField: 'Status',
          label: 'Employment Status',
          columns: [textField('Status')],
        },
        {
          id: 'pdy-jobs/status',
          name: 'pdy-jobs-status',
          nameField: 'Status',
          label: 'Job Status',
          columns: [textField('Status')],
        },
        {
          id: 'pdy-days/per/year',
          name: 'pdy-days-per-year',
          nameField: 'Days',
          label: 'Days Per Year',
          columns: [textField('Days')],
        },
        {
          id: 'pdy-pay/basis',
          name: 'pdy-pay-basis',
          nameField: 'Basis',
          label: 'Pay Basis',
          columns: [textField('Basis')],
        },
        {
          id: 'pdy-payment/methods',
          name: 'pdy-payment-methods',
          nameField: 'Method',
          label: 'Payment Methods',
          columns: [textField('Method')],
        },
        {
          id: 'pdy-nationalities',
          name: 'pdy-nationalities',
          nameField: 'Name',
          label: 'Nationalities',
          columns: [textField('Name')],
        },
        {
          id: 'pdy-locations',
          name: 'pdy-locations',
          nameField: 'Description',
          label: 'Groupings',
          columns: [textField('Code'), textField('Description')],
        },
        {
          id: 'pdy-companies',
          name: 'pdy-companies',
          nameField: 'Name',
          label: 'Companies',
          columns: [
            textField('Code'),
            textField('Name'),
            textField('Address'),
            textField('ZipCode'),
            textField('ContactPerson'),
            textField('Position'),
            textField('FaxNo'),
            textField('MobileNo'),
            textField('TelephoneNo'),
            textField('Pagibig'),
            textField('PhilHealth'),
            textField('SSS'),
            textField('TaxId'),
          ],
        },
        {
          id: 'pdy-payroll/periods',
          name: 'pdy-payroll-periods',
          nameField: 'Desc',
          label: 'Payroll Periods',
          columns: [
            textField('Code'),
            textField('Desc'),
            {
              name: 'Year',
              label: 'Year',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            textField('Month'),
            {
              name: 'Start',
              label: 'Start',
              type: DenimColumnType.DateTime,
              properties: {
                includesTime: true,
              },
            },
            {
              name: 'End',
              label: 'End',
              type: DenimColumnType.DateTime,
              properties: {
                includesTime: true,
              },
            },
            {
              name: 'Company',
              label: 'Company',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-companies',
                multiple: false,
              },
            },
            {
              name: 'Grouping',
              label: 'Grouping',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-groupings',
                multiple: false,
              },
            },
            {
              name: 'PayrollCount',
              label: 'Payroll Count',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            {
              name: 'WithHoldingTaxBasis',
              label: 'WithHolding Tax Basis',
              type: DenimColumnType.MultiSelect,
              properties: {
                options: [
                  {
                    value: 'Semi-Monthly',
                    label: 'Semi-Monthly',
                  },
                ],
              },
            },
            booleanField('DeductPagibig', 'Deduct Pagibig'),
            booleanField('DeductPhilHealth', 'Deduct PhilHealth'),
            booleanField('DeductSSS', 'Deduct SSS'),
            booleanField('Open'),
            booleanField('Active'),
            booleanField('LastStatutory', 'Last Statutory'),
            booleanField('PCost', 'P Cost'),
          ],
        },
        {
          id: 'pdy-employees',
          name: 'pdy-employees',
          nameField: 'EmployeeId',
          label: 'PayDay Employeees',
          columns: [
            textField('EmployeeId', 'Employee ID'),
            textField('Lastname', 'Last Name'),
            textField('Firstname', 'First Name'),
            textField('Middlename', 'Middle Name'),
            {
              name: 'Birthdate',
              label: 'Birth Date',
              type: DenimColumnType.DateTime,
              properties: {},
            },
            textField('Pagibig'),
            textField('PhilHealth'),
            textField('SSS', 'SSS'),
            textField('TaxId', 'Tax ID'),
            {
              name: 'Company',
              label: 'Company',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-companies',
                multiple: false,
              },
            },
            {
              name: 'Location',
              label: 'Location',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-locations',
                multiple: false,
              },
            },
            {
              name: 'Wage',
              label: 'Wage',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-wages',
                multiple: false,
              },
            },
            {
              name: 'EmploymentStatus',
              label: 'Employment Status',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-employment/status',
                multiple: false,
              },
            },
            {
              name: 'JobsStatus',
              label: 'Job Status',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-jobs/status',
                multiple: false,
              },
            },
            {
              name: 'DaysPerYear',
              label: 'Days Per Year',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-days/per/year',
                multiple: false,
              },
            },
            {
              name: 'Paybasis',
              label: 'Pay Basis',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-pay/basis',
                multiple: false,
              },
            },
            {
              name: 'MonthlyRate',
              label: 'Monthly Rate',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            {
              name: 'BasicRate',
              label: 'Basic Rate',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            {
              name: 'Ecola',
              label: 'Ecola',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            {
              name: 'BasicAdjustment',
              label: 'Basic Adjustment',
              type: DenimColumnType.Number,
              properties: undefined,
            },
            {
              name: 'Grouping',
              label: 'Grouping',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-groupings',
                multiple: false,
              },
            },
            {
              name: 'PaymentMethod',
              label: 'Payment Method',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-payment/methods',
                multiple: false,
              },
            },
            textField('BankAccount', 'Bank Account'),
            {
              name: 'DateHired',
              label: 'Date Hired',
              type: DenimColumnType.DateTime,
              properties: {},
            },
            {
              name: 'StartDate',
              label: 'Start Date',
              type: DenimColumnType.DateTime,
              properties: {},
            },
            {
              name: 'RegularizationDate',
              label: 'Regularization Date',
              type: DenimColumnType.DateTime,
              properties: {},
            },
            {
              name: 'ResignationDate',
              label: 'Resignation Date',
              type: DenimColumnType.DateTime,
              properties: {},
            },
            textField('MobileNo', 'Mobile Number'),
            textField('TelephoneNo', 'Telephone Number'),
            textField('Email'),
            {
              name: 'Nationality',
              label: 'Nationality',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'pdy-nationalities',
                multiple: false,
              },
            },
            textField('Sex'),
            textField('CivilStatus', 'Civil Status'),
          ],
        },
      ],
    };
  }

  protected transformRecord(
    table: string | DenimTable,
    record: any
  ): DenimRecord | null {
    if (!record) {
      return null;
    }

    const tableSchema =
      typeof table === 'string' ? this.getTable(table) : table;

    const { Id, ...rest } = record;

    Object.keys(rest).forEach((key) => {
      const column = tableSchema.columns.find(({ name }) => name === key);

      if (column?.type === DenimColumnType.ForeignKey) {
        const otherTableSchema = this.getTable(
          column.properties.foreignTableId
        );
        const value = rest[key];

        if (column.properties.multiple) {
          rest[key] = {
            type: 'record-collection',
            records: value
              ? value.map((record: any) => {
                  const transformed = this.transformRecord(
                    otherTableSchema,
                    record
                  );

                  return {
                    type: 'record',
                    name: transformed
                      ? transformed[otherTableSchema.nameField]
                      : '',
                    record: transformed,
                  };
                })
              : [],
          };
        } else {
          const transformed = this.transformRecord(otherTableSchema, value);

          rest[key] = value ? {
            type: 'record',
            name: transformed ? transformed[otherTableSchema.nameField] : '',
            record: transformed,
          } : value;
        }
      }
    });

    return {
      id: String(Id),
      ...rest,
    };
  }

  protected async getHeaders() {
    const key = await bent(
      this.baseUrl,
      'json',
      'POST'
    )('/auth/merchants/signin', this.credentials);

    return {
      Authorization: `Bearer ${key}`,
    };
  }

  protected async retrieve(
    table: string,
    id: string
  ): Promise<DenimRecord | null> {
    const tableSchema = this.getTable(table);
    const headers = await this.getHeaders();
    const data = await bent(this.baseUrl, 'json', 'GET')(
      `/${tableSchema.id.substring(4)}/${id}`,
      undefined,
      headers
    );

    return this.transformRecord(tableSchema, data);
  }

  protected async query(
    table: string,
    query?: DenimQuery
  ): Promise<DenimRecord[]> {
    const tableSchema = this.getTable(table);
    const headers = await this.getHeaders();
    const data: any[] = await bent(this.baseUrl, 'json', 'GET')(
      `/${tableSchema.id.substring(4)}`,
      undefined,
      headers
    );
    const records = data.map((data: any) =>
      this.transformRecord(tableSchema, data)
    );

    const filtered: DenimRecord[] = [];

    records.forEach((record) => {
      if (record) {
        filtered.push(record);
      }
    });

    const filteredRecords = filtered.filter((record) => {
      if (query?.conditions) {
        return DenimLocalQuery.matches(tableSchema, record, query.conditions);
      }

      return true;
    });

    if (query && !query.retrieveAll && query.pageSize && query.page) {
      return filteredRecords.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize
      );
    }

    return filteredRecords;
  }

  public async createEmployee(data: any) {
    try {
      const headers = await this.getHeaders();
      console.log(headers, `PUT /employees`, JSON.stringify(data));
      await bent(this.baseUrl, 'PUT')(`/employees`, data, headers);
    } catch (e) {
      throw e;
    }
  }

  public async updateEmployee(id: string, data: any) {
    try {
      const headers = await this.getHeaders();
      console.log(headers, `PUT /employees/${id}`, JSON.stringify(data));
      await bent(this.baseUrl, 'PUT')(`/employees/${id}`, data, headers);
    } catch (e) {
      throw e;
    }
  }

  protected async save(
    table: string,
    record: DenimRecord
  ): Promise<DenimRecord> {
    throw new Error('Method not implemented.');
  }

  protected delete(table: string, id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
