import React, { FunctionComponent } from 'react';
import { Platform, StyleSheet, TextProps, View } from 'react-native';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import NativeCheckBox from './NativeCheckBox';

const DenimCheckBox: FunctionComponent<DenimControlProps & TextProps> = ({
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
  const helpText = errors?.map(({ message }) => message).join('\n') || '';

  return (
    <ControlContainer
      error={(errors?.length || 0) > 0}
      helpText={helpText}
    >
      <View style={[styles.container, Platform.OS === 'web' ? { height: 24 } : { }]} {...props}>
        <NativeCheckBox
          onChange={onChange}
          value={value}
        />
      </View>
    </ControlContainer>
  );
};

export default DenimCheckBox;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
});
