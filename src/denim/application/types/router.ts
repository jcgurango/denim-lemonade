import { DenimFormSchema, DenimViewSchema } from '../../core';
import { DenimScreenProps } from '../screens/DenimScreen';

export interface DenimRouterSchema {
  screens: DenimRouterScreenSchema[];
}

export type DenimMenuItemSchema = DenimScreenMenuItem;

export interface DenimMenuItem<T extends string> {
  id: string;
  type: T;
  label: string;
  roles?: string[];
}

export interface DenimScreenMenuItem extends DenimMenuItem<'screen'> {
  screen: string;
}

export interface DenimMenuSchema {
  menuItems: DenimMenuItemSchema[];
}

export type DenimRouterScreenSchema =
  | DenimFormScreenSchema
  | DenimViewScreenSchema
  | DenimPageScreenSchema
  | DenimFilterScreenSchema
  | DenimContentScreenSchema;

interface DenimScreenSchema<T extends string> {
  id: string;
  paths: string[];
  type: T;
  roles?: string[];
  preContent?: any;
  postContent?: any;
}

export type DenimApplicationContextVariable =
  | string
  | { $user: string }
  | { $route: string }
  | { $screen: string };

export interface DenimFormScreenSchema extends DenimScreenSchema<'form'> {
  table: string;
  record?: DenimApplicationContextVariable;
  form: DenimFormSchema;
}

export interface DenimFilterScreenSchema extends DenimScreenSchema<'filter'> {
  table: string;
  filterColumns: string[];
  globalSearchColumns?: string[];
  filter?: DenimApplicationContextVariable;
}

export interface DenimViewScreenSchema extends DenimScreenSchema<'view'> {
  form?: string;
  table: string;
  view: DenimViewSchema;
  actions?: DenimViewActionSchema[];
  filter?: DenimApplicationContextVariable;
}

export type DenimViewActionSchema = DenimViewRecordScreenActionSchema | DenimViewRecordPathActionSchema | DenimViewActionSchemaType<'delete'>;

export interface DenimViewActionSchemaType<T extends string> {
  type: T;
  roles?: string[];
}

export interface DenimViewRecordScreenActionSchema extends DenimViewActionSchemaType<'view'> {
  screen: string;
  routeParameter?: string;
}

export interface DenimViewRecordPathActionSchema extends DenimViewActionSchemaType<'view'> {
  path: string;
}

export interface DenimPageScreenColumn {
  relativeWidth: number;
  screen: DenimRouterScreenSchema;
}

export interface DenimPageScreenRow {
  columns: DenimPageScreenColumn[];
}

export interface DenimPageScreenSchema extends DenimScreenSchema<'page'> {
  rows: DenimPageScreenRow[];
}

export interface DenimContentScreenSchema extends DenimScreenSchema<'content'> {
  content: any;
}
