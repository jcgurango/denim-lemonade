import React, { FunctionComponent } from 'react';
import DenimPickerProps from './DenimPickerProps';

const NativeDropDown: FunctionComponent<
  React.DetailedHTMLProps<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
  > &
    DenimPickerProps
> = ({
  onChange,
  value,
  options,
  placeholder = 'Select an item...',
  ...props
}) => {
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
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options?.map((option) => (
        <option key={option.value} label={option.label} value={option.value} />
      )) || null}
    </select>
  );
};

export default NativeDropDown;
