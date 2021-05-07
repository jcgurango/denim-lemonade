import bent from 'bent';
import dashify from 'dashify';
import { DenimRecord, DenimQuery, DenimTable } from '../core';
import DenimDataSourceV2 from './DenimDataSourceV2';

export default class DenimRemoteDataSourceV2 extends DenimDataSourceV2 {
  public baseUrl: string;
  public headers: any = { };

  constructor(apiBaseUrl: string) {
    super();
    this.baseUrl = apiBaseUrl;
  }

  public async retrieveSchema(): Promise<void> {
    const schema = await bent(this.baseUrl, 'json', this.headers)('/schema');
    this.schema = schema;
  }

  protected async retrieve(table: string, id: string): Promise<DenimRecord | null> {
    const data = await bent(this.baseUrl, 'json', this.headers)(`/${dashify(table)}/${id}`);
    return data;
  }

  protected async query(table: string, query?: DenimQuery): Promise<DenimRecord[]> {
    const source = this.findSourceByTable(table);
    return source.retrieveRecords(table, query);
  }

  protected save(table: string, record: DenimRecord): Promise<DenimRecord> {
    const source = this.findSourceByTable(table);

    if (record.id) {
      return source.updateRecord(table, record.id, record);
    }

    return source.createRecord(table, record);
  }

  protected async delete(table: string, id: string): Promise<void> {
    const source = this.findSourceByTable(table);
    await source.deleteRecord(table, id);
  }
}
