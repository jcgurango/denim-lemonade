import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
const sf = require('sf');

export interface DenimTextInputProps {
  format?: string;
  numerical?: boolean;
}

const DenimTextInput: FunctionComponent<
  DenimControlProps &
    DenimTextInputProps & {
      multiline?: boolean;
      onBlur?: () => void;
      placeholder?: string;
    }
> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  multiline,
  format,
  numerical,
  ...props
}) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  const formatValue = (value: any, format?: string) => {
    if (format && value) {
      return sf(
        format,
        numerical && typeof value === 'string'
          ? Number(value.replace(/,/g, ''))
          : value
      );
    }

    return value;
  };
  const [displayedText, setDisplayedText] = useState(() =>
    formatValue(value, format)
  );
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
    } else {
      setDisplayedText(value);
    }
  }, [value]);

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      {multiline ? (
        <textarea
          style={{
            border: 0,
            padding: '0.25em',
            fontFamily: 'inherit',
          }}
          onChange={(e) => onChange(e.target.value || null)}
          value={displayedText || ''}
          {...props}
        />
      ) : (
        <input
          type="text"
          style={{
            border: 0,
            padding: '0.25em',
          }}
          onChange={(e) => onChange(e.target.value || null)}
          value={displayedText || ''}
          {...props}
        />
      )}
    </ControlContainer>
  );
};

export const DenimMultilineTextInput: FunctionComponent<DenimControlProps> = (
  props
) => {
  return <DenimTextInput {...props} multiline />;
};

export default DenimTextInput;
