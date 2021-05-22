import { DenimFormControlType } from 'denim';
import DenimButton from '../controls/DenimButton';
import DenimCheckBox from '../controls/DenimCheckBox';
import DenimControlContainer from '../controls/DenimControlContainer';
import DenimDatePicker from '../controls/DenimDatePicker';
import DenimDropDown from '../controls/DenimDropDown';
import DenimIcon from '../controls/DenimIcon';
import DenimLookup, { DenimMultiLookup } from '../controls/DenimLookup';
import DenimMultiDropDown from '../controls/DenimMultiDropDown';
import DenimReadOnly from '../controls/DenimReadOnly';
import DenimTabControl from '../controls/DenimTabControl';
import DenimTextInput, {
  DenimMultilineTextInput,
} from '../controls/DenimTextInput';
import DenimFormControl from '../DenimFormControl';
import DenimFormRow from '../DenimFormRow';
import DenimFormSection from '../DenimFormSection';
import {
  DenimViewCell,
  DenimViewHeaderCell,
  DenimViewHeaderRow,
  DenimViewRow,
  DenimViewTableContainer,
} from '../DenimView';

export const DefaultDenimFormContext = {
  controlRegistry: {
    [DenimFormControlType.TextInput]: DenimTextInput,
    [DenimFormControlType.MultilineTextInput]: DenimMultilineTextInput,
    [DenimFormControlType.DropDown]: DenimDropDown,
    [DenimFormControlType.MultiDropDown]: DenimMultiDropDown,
    [DenimFormControlType.ReadOnly]: DenimReadOnly,
    [DenimFormControlType.CheckBox]: DenimCheckBox,
    [DenimFormControlType.Lookup]: DenimLookup,
    [DenimFormControlType.MultiLookup]: DenimMultiLookup,
    [DenimFormControlType.DatePicker]: DenimDatePicker,
  },
  componentRegistry: {
    section: DenimFormSection,
    row: DenimFormRow,
    control: DenimFormControl,
    controlContainer: DenimControlContainer,
    button: DenimButton,
    viewTable: DenimViewTableContainer,
    viewHeaderRow: DenimViewHeaderRow,
    viewHeaderCell: DenimViewHeaderCell,
    viewRow: DenimViewRow,
    viewCell: DenimViewCell,
    tabControl: DenimTabControl,
    icon: DenimIcon,
  },
  setValue: () => () => {},
  getValue: () => null,
  getErrorsFor: () => [],
};
