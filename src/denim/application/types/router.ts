import { DenimFormSchema, DenimViewSchema } from '../../core';

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

export type DenimRouterScreenSchema = DenimFormScreenSchema | DenimViewScreenSchema;

interface DenimScreenSchema<T extends string> {
  id: string;
  slug?: string;
  type: T;
  roles?: string[];
  preContent?: any;
  postContent?: any;
}

export interface DenimFormScreenSchema extends DenimScreenSchema<'form'> {
  table?: string;
  record?: string | { $user: string };
  form: DenimFormSchema;
}

export interface DenimViewScreenSchema extends DenimScreenSchema<'view'> {
  form?: string;
  table: string;
  view: DenimViewSchema;
}
