import React, { FunctionComponent } from 'react';
import { useTranslation } from './providers/TranslationProvider';
import { DenimFormControlSchema, DenimFormSchema } from 'denim';

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
  const denimForm = require('./providers/DenimFormProvider').useDenimForm();
  const Control = schema.type ? denimForm.controlRegistry[schema.type] : null;
  const controlErrors = denimForm.getErrorsFor(schema.id);

  return (
    <>
      {!schema.hideLabel ? (
        <div
          style={{
            fontSize: 16,
            ...(denimForm.styleOverrides?.formControl?.formLabel || {}),
          }}
        >
          {schema.label ||
            translation.translate(
              `Forms.${form?.id || 'generic'}.Fields.${schema.id}`
            )}
        </div>
      ) : null}
      {Control ? (
        <div style={{ display: 'flex', flex: 1 }}>
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
        </div>
      ) : null}
    </>
  );
};

export default DenimFormControl;
