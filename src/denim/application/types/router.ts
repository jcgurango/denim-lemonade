import {
  DenimFormControlSchema,
  DenimFormSchema,
  DenimQueryConditionOrGroup,
  DenimSortExpression,
  DenimViewSchema,
} from '../../core';
import { DenimIconType } from '../../forms';
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
  defaultState?: any;
}

export type DenimApplicationContextVariable =
  | string
  | { $user: string }
  | { $route: string }
  | { $screen: string }
  | { $record: string };

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
  filter?: DenimApplicationContextVariable | DenimQueryConditionOrGroup;
  defaultSort?: DenimSortExpression;
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
    relativeWidth?: number;
    component: DenimRouterComponentSchema;
  }[];
}

export interface DenimFormProviderComponentSchema
  extends DenimComponentSchema<'form-provider'> {
  table: string;
  record: DenimApplicationContextVariable;
  component: DenimRouterComponentSchema;
  prefill?: {
    [key: string]: DenimApplicationContextVariable;
  };
  saveRedirect?: {
    screen: string;
    params?: {
      [param: string]: DenimApplicationContextVariable;
    };
  };
}

export interface DenimFieldComponentSchema
  extends DenimComponentSchema<'field'> {
  field: DenimFormControlSchema;
  value?: DenimApplicationContextVariable;
  onChange?: any;
}

export type DenimViewActionSchema =
  | DenimViewRecordScreenActionSchema
  | DenimViewRecordPathActionSchema
  | DenimViewActionSchemaType<'delete'>;

export interface DenimViewActionSchemaType<T extends string> {
  title?: string;
  icon?: DenimIconType;
  type: T;
  roles?: string[];
}

export interface DenimViewRecordScreenActionSchema
  extends DenimViewActionSchemaType<'view'> {
  screen: string;
  params?: { [param: string]: DenimApplicationContextVariable };
}

export interface DenimViewRecordPathActionSchema
  extends DenimViewActionSchemaType<'view'> {
  path: string;
}

export interface DenimContentComponentSchema
  extends DenimComponentSchema<'content'> {
  content: any;
}
