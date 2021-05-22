import React, { FunctionComponent } from 'react';

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
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e: any) => {
        onChange(e.target.checked);
      }}
      disabled={disabled}
    />
  );
};

export default NativeCheckBox;
