import React, { ComponentType, createContext, useContext } from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { DenimFormControlSchema, DenimFormSchema } from '../../core';
import { DenimFormSectionProps } from '../DenimFormSection';
import { DenimFormRowProps } from '../DenimFormRow';
import { DenimFormControlProps } from '../DenimFormControl';
import { DenimControlContainerProps } from '../controls/DenimControlContainer';
import { ValidationError } from 'yup';
import { DefaultDenimFormContext } from './DefaultDenimFormContext';
import { DenimButtonProps } from '../controls/DenimButton';

export interface DenimControlProps {
  value: any;
  onChange: (newValue: any) => void;
  schema?: DenimFormControlSchema;
  form?: DenimFormSchema;
  errors?: ValidationError[];
}

export interface DenimFormContextProps {
  controlRegistry: DenimControlRegistry;
  componentRegistry: DenimComponentRegistry;
  styleOverrides?: DenimStyleOverrides;
  setValue: (field: string) => (newValue: any) => void;
  getValue: (field: string) => any;
  getErrorsFor: (field: string) => ValidationError[];
}

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
  button: ComponentType<DenimButtonProps>;
  viewTable: ComponentType;
  viewHeaderRow: ComponentType;
  viewHeaderCell: ComponentType;
  viewRow: ComponentType;
  viewCell: ComponentType;
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
  const parentContext = useDenimForm();

  return (
    <DenimFormContext.Provider
    value={{
      ...DefaultDenimFormContext,
      ...parentContext,
      ...props,
      controlRegistry: {
        ...DefaultDenimFormContext.controlRegistry,
        ...parentContext.controlRegistry,
        ...props.controlRegistry,
      },
      componentRegistry: {
        ...DefaultDenimFormContext.componentRegistry,
        ...parentContext.componentRegistry,
        ...props.componentRegistry,
      },
    }}
    >
      {children}
    </DenimFormContext.Provider>
  );
};

export default DenimFormProvider;
