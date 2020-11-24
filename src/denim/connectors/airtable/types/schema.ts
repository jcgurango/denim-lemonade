export interface AirTable {
  id: string;
  name: string;
  columns: AirTableColumn[];
}

export type AirTableColumn = AirTableColumnDefinition<'text', AirTableTextTypeOptions>
  | AirTableColumnDefinition<'multilineText', AirTableTextTypeOptions>
  | AirTableColumnDefinition<'phone', null>
  | AirTableColumnDefinition<'select', AirTableSelectTypeOptions>
  | AirTableColumnDefinition<'multiSelect', AirTableSelectTypeOptions>
  | AirTableColumnDefinition<'checkbox', AirTableCheckBoxTypeOptions>
  | AirTableColumnDefinition<'date', AirTableDateTypeOptions>
  | AirTableColumnDefinition<'number', AirTableNumberTypeOptions>
  | AirTableColumnDefinition<'rating', AirTableRatingTypeOptions>
  | AirTableColumnDefinition<'formula', AirTableFormulaTypeOptions>
  | AirTableColumnDefinition<'foreignKey', AirTableForeignKeyTypeOptions>;

export interface AirTableColumnDefinition<T, TO> {
  id: string;
  name: string;
  type: T;
  typeOptions?: TO;
}

export interface AirTableSelectTypeOptions {
  choices: {
    [x: string]: {
      id: string;
      name: string;
      color: string;
    }
  };
  choiceOrder: string[];
}

export interface AirTableCheckBoxTypeOptions {
  color: string;
  icon: string;
}

export interface AirTableDateTypeOptions {
  isDateTime: boolean;
  dateFormat: 'Local' | 'Friendly' | 'US' | 'European' | 'ISO';
  timeFormat?: '12hour' | '24hour';
  timeZone?: 'client' | 'UTC';
}

export interface AirTableTextTypeOptions {
  validatorName: 'email' | 'url';
}

export interface AirTableNumberTypeOptions {
  format: 'decimal' | 'currency' | 'percentV2' | 'duration';
  negative: boolean;
  validatorName?: 'positive';
  durationFormat?: string;
  symbol?: string;
}

export interface AirTableRatingTypeOptions {
  color: string;
  icon: string;
  max: number;
}

export interface AirTableFormulaTypeOptions {
  formulaTextParsed: string;
  resultType: 'number' | 'text';
  dependencies?: {
    referencedColumnIdsForValue?: string[]
  };
}

export interface AirTableForeignKeyTypeOptions {
  foreignTableId: string;
  relationship: 'many' | 'one';
  unreversed: boolean;
  symmetricColumnId: string;
}
