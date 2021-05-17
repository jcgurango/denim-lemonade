import {
  DenimColumn,
  DenimColumnType,
  DenimQuery,
  DenimRecord,
  DenimTable,
} from '../denim/core';
import { DenimDataSourceV2, DenimLocalQuery } from '../denim/service';
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
          id: 'groupings',
          name: 'groupings',
          nameField: 'Description',
          label: 'Groupings',
          columns: [textField('Code'), textField('Description')],
        },
        {
          id: 'companies',
          name: 'companies',
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
          id: 'payroll/periods',
          name: 'payroll-periods',
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
                foreignTableId: 'companies',
                multiple: false,
              },
            },
            {
              name: 'Grouping',
              label: 'Grouping',
              type: DenimColumnType.ForeignKey,
              properties: {
                foreignTableId: 'groupings',
                multiple: false,
              },
            },
            {
              name: 'PayrollCount',
              label: 'PayrollCount',
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
      ],
    };
  }

  protected transformRecord(
    table: string | DenimTable,
    record: any,
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
          column.properties.foreignTableId,
        );
        const value = rest[key];

        if (column.properties.multiple) {
          rest[key] = {
            type: 'record-collection',
            records: value
              ? value.map((record: any) => {
                  const transformed = this.transformRecord(
                    otherTableSchema,
                    record,
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

          rest[key] = {
            type: 'record',
            name: transformed ? transformed[otherTableSchema.nameField] : '',
            record: transformed,
          };
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
      'POST',
    )('/auth/merchants/signin', this.credentials);

    return {
      Authorization: `Bearer ${key}`,
    };
  }

  protected async retrieve(
    table: string,
    id: string,
  ): Promise<DenimRecord | null> {
    const tableSchema = this.getTable(table);
    const headers = await this.getHeaders();
    const data = await bent(this.baseUrl, 'json', 'GET')(
      `/${tableSchema.id}/${id}`,
      undefined,
      headers,
    );

    return this.transformRecord(tableSchema, data);
  }

  protected async query(
    table: string,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    const tableSchema = this.getTable(table);
    const headers = await this.getHeaders();
    const data: any[] = await bent(this.baseUrl, 'json', 'GET')(
      `/${tableSchema.id}`,
      undefined,
      headers,
    );
    const records = data.map((data: any) =>
      this.transformRecord(tableSchema, data),
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

    if (query?.pageSize && query.page) {
      return filteredRecords.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    }

    return filteredRecords;
  }

  protected save(table: string, record: DenimRecord): Promise<DenimRecord> {
    throw new Error('Method not implemented.');
  }

  protected delete(table: string, id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
