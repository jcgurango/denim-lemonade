import { BaseSchema } from 'yup';
import {
  DenimRecord,
  Expansion,
  DenimQuery,
  DenimColumn,
} from '../../core';

export interface DenimHookV2<
  T extends string,
  H extends (table: string, ...args: any[]) => Promise<[...any[]]>
> {
  table: string | RegExp;
  type: T;
  callback: H;
}

export type DenimDataSourceHookV2 =
  | DenimHookV2<
      'pre-retrieve-record',
      (
        table: string,
        id: string,
        expansion?: Expansion
      ) => Promise<[string, Expansion | undefined]>
    >
  | DenimHookV2<
      'pre-retrieve-record-expand',
      (
        table: string,
        id: string,
        expansion: Expansion | undefined,
        record: DenimRecord | null
      ) => Promise<[string, Expansion | undefined, DenimRecord | null]>
    >
  | DenimHookV2<
      'post-retrieve-record',
      (
        table: string,
        id: string,
        expansion: Expansion | undefined,
        record: DenimRecord | null
      ) => Promise<[string, Expansion | undefined, DenimRecord | null]>
    >
  | DenimHookV2<
      'pre-retrieve-records',
      (table: string, query?: DenimQuery) => Promise<[DenimQuery | undefined]>
    >
  | DenimHookV2<
      'pre-retrieve-records-expand',
      (
        table: string,
        records: DenimRecord[],
        query?: DenimQuery
      ) => Promise<[DenimRecord[], DenimQuery | undefined]>
    >
  | DenimHookV2<
      'post-retrieve-records',
      (
        table: string,
        query: DenimQuery | undefined,
        records: DenimRecord[]
      ) => Promise<[DenimQuery | undefined, DenimRecord[]]>
    >
  | DenimHookV2<
      'pre-create',
      (table: string, record: DenimRecord) => Promise<[DenimRecord]>
    >
  | DenimHookV2<
      'pre-create-validate',
      (table: string, record: DenimRecord) => Promise<[DenimRecord]>
    >
  | DenimHookV2<
      'post-create-validate',
      (table: string, record: DenimRecord) => Promise<[DenimRecord]>
    >
  | DenimHookV2<
      'post-create',
      (table: string, record: DenimRecord) => Promise<[DenimRecord]>
    >
  | DenimHookV2<
      'pre-update',
      (
        table: string,
        id: string,
        record: DenimRecord
      ) => Promise<[string, DenimRecord]>
    >
  | DenimHookV2<
      'pre-update-validate',
      (table: string, record: DenimRecord, oldRecord: DenimRecord) => Promise<[DenimRecord, DenimRecord]>
    >
  | DenimHookV2<
      'post-update-validate',
      (table: string, record: DenimRecord, oldRecord: DenimRecord) => Promise<[DenimRecord, DenimRecord]>
    >
  | DenimHookV2<
      'post-update',
      (
        table: string,
        id: string,
        record: DenimRecord,
        oldRecord: DenimRecord,
      ) => Promise<[string, DenimRecord, DenimRecord]>
    >
  | DenimHookV2<'pre-delete', (table: string, id: string) => Promise<[string]>>
  | DenimHookV2<'post-delete', (table: string, id: string) => Promise<[string]>>
  | DenimHookV2<
      'pre-find',
      (
        table: string,
        ids: string[],
        expansion?: Expansion
      ) => Promise<[string[], Expansion | undefined]>
    >
  | DenimHookV2<
      'pre-find-query',
      (
        table: string,
        ids: string[],
        query: DenimQuery,
        expansion?: Expansion
      ) => Promise<[string[], DenimQuery, Expansion | undefined]>
    >
  | DenimHookV2<
      'post-find',
      (
        table: string,
        ids: string[],
        query: DenimQuery,
        records: DenimRecord[],
        expansion?: Expansion
      ) => Promise<[string[], DenimQuery, DenimRecord[], Expansion | undefined]>
    >
  | DenimHookV2<
      'table-validation',
      (
        table: string,
        columns: DenimColumn[],
        validation: BaseSchema<any>
      ) => Promise<[DenimColumn[], BaseSchema<any>]>
    >
  | DenimHookV2<
      'field-validation',
      (
        table: string,
        columns: DenimColumn[],
        columnSchema: DenimColumn,
        validation: BaseSchema<any>
      ) => Promise<[DenimColumn[], DenimColumn, BaseSchema<any>]>
    >;
