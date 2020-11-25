import React, { FunctionComponent } from 'react';
import { Platform, StyleSheet, Text, TextProps } from 'react-native';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';

const DenimReadOnly: FunctionComponent<DenimControlProps & TextProps> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  numberOfLines,
  ...props
}) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  return (
    <ControlContainer
      error={errors.length > 0}
      helpText={helpText}
    >
      <Text style={[styles.text, Platform.OS === 'web' ? { height: 24 } : { }]} {...props}>
        {value}
      </Text>
    </ControlContainer>
  );
};

export default DenimReadOnly;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
        }
      : {}),
  },
});
