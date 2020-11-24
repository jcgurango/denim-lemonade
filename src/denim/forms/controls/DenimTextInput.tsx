import React, { FunctionComponent } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps } from 'react-native';
import { DenimControlProps, useDenimForm } from '../providers/DenimFormProvider';

const DenimTextInput: FunctionComponent<DenimControlProps & TextInputProps> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  ...props
}) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  return (
    <ControlContainer schema={schema} form={form} error={errors.length > 0} helpText={helpText}>
      <TextInput style={styles.textInput} onChangeText={onChange} value={value || ''} {...props} />
    </ControlContainer>
  );
};

export const DenimMultilineTextInput: FunctionComponent<DenimControlProps & TextInputProps> = (props) => {
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
    ...(Platform.OS === 'web' ? {
      outlineWidth: 0,
    } : { }),
  },
});
