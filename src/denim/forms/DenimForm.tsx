import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DenimFormSchema } from '../core';
import DenimFormSection from './DenimFormSection';

export interface DenimFormProps {
  schema: DenimFormSchema;
  error?: string;
}

const DenimForm: FunctionComponent<DenimFormProps> = ({ schema, error }) => {
  return (
    <View>
      {schema.sections.map((section) => (
        <DenimFormSection key={section.id} form={schema} schema={section} />
      ))}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
};

export default DenimForm;

const styles = StyleSheet.create({
  errorText: {
    marginTop: 12,
    color: 'red',
  },
});
