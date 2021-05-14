import bent from 'bent';
import dashify from 'dashify';
import qs from 'querystring';
import { DenimRecord, DenimQuery } from '../core';
import DenimDataSourceV2 from './DenimDataSourceV2';

export default class DenimRemoteDataSourceV2 extends DenimDataSourceV2 {
  public baseUrl: string;
  public headers: any = {};

  constructor(apiBaseUrl: string) {
    super();
    this.baseUrl = apiBaseUrl;
  }

  public async retrieveSchema(): Promise<void> {
    const schema = await bent(this.baseUrl, 'json', this.headers)('/schema');
    this.schema = schema;
  }

  protected async retrieve(
    table: string,
    id: string,
  ): Promise<DenimRecord | null> {
    const data = await bent(
      this.baseUrl,
      'json',
      this.headers,
    )(`/${dashify(table)}/${id}`);
    return data;
  }

  protected async query(
    table: string,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    const data = await bent(
      this.baseUrl,
      'json',
      query?.conditions ? 'POST' : 'GET',
      this.headers,
    )(
      `/${dashify(table)}?${qs.stringify({
        expand: query?.expand ? query.expand.join(',') : undefined,
        page_size: query?.pageSize ? query.pageSize : undefined,
        page: query?.page ? query.page : undefined,
        all: query?.retrieveAll ? query.retrieveAll : undefined,
        sort: query?.sort && !Array.isArray(query.sort) && query.sort.column,
        ascending:
          query?.sort && !Array.isArray(query.sort) && query.sort.ascending
            ? 'Y'
            : '',
      })}`,
      query?.conditions
    );
    return data;
  }

  protected save(table: string, record: DenimRecord): Promise<DenimRecord> {
    if (record.id) {
      return bent<DenimRecord>(
        this.baseUrl,
        'json',
        'PUT',
        this.headers,
      )(`/${dashify(table)}/${record.id}`, record);
    }

    return bent<DenimRecord>(
      this.baseUrl,
      'json',
      'PUT',
      this.headers,
    )(`/${dashify(table)}`, record);
  }

  protected async delete(table: string, id: string): Promise<void> {
    await bent(
      this.baseUrl,
      'DELETE',
      this.headers,
    )(`/${dashify(table)}/${id}`);
  }
}
