import React, { FunctionComponent } from 'react';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import DenimPickerProps from './DenimPickerProps';
import NativeDropDown from './NativeDropDown';

const DenimDropDown: FunctionComponent<
  DenimControlProps &
    DenimPickerProps
> = ({ onChange, value, schema, form, errors, options, ...props }) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  return (
    <ControlContainer
      error={errors.length > 0}
      helpText={helpText}
    >
      <NativeDropDown
        onChange={onChange}
        value={value}
        options={options}
        {...props}
      />
    </ControlContainer>
  );
};

export default DenimDropDown;
