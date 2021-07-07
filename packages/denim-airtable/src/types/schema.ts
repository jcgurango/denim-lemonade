export interface AirTable {
  id: string;
  name: string;
  columns: AirTableColumn[];
}

export type AirTableColumnType =
  | 'text'
  | 'multilineText'
  | 'phone'
  | 'select'
  | 'multiSelect'
  | 'checkbox'
  | 'date'
  | 'number'
  | 'rating'
  | 'formula'
  | 'foreignKey'
  | 'lookup';

export type AirTableColumn =
  | AirTableColumnDefinition<'text', AirTableTextTypeOptions>
  | AirTableColumnDefinition<'multilineText', AirTableTextTypeOptions>
  | AirTableColumnDefinition<'phone', null>
  | AirTableColumnDefinition<'select', AirTableSelectTypeOptions>
  | AirTableColumnDefinition<'multiSelect', AirTableSelectTypeOptions>
  | AirTableColumnDefinition<'checkbox', AirTableCheckBoxTypeOptions>
  | AirTableColumnDefinition<'date', AirTableDateTypeOptions>
  | AirTableColumnDefinition<'number', AirTableNumberTypeOptions>
  | AirTableColumnDefinition<'rating', AirTableRatingTypeOptions>
  | AirTableColumnDefinition<'formula', AirTableFormulaTypeOptions>
  | AirTableColumnDefinition<'rollup', AirTableFormulaTypeOptions>
  | AirTableColumnDefinition<'foreignKey', AirTableForeignKeyTypeOptions>
  | AirTableColumnDefinition<'lookup', AirTableLookupTypeOptions>;

  export type AirTableFormulaTypeOptions =
  | (ForeignTypeOptionsDefinition<'text'> & AirTableTextTypeOptions)
  | (ForeignTypeOptionsDefinition<'multilineText'> & AirTableTextTypeOptions)
  | (ForeignTypeOptionsDefinition<'phone'>)
  | (ForeignTypeOptionsDefinition<'select'> & AirTableSelectTypeOptions)
  | (ForeignTypeOptionsDefinition<'multiSelect'> & AirTableSelectTypeOptions)
  | (ForeignTypeOptionsDefinition<'checkbox'> & AirTableCheckBoxTypeOptions)
  | (ForeignTypeOptionsDefinition<'date'> & AirTableDateTypeOptions)
  | (ForeignTypeOptionsDefinition<'number'> & AirTableNumberTypeOptions)
  | (ForeignTypeOptionsDefinition<'rating'> & AirTableRatingTypeOptions)
  | (ForeignTypeOptionsDefinition<'foreignKey'> & AirTableForeignKeyTypeOptions)
  | (ForeignTypeOptionsDefinition<'lookup'> & AirTableLookupTypeOptions);

export interface AirTableColumnDefinition<T, TO> {
  id: string;
  name: string;
  type: T;
  typeOptions?: TO;
}

export type ForeignTypeOptionsDefinition<T extends string> = {
  resultType: T;
  formulaTextParsed: string;
  dependencies?: {
    referencedColumnIdsForValue?: string[];
  };
};

export interface AirTableSelectTypeOptions {
  choices: {
    [x: string]: {
      id: string;
      name: string;
      color: string;
    };
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
  negative?: boolean;
  validatorName?: 'positive';
  durationFormat?: string;
  symbol?: string;
  precision?: number;
}

export interface AirTableRatingTypeOptions {
  color: string;
  icon: string;
  max: number;
}

export interface AirTableForeignKeyTypeOptions {
  foreignTableId: string;
  relationship: 'many' | 'one';
  unreversed: boolean;
  symmetricColumnId: string;
}

export interface AirTableLookupTypeOptions {
  relationColumnId: string;
  foreignTableRollupColumnId: string;
  dependencies: {
    referencedColumnIdsForValue?: string[];
  };
  resultType: AirTableColumnType;
}
