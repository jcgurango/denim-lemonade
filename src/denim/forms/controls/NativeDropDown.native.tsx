import React, { FunctionComponent } from 'react';
import DenimPickerProps from './DenimPickerProps';
import { Picker } from '@react-native-picker/picker';
import { PickerProps } from '@react-native-picker/picker/typings/Picker';

const NativeDropDown: FunctionComponent<DenimPickerProps & PickerProps> = ({
  onChange,
  value,
  options,
  ...props
}) => {
  return (
    <Picker
      {...props}
      onValueChange={(value) => onChange(value || null)}
      selectedValue={value}
    >
      <Picker.Item
        key={value}
        value=""
        label="Select an item..."
        color="grey"
      />
      {options?.map(({ label, value }) => (
        <Picker.Item key={value} value={value} label={label} />
      ))}
    </Picker>
  );
};

export default NativeDropDown;
