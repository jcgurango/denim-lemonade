import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DenimFormControlProps } from '../DenimFormControl';

export interface DenimControlContainerProps {
  error?: boolean;
  helpText?: String;
}

const DenimControlContainer: FunctionComponent<DenimControlContainerProps> = ({
  children,
  error,
  helpText,
}) => {
  return (
    <>
      <View style={[styles.container, error ? styles.errorContainer : null]}>{children}</View>
      {helpText ? (
        <View>
          <Text style={[styles.helpText, error ? styles.errorHelpText : null]}>{helpText}</Text>
        </View>
      ) : null}
    </>
  );
};

export default DenimControlContainer;

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#DEDEDE',
  },
  errorContainer: {
    borderBottomColor: 'red',
  },
  helpText: {
    marginTop: 16,
    fontSize: 12,
  },
  errorHelpText: {
    color: 'red',
  },
});
