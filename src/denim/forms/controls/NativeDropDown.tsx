import React, { FunctionComponent } from 'react';
import DenimPickerProps from './DenimPickerProps';

const NativeDropDown: FunctionComponent<
  DenimPickerProps &
    React.DetailedHTMLProps<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >
> = ({ onChange, value, options, ...props }) => {
  return (
    <select
      value={value}
      onChange={(e) => {
        var target: any = e.target;
        onChange(target.value);
      }}
      style={{ fontSize: 16, height: 24, border: 0 }}
      {...props}
    >
      <option value="">Select an item...</option>
      {options?.map((option) => (
        <option key={option.value} label={option.label} value={option.value} />
      )) || null}
    </select>
  );
};

export default NativeDropDown;
