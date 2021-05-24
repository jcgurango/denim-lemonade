import React, { FunctionComponent } from 'react';
import CheckBox from '@react-native-community/checkbox';

interface NativeCheckBoxProps {
  onChange: (value: boolean) => void;
  value?: boolean;
  disabled?: boolean;
}

const NativeCheckBox: FunctionComponent<NativeCheckBoxProps> = ({
  onChange,
  value,
  disabled,
}) => {
  return (
    <CheckBox
      value={value || false}
      onValueChange={onChange}
      disabled={disabled}
    />
  );
};

export default NativeCheckBox;
