import { BaseSchema } from 'yup';
import {
  DenimDataContext,
  DenimRecord,
  Expansion,
  DenimQuery,
} from '../../core';

export interface DenimHook<
  T extends string,
  C extends DenimDataContext,
  H extends (table: string, context: C, ...args: any[]) => Promise<[C, ...any[]]>
> {
  table: string | RegExp;
  type: T;
  callback: H;
}

export type DenimDataSourceHook<C extends DenimDataContext> =
  | DenimHook<
      'pre-retrieve-record',
      C,
      (
        table: string,
        context: C,
        id: string,
        expansion?: Expansion,
      ) => Promise<[C, string, Expansion | undefined]>
    >
  | DenimHook<
      'pre-retrieve-record-expand',
      C,
      (
        table: string,
        context: C,
        id: string,
        expansion: Expansion | undefined,
        record: DenimRecord | null,
      ) => Promise<[C, string, Expansion | undefined, DenimRecord | null]>
    >
  | DenimHook<
      'post-retrieve-record',
      C,
      (
        table: string,
        context: C,
        id: string,
        expansion: Expansion | undefined,
        record: DenimRecord | null,
      ) => Promise<[C, string, Expansion | undefined, DenimRecord | null]>
    >
  | DenimHook<
      'pre-retrieve-records',
      C,
      (
        table: string,
        context: C,
        query?: DenimQuery,
      ) => Promise<[C, DenimQuery | undefined]>
    >
  | DenimHook<
      'pre-retrieve-records-expand',
      C,
      (
        table: string,
        context: C,
        records: DenimRecord[],
        query?: DenimQuery,
      ) => Promise<[C, DenimRecord[], DenimQuery | undefined]>
    >
  | DenimHook<
      'post-retrieve-records',
      C,
      (
        table: string,
        context: C,
        query: DenimQuery | undefined,
        records: DenimRecord[],
      ) => Promise<[C, DenimQuery | undefined, DenimRecord[]]>
    >
  | DenimHook<
      'pre-create',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
      ) => Promise<[C, DenimRecord]>
    >
  | DenimHook<
      'pre-create-validate',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
        validator: BaseSchema<object, any>,
      ) => Promise<[C, DenimRecord, BaseSchema<object, any>]>
    >
  | DenimHook<
      'post-create-validate',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
      ) => Promise<[C, DenimRecord]>
    >
  | DenimHook<
      'post-create',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
      ) => Promise<[C, DenimRecord]>
    >
  | DenimHook<
      'pre-update',
      C,
      (
        table: string,
        context: C,
        id: string,
        record: DenimRecord,
      ) => Promise<[C, string, DenimRecord]>
    >
  | DenimHook<
      'pre-update-validate',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
        validator: BaseSchema<object, any>,
      ) => Promise<[C, DenimRecord, BaseSchema<object, any>]>
    >
  | DenimHook<
      'post-update-validate',
      C,
      (
        table: string,
        context: C,
        record: DenimRecord,
      ) => Promise<[C, DenimRecord]>
    >
  | DenimHook<
      'post-update',
      C,
      (
        table: string,
        context: C,
        id: string,
        record: DenimRecord,
      ) => Promise<[C, string, DenimRecord]>
    >
  | DenimHook<
      'pre-delete',
      C,
      (
        table: string,
        context: C,
        id: string,
      ) => Promise<[C, string]>
    >
  | DenimHook<
      'post-delete',
      C,
      (
        table: string,
        context: C,
        id: string,
      ) => Promise<[C, string]>
    >
  | DenimHook<
      'pre-find',
      C,
      (
        table: string,
        context: C,
        ids: string[],
        expansion?: Expansion
      ) => Promise<[C, string[], Expansion | undefined]>
    >
  | DenimHook<
      'pre-find-query',
      C,
      (
        table: string,
        context: C,
        ids: string[],
        query: DenimQuery,
        expansion?: Expansion
      ) => Promise<[C, string[], DenimQuery, Expansion | undefined]>
    >
  | DenimHook<
      'post-find',
      C,
      (
        table: string,
        context: C,
        ids: string[],
        query: DenimQuery,
        records: DenimRecord[],
        expansion?: Expansion,
      ) => Promise<[C, string[], DenimQuery, DenimRecord[], Expansion | undefined]>
    >;
