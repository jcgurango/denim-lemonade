import { DenimApplicationLayout } from 'denim-forms';
import React, { FunctionComponent } from 'react';
import {
  ComponentPropertiesProps,
  ComponentRendererProps,
  PropertiesPanel,
} from '../../screens/Screens';
import DynamicValue, {
  renderDynamicValue,
  useDynamicValues,
} from '../DynamicValue';

export interface FormFieldAttributes {
  field: string;
}

export const FormFieldProperties: FunctionComponent<
  ComponentPropertiesProps<FormFieldAttributes>
> = ({ schema, onSchemaChange }) => {
  return (
    <DenimApplicationLayout
      content={[
        <DynamicValue
          label="Field"
          propKey="schema"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['field-schema']}
        />,
        <DynamicValue
          label="Readonly"
          propKey="readonly"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['boolean']}
        />,
      ]}
    />
  );
};

const FormField: FunctionComponent<
  ComponentRendererProps<FormFieldAttributes>
> = ({ id, schema, onSchemaChange, selected, select }) => {
  const { dynamicValues } = useDynamicValues();

  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          select();
        }}
      >
        {renderDynamicValue(schema, 'schema', dynamicValues, 'Form Field')}
      </div>
      {selected ? (
        <PropertiesPanel title="Form Field">
          <FormFieldProperties
            schema={schema}
            onSchemaChange={onSchemaChange}
          />
        </PropertiesPanel>
      ) : null}
    </>
  );
};

export default FormField;
