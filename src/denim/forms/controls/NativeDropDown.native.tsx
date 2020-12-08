import React, { FunctionComponent } from 'react';
import DenimPickerProps from './DenimPickerProps';
import { Picker } from '@react-native-picker/picker';
import { PickerProps } from '@react-native-picker/picker/typings/Picker';

const NativeDropDown: FunctionComponent<PickerProps & DenimPickerProps> = ({
  onChange,
  value,
  options,
  placeholder = 'Select an item...',
  ...props
}) => {
  return (
    <Picker
      {...props}
      onValueChange={(value) => onChange(value || null)}
      selectedValue={value}
    >
      {placeholder ? (
        <Picker.Item key={value} value="" label={placeholder} color="grey" />
      ) : null}
      {options?.map(({ label, value }) => (
        <Picker.Item key={value} value={value} label={label} />
      ))}
    </Picker>
  );
};

export default NativeDropDown;
