import { DenimFormSchema } from '../../core';

export interface DenimApplicationSchema {
  screens: AppScreen[];
  navigation: DenimNavigationSchema;
}

export interface DenimNavigationSchema {
  indexScreen: string;
}

export type AppScreen = DenimFormScreenSchema;

interface DenimScreenSchema<T extends string> {
  id: string;
  type: T;
}

export interface DenimFormScreenSchema extends DenimScreenSchema<'form'> {
  table?: string;
  form: DenimFormSchema;
}
