import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DenimFormSchema } from 'denim';
import DenimFormSection from './DenimFormSection';

export interface DenimFormProps {
  schema: DenimFormSchema;
  error?: string;
}

const DenimForm: FunctionComponent<DenimFormProps> = ({ schema, error }) => {
  return (
    <div>
      {schema.sections.map((section) => (
        <DenimFormSection key={section.id} form={schema} schema={section} />
      ))}
      {error ? (
        <div style={{ marginTop: '1em', color: 'red' }}>{error}</div>
      ) : null}
    </div>
  );
};

export default DenimForm;
