import React, { FunctionComponent } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DenimFormControlProps } from '../denim/forms/DenimFormControl';
import { useDenimForm } from '../denim/forms/providers/DenimFormProvider';
import { useTranslation } from '../denim/forms/providers/TranslationProvider';

const Empty = Symbol('Empty');

const LemonadeFormControl: FunctionComponent<DenimFormControlProps> = ({
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
      {Control ? (
        <View>
          <Control
            value={value === Empty ? denimForm.getValue(schema.id) : value}
            onChange={
              onChange === Empty ? denimForm.setValue(schema.id) : onChange
            }
            schema={schema}
            form={form}
            errors={controlErrors}
            {...schema.controlProps}
          />
        </View>
      ) : null}
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
    </>
  );
};

export default LemonadeFormControl;

const styles = StyleSheet.create({
  formLabel: {
    fontSize: 12.5,
    fontFamily: 'Open Sans',
    color: '#555555',
    marginTop: 8,
  },
});
