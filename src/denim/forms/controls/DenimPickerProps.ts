import { DenimSelectOption } from '../../core';

export default interface DenimPickerProps {
  onChange: (newValue: any) => void;
  value?: any;
  options?: DenimSelectOption[];
  placeholder?: string;
};
