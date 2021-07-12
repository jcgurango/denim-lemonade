import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import numeral from 'numeral';

export interface DenimTextInputProps {
  format?: string;
}

const DenimTextInput: FunctionComponent<
  DenimControlProps & DenimTextInputProps & TextInputProps
> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  numberOfLines,
  format,
  ...props
}) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  const [enteredText, setEnteredText] = useState(
    () => (format ? numeral(value).format(format) : value) || ''
  );

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      <TextInput
        style={[
          styles.textInput,
          Platform.OS === 'web' && (numberOfLines || 0) <= 1
            ? { height: 24 }
            : null,
        ]}
        onChangeText={(text) => {
          const parsed = numeral(text);
          const parsedValue = parsed.value();
          setEnteredText(text);

          if (format && parsedValue !== null && !isNaN(parsedValue)) {
            onChange(parsedValue);
          } else {
            onChange(text);
          }
        }}
        value={(format ? enteredText : value) || ''}
        numberOfLines={numberOfLines}
        onBlur={() => {
          if (format) {
            // First attempt to parse the value.
            const parsed = numeral(enteredText);
            const parsedValue = parsed.value();

            if (parsedValue !== null && !isNaN(parsedValue)) {
              setEnteredText(parsed.format(format));
            }
          }
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
