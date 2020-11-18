import React, { FunctionComponent } from 'react';
import { View } from 'react-native';
import { DenimFormSchema } from '../core';
import DenimFormSection from './DenimFormSection';

interface DenimFormProps {
  schema: DenimFormSchema;
}

const DenimForm: FunctionComponent<DenimFormProps> = ({ schema }) => {
  return (
    <View>
      {schema.sections.map((section) => (
        <DenimFormSection key={section.id} form={schema} schema={section} />
      ))}
    </View>
  );
};

export default DenimForm;
