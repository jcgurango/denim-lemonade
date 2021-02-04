import {
  DenimFormControlSchema,
  DenimFormSchema,
  DenimViewSchema,
} from '../../core';
import { DenimScreenProps } from '../screens/DenimScreen';

export interface DenimRouterSchema {
  screens: DenimRouterComponentSchema[];
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

export type DenimRouterComponentSchema =
  | DenimFormComponentSchema
  | DenimViewComponentSchema
  | DenimFilterComponentSchema
  | DenimContentComponentSchema
  | DenimTabsComponentSchema
  | DenimLayoutComponentSchema
  | DenimFieldComponentSchema
  | DenimFormProviderComponentSchema;

interface DenimComponentSchema<T extends string> {
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

export interface DenimFormComponentSchema extends DenimComponentSchema<'form'> {
  table: string;
  record?: DenimApplicationContextVariable;
  form: DenimFormSchema;
}

export interface DenimFilterComponentSchema
  extends DenimComponentSchema<'filter'> {
  table: string;
  filterColumns: string[];
  globalSearchColumns?: string[];
  filter?: DenimApplicationContextVariable;
}

export interface DenimViewComponentSchema extends DenimComponentSchema<'view'> {
  form?: string;
  table: string;
  view: DenimViewSchema;
  actions?: DenimViewActionSchema[];
  filter?: DenimApplicationContextVariable;
}

export interface DenimTabsComponentSchema extends DenimComponentSchema<'tabs'> {
  tabs: {
    label: string;
    component: DenimRouterComponentSchema;
  }[];
  tabIndex: DenimApplicationContextVariable;
}

export interface DenimLayoutComponentSchema
  extends DenimComponentSchema<'layout'> {
  flowDirection: 'row' | 'column';
  children: {
    id: string;
    relativeWidth?: number;
    component: DenimRouterComponentSchema;
  }[];
}

export interface DenimFormProviderComponentSchema
  extends DenimComponentSchema<'form-provider'> {
  table: string;
  record: DenimApplicationContextVariable;
  component: DenimRouterComponentSchema;
}

export interface DenimFieldComponentSchema extends DenimComponentSchema<'field'> {
  field: DenimFormControlSchema;
}

export type DenimViewActionSchema =
  | DenimViewRecordScreenActionSchema
  | DenimViewRecordPathActionSchema
  | DenimViewActionSchemaType<'delete'>;

export interface DenimViewActionSchemaType<T extends string> {
  type: T;
  roles?: string[];
}

export interface DenimViewRecordScreenActionSchema
  extends DenimViewActionSchemaType<'view'> {
  screen: string;
  routeParameter?: string;
}

export interface DenimViewRecordPathActionSchema
  extends DenimViewActionSchemaType<'view'> {
  path: string;
}

export interface DenimContentComponentSchema
  extends DenimComponentSchema<'content'> {
  content: any;
}
