import {
  DenimDataContext,
  DenimQuery,
  DenimRecord,
  DenimTable,
  Expansion,
} from '../core';
import {
  DenimDataSource,
  DenimSchemaSource,
  DenimTableDataProvider,
  DenimValidator,
} from '../service';
import dashify from 'dashify';
import bent from 'bent';
import qs from 'querystring';

export interface DenimRemoteDataContext extends DenimDataContext {
  headers?: Headers;
}

export class DenimRemoteTableProvider<
  T extends DenimRemoteDataContext
> extends DenimTableDataProvider<T, DenimSchemaSource<T>> {
  private tableEndpoint: string;

  constructor(
    source: DenimDataSource<T, DenimSchemaSource<T>>,
    schema: DenimTable,
    validator: DenimValidator<T>,
    endpoint: string,
  ) {
    super(source, schema, validator);
    this.tableEndpoint = endpoint + '/' + dashify(schema.name);
  }

  protected retrieve(id: string): Promise<DenimRecord | null> {
    throw new Error('Method not implemented.');
  }

  protected query(query?: DenimQuery): Promise<DenimRecord[]> {
    throw new Error('Method not implemented.');
  }

  protected save(record: DenimRecord): Promise<DenimRecord> {
    throw new Error('Method not implemented.');
  }

  protected delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async retrieveRecord(
    context: T,
    id: string,
    expansion?: Expansion,
  ): Promise<DenimRecord | null> {
    return this.wrapRequest(async () => {
      const response = await bent(
        'json',
        context.headers || {},
      )(
        this.tableEndpoint +
          '/' +
          id +
          (expansion ? '?expand=' + expansion.join(',') : ''),
      );

      return <DenimRecord>response || null;
    });
  }

  async retrieveRecords(
    context: T,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    return this.wrapRequest(async () => {
      const response = query
        ? await bent(
            'json',
            'POST',
            context.headers || {},
          )(
            this.tableEndpoint +
              '?' + qs.stringify({
                expand: query.expand ? query.expand.join(',') : undefined,
                page_size: query.pageSize ? query.pageSize : undefined,
                page: query.page ? query.page : undefined,
              }),
            query.conditions,
          )
        : await bent('json')(this.tableEndpoint);

      return <DenimRecord[]>response || null;
    });
  }

  async createRecord(context: T, record: DenimRecord): Promise<DenimRecord> {
    return this.wrapRequest(async () => {
      const response = await bent(
        'json',
        'PUT',
        context.headers || {},
      )(this.tableEndpoint, record);

      return <DenimRecord>response;
    });
  }

  async updateRecord(
    context: T,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    return this.wrapRequest(async () => {
      const response = await bent(
        'json',
        'PUT',
        context.headers || {},
      )(this.tableEndpoint + '/' + id, record);

      return <DenimRecord>response;
    });
  }

  async deleteRecord(context: T, id: string): Promise<void> {
    await this.wrapRequest(async () => {
      await bent(
        'json',
        'DELETE',
        context.headers || {},
      )(this.tableEndpoint + '/' + id);
    });
  }

  async wrapRequest<T>(callback: () => T): Promise<T> {
    try {
      return await callback();
    } catch (e) {
      if (e.json) {
        const json = await e.json();

        if (json.errors) {
          const error: any = new Error('Multiple errors occured.');
          error.inner = json.errors;
          throw error;
        }
      }

      throw e;
    }
  }
}

export default class DenimRemoteDataSource<
  T extends DenimRemoteDataContext
> extends DenimDataSource<T, DenimSchemaSource<T>> {
  private endpoint: string;

  constructor(schema: DenimSchemaSource<T>, endpoint: string) {
    super(schema);
    this.endpoint = endpoint;
  }

  createDataProvider(
    table: string,
  ): DenimTableDataProvider<T, DenimSchemaSource<T>> {
    return new DenimRemoteTableProvider<T>(
      this,
      <DenimTable>(
        this.schemaSource.schema.tables.find(
          ({ id, name }) => id === table || name === table,
        )
      ),
      this.schemaSource.createValidator(table),
      this.endpoint,
    );
  }
}
