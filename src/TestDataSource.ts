import {
  DenimDataContext,
  DenimQuery,
  DenimRecord,
  DenimTable,
  Expansion,
} from './denim/core';
import {
  DenimDataSource,
  DenimSchemaSource,
  DenimTableDataProvider,
} from './denim/service';
import dashify from 'dashify';
import bent from 'bent';

const endpoint = 'http://192.168.254.102:9090/data';

class TestTableDataProvider<
  T extends DenimDataContext
> extends DenimTableDataProvider<T, DenimSchemaSource<T>> {
  private tableEndpoint: string =
    endpoint + '/' + dashify(this.tableSchema.name);

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
    const response = await bent('json')(this.tableEndpoint + '/' + id);

    return <DenimRecord>response || null;
  }

  async retrieveRecords(
    context: T,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    const response = query
      ? await bent('json', 'POST')(this.tableEndpoint + (query.expand ? ('?expand=' + query.expand.join(',')) : ''), query.conditions)
      : await bent('json')(this.tableEndpoint);

    return <DenimRecord[]>response || null;
  }

  async createRecord(
    context: T,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    const response = await bent('json', 'PUT')(this.tableEndpoint, record);

    return <DenimRecord>response;
  }

  async updateRecord(
    context: T,
    id: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    const response = await bent('json', 'PUT')(this.tableEndpoint + '/' + id, record);

    return <DenimRecord>response;
  }

  async deleteRecord(context: DenimDataContext, id: string): Promise<void> {
    await bent('json', 'DELETE')(this.tableEndpoint + '/' + id);
  }
}

export default class TestDataSource<
  T extends DenimDataContext
> extends DenimDataSource<T, DenimSchemaSource<T>> {
  constructor(schema: DenimSchemaSource<T>) {
    super(schema);
  }

  createDataProvider(
    table: string,
  ): DenimTableDataProvider<T, DenimSchemaSource<T>> {
    return new TestTableDataProvider<T>(
      this,
      <DenimTable>(
        this.schemaSource.schema.tables.find(
          ({ id, name }) => id === table || name === table,
        )
      ),
      this.schemaSource.createValidator(table),
    );
  }
}
