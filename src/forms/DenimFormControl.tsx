import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from './providers/TranslationProvider';
import { DenimFormControlSchema, DenimFormSchema } from '../core';
import { useDenimForm } from './providers/DenimFormProvider';

export interface DenimFormControlProps {
  schema: DenimFormControlSchema;
  form: DenimFormSchema;
}

const DenimFormControl: FunctionComponent<DenimFormControlProps> = ({
  schema,
  form,
}) => {
  const translation = useTranslation();
  const denimForm = useDenimForm();
  const Control = denimForm.controlRegistry[schema.type];
  const controlErrors = denimForm.getErrorsFor(schema.id);

  return (
    <>
      <Text style={[styles.formLabel, denimForm.styleOverrides?.formControl?.formLabel]}>{schema.label || translation.translate(`Forms.${form.id}.Fields.${schema.id}`)}</Text>
      {Control ? (
        <View>
          <Control
            value={denimForm.getValue(schema.id)}
            onChange={denimForm.setValue(schema.id)}
            schema={schema}
            form={form}
            errors={controlErrors}
            {...schema.controlProps}
          />
        </View>
      ) : null}
    </>
  );
};

export default DenimFormControl;

const styles = StyleSheet.create({
  formLabel: {
    fontSize: 16,
  },
});
