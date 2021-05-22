import { DenimSelectOption } from 'denim';

export default interface DenimPickerProps {
  onChange: (newValue: any) => void;
  relationship?: string;
  value?: any;
  options?: DenimSelectOption[];
  placeholder?: string;
};
