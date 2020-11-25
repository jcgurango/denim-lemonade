import React, { FunctionComponent } from 'react';

interface NativeCheckBoxProps {
  onChange: (value: boolean) => void;
  value?: boolean;
}

const NativeCheckBox: FunctionComponent<NativeCheckBoxProps> = ({
  onChange,
  value,
}) => {
  return (
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e: any) => {
        onChange(e.target.checked);
      }}
    />
  );
};

export default NativeCheckBox;
