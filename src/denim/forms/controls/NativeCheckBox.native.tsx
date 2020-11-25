import React, { FunctionComponent } from 'react';
import CheckBox from '@react-native-community/checkbox';

interface NativeCheckBoxProps {
  onChange: (value: boolean) => void;
  value?: boolean;
}

const NativeCheckBox: FunctionComponent<NativeCheckBoxProps> = ({
  onChange,
  value,
}) => {
  return (
    <CheckBox
      value={value || false}
      onValueChange={onChange}
    />
  );
};

export default NativeCheckBox;
