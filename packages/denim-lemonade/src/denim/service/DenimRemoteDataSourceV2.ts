import bent from 'bent';
import dashify from 'dashify';
import qs from 'querystring';
import { DenimRecord, DenimQuery } from '../core';
import DenimDataSourceV2 from './DenimDataSourceV2';
import { DenimResultAction, DenimWorkflowContext } from './types/workflow';

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
    id: string,
  ): Promise<DenimRecord | null> {
    return this.wrapRequest(() =>
      bent(this.baseUrl, 'json', this.headers)(`/${dashify(table)}/${id}`),
    );
  }

  protected async query(
    table: string,
    query?: DenimQuery,
  ): Promise<DenimRecord[]> {
    return this.wrapRequest(() =>
      bent(
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
        query?.conditions,
      ),
    );
  }

  protected async save(
    table: string,
    record: DenimRecord,
  ): Promise<DenimRecord> {
    if (record.id) {
      return this.wrapRequest(() =>
        bent<DenimRecord>(
          this.baseUrl,
          'json',
          'PUT',
          this.headers,
        )(`/${dashify(table)}/${record.id}`, record),
      );
    }

    return this.wrapRequest(() =>
      bent<DenimRecord>(
        this.baseUrl,
        'json',
        'PUT',
        this.headers,
      )(`/${dashify(table)}`, record),
    );
  }

  protected async delete(table: string, id: string): Promise<void> {
    await this.wrapRequest(() =>
      bent(this.baseUrl, 'DELETE', this.headers)(`/${dashify(table)}/${id}`),
    );
  }

  public async executeWorkflow(
    workflowName: string,
    input: DenimRecord,
    context: DenimWorkflowContext,
  ) {
    const result = await this.wrapRequest(() =>
      bent<DenimResultAction>(
        this.baseUrl,
        'POST',
        this.headers,
      )(`/workflow/${dashify(workflowName)}`, input),
    );

    context.resultingAction = result;
  }
}