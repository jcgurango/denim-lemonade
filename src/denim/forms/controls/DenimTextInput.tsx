import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
const sf = require('sf');

export interface DenimTextInputProps {
  format?: string;
  numerical?: boolean;
}

const DenimTextInput: FunctionComponent<DenimControlProps & DenimTextInputProps & TextInputProps> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  numberOfLines,
  format,
  numerical,
  ...props
}) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  const formatValue = (value: any, format?: string) => {
    if (format && value) {
      return sf(format, (numerical && typeof(value) === 'string') ? Number(value.replace(/\,/g, '')) : value);
    }

    return value;
  };
  const [displayedText, setDisplayedText] = useState(() => formatValue(value, format));
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
    } else {
      setDisplayedText(value);
    }
  }, [value]);

  return (
    <ControlContainer
      error={(errors?.length || 0) > 0}
      helpText={helpText}
    >
      <TextInput
        style={[styles.textInput, (Platform.OS === 'web' && (numberOfLines || 0) <= 1) ? { height: 24 } : null]}
        onChangeText={(text) => onChange(text || null)}
        value={displayedText || ''}
        numberOfLines={numberOfLines}
        onBlur={() => {
          setDisplayedText(formatValue(value, format));
        }}
        {...props}
      />
    </ControlContainer>
  );
};

export const DenimMultilineTextInput: FunctionComponent<
  DenimControlProps & TextInputProps
> = (props) => {
  return (
    <DenimTextInput
      {...props}
      multiline
      numberOfLines={Platform.OS === 'web' ? 4 : 2}
    />
  );
};

export default DenimTextInput;

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
        }
      : {}),
  },
});
