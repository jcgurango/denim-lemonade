import bent from 'bent';
import dashify from 'dashify';
import qs from 'querystring';
import { DenimRecord, DenimQuery } from '../core';
import DenimDataSourceV2 from './DenimDataSourceV2';
import { DenimWorkflowContext } from './types/workflow';

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

  private async wrapRequest<T>(callback: () => T): Promise<T> {
    try {
      return await callback();
    } catch (e) {
      if (e.json) {
        const json = await e.json();

        if (json.errors) {
          if (json.errors.length === 1) {
            throw json.errors[0];
          }

          const error: any = new Error('Multiple errors occured.');
          error.inner = json.errors;
          throw error;
        }
      }

      throw e;
    }
  }

  protected async retrieve(
    table: string,
    id: string
  ): Promise<DenimRecord | null> {
    const tableSchema = this.getTable(table);

    return this.wrapRequest(() =>
      bent(
        this.baseUrl,
        'json',
        this.headers
      )(`/${dashify(tableSchema.name)}/${id}`)
    );
  }

  protected async query(
    table: string,
    query?: DenimQuery
  ): Promise<DenimRecord[]> {
    const tableSchema = this.getTable(table);

    return this.wrapRequest(() =>
      bent(
        this.baseUrl,
        'json',
        query?.conditions ? 'POST' : 'GET',
        this.headers
      )(
        `/${dashify(tableSchema.name)}?${qs.stringify({
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
      )
    );
  }

  protected async save(
    table: string,
    record: DenimRecord
  ): Promise<DenimRecord> {
    const tableSchema = this.getTable(table);

    if (record.id) {
      return this.wrapRequest(() =>
        bent<DenimRecord>(
          this.baseUrl,
          'json',
          'PUT',
          this.headers
        )(`/${dashify(tableSchema.name)}/${record.id}`, record)
      );
    }

    return this.wrapRequest(() =>
      bent<DenimRecord>(
        this.baseUrl,
        'json',
        'PUT',
        this.headers
      )(`/${dashify(table)}`, record)
    );
  }

  protected async delete(table: string, id: string): Promise<void> {
    const tableSchema = this.getTable(table);

    await this.wrapRequest(() =>
      bent(
        this.baseUrl,
        'DELETE',
        this.headers
      )(`/${dashify(tableSchema.name)}/${id}`)
    );
  }

  public async executeWorkflow(
    workflowName: string,
    input: DenimRecord,
    context: DenimWorkflowContext
  ) {
    let result = await this.wrapRequest(() =>
      bent<any>(
        'json',
        this.baseUrl,
        'POST',
        this.headers
      )(`/workflow/${dashify(workflowName)}`, input)
    );

    while (result?.pending) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // eslint-disable-next-line no-loop-func
      result = await this.wrapRequest(() =>
        bent<any>(
          'json',
          this.baseUrl,
          'GET',
          this.headers
        )(`/workflow/${dashify(workflowName)}/${result.pending}`)
      );
    }

    context.resultingAction = result;
  }
}
