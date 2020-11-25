export interface DenimFormSchema {
  id: string;
  sections: DenimFormSectionSchema[];
}

export interface DenimFormSectionSchema {
  id: string;
  label?: string;
  rows: DenimFormRowSchema[];
  showLabel?: Boolean;
  collapsible?: Boolean;
  defaultOpen?: Boolean;
}

export interface DenimFormRowSchema {
  id: string;
  controls: DenimFormControlSchema[];
}

export interface DenimFormControlSchema {
  id: string;
  relativeWidth: number;
  label?: String;
  type?: DenimFormControlType;
  controlProps?: any;
}

export enum DenimFormControlType {
  TextInput = 'text-input',
  MultilineTextInput = 'multiline-text-input',
  DropDown = 'dropdown',
  MultiDropDown = 'multi-dropdown',
  CheckBox = 'checkbox',
  ReadOnly = 'readonly',
  Lookup = 'lookup',
  MultiLookup = 'multi-lookup',
}
