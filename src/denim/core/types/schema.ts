import * as Yup from 'yup';

export interface DenimSchema {
  tables: DenimTable[];
}

export interface DenimTable {
  id: string;
  name: string;
  nameField: string;
  label: string;
  columns: DenimColumn[];
  defaultView?: string;
}

export type DenimColumn = DenimColumnDefinition<DenimColumnType.Text, DenimTextProperties | undefined>
  | DenimColumnDefinition<DenimColumnType.Number, undefined>
  | DenimColumnDefinition<DenimColumnType.Select, DenimSelectProperties>
  | DenimColumnDefinition<DenimColumnType.MultiSelect, DenimSelectProperties>
  | DenimColumnDefinition<DenimColumnType.Boolean, undefined>
  | DenimColumnDefinition<DenimColumnType.DateTime, DenimDateTimeProperties>
  | DenimColumnDefinition<DenimColumnType.ForeignKey, DenimForeignKeyProperties>
  | DenimColumnDefinition<DenimColumnType.ReadOnly, undefined>;

interface DenimColumnDefinition<T, TO> {
  name: string;
  label: string;
  type: T;
  properties: TO;
}

export enum DenimColumnType {
  Text = 'text',
  Number = 'number',
  Select = 'select',
  MultiSelect = 'multi-select',
  Boolean = 'boolean',
  DateTime = 'date-time',
  ForeignKey = 'foreign-key',
  ReadOnly = 'readonly',
}

export interface DenimTextProperties {
  long?: boolean;
}

export interface DenimSelectProperties {
  options: DenimSelectOption[];
}

export interface DenimSelectOption {
  label: string;
  value: string;
}

export interface DenimDateTimeProperties {
  includesTime?: boolean;
}

export interface DenimForeignKeyProperties {
  foreignTableId: string;
  multiple?: boolean;
}

export type YupAst = [string] | [string, any] | [string, any, string] | ['yup.test', Yup.TestOptionsMessage<{}, any>] | YupAst[];
