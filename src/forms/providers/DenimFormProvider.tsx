import React, { ComponentType, createContext, useContext } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { DenimFormControlSchema, DenimFormControlType, DenimFormSchema } from '../../core';
import DenimFormSection, { DenimFormSectionProps } from '../DenimFormSection';
import DenimFormRow, { DenimFormRowProps } from '../DenimFormRow';
import DenimFormControl, { DenimFormControlProps } from '../DenimFormControl';
import DenimTextInput, { DenimMultilineTextInput } from '../controls/DenimTextInput';
import DenimControlContainer, { DenimControlContainerProps } from '../controls/DenimControlContainer';
import { ValidationError } from 'yup';

export interface DenimControlProps {
  value: any;
  onChange: (newValue: any) => void;
  schema: DenimFormControlSchema;
  form: DenimFormSchema;
  errors: ValidationError[];
}

interface DenimFormContextProps {
  controlRegistry: DenimControlRegistry;
  componentRegistry: DenimComponentRegistry;
  styleOverrides?: DenimStyleOverrides;
  setValue: (field: string) => (newValue: any) => void;
  getValue: (field: string) => any;
  getErrorsFor: (field: string) => ValidationError[];
}

export const DefaultDenimFormContext = {
  controlRegistry: {
    [DenimFormControlType.TextInput]: DenimTextInput,
    [DenimFormControlType.MultilineTextInput]: DenimMultilineTextInput,
  },
  componentRegistry: {
    section: DenimFormSection,
    row: DenimFormRow,
    control: DenimFormControl,
    controlContainer: DenimControlContainer,
  },
  setValue: () => () => { },
  getValue: () => null,
  getErrorsFor: () => [],
};

const DenimFormContext = createContext<DenimFormContextProps>(DefaultDenimFormContext);

export const useDenimForm = () => useContext(DenimFormContext);

type DenimControlRegistry = {
  [key: string]: ComponentType<DenimControlProps>;
}

type DenimComponentRegistry = {
  section: ComponentType<DenimFormSectionProps>;
  row: ComponentType<DenimFormRowProps>;
  control: ComponentType<DenimFormControlProps>;
  controlContainer: ComponentType<DenimControlContainerProps>;
}

type DenimStyleOverrides = {
  formControl?: {
    formLabel: StyleProp<TextStyle>;
  }
};

interface DenimFormProviderProps extends Partial<DenimFormContextProps> {
}

const DenimFormProvider: ComponentType<DenimFormProviderProps> = ({
  children,
  ...props
}) => {
  return (
    <DenimFormContext.Provider value={{ ...DefaultDenimFormContext, ...props }}>
      {children}
    </DenimFormContext.Provider>
  );
};

export default DenimFormProvider;
