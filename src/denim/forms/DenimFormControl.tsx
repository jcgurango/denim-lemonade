import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from './providers/TranslationProvider';
import { DenimFormControlSchema, DenimFormSchema } from '../core';
import { useDenimForm } from './providers/DenimFormProvider';

export interface DenimFormControlProps {
  schema: DenimFormControlSchema;
  form?: DenimFormSchema;
  value?: any;
  onChange?: (value: any) => void;
}

const Empty = Symbol('Empty');

const DenimFormControl: FunctionComponent<DenimFormControlProps> = ({
  schema,
  form,
  value = Empty,
  onChange = Empty,
}) => {
  const translation = useTranslation();
  const denimForm = useDenimForm();
  const Control = schema.type ? denimForm.controlRegistry[schema.type] : null;
  const controlErrors = denimForm.getErrorsFor(schema.id);

  return (
    <>
      {!schema.hideLabel ? (
        <Text
          style={[
            styles.formLabel,
            denimForm.styleOverrides?.formControl?.formLabel,
          ]}
        >
          {schema.label ||
            translation.translate(
              `Forms.${form?.id || 'generic'}.Fields.${schema.id}`,
            )}
        </Text>
      ) : null}
      {Control ? (
        <View>
          <Control
            value={value === Empty ? denimForm.getValue(schema.id) : value}
            onChange={onChange === Empty ? denimForm.setValue(schema.id) : onChange}
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
