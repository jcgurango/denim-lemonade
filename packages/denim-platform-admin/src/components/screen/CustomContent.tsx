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

export interface CustomContentAttributes {
  html: string;
}

export const CustomContentProperties: FunctionComponent<
  ComponentPropertiesProps<CustomContentAttributes>
> = ({ schema, onSchemaChange }) => {
  return (
    <DenimApplicationLayout
      content={[
        <DynamicValue
          label="HTML Content"
          propKey="html"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['string']}
        />,
      ]}
    />
  );
};

const CustomContent: FunctionComponent<
  ComponentRendererProps<CustomContentAttributes>
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
        <div
          dangerouslySetInnerHTML={{
            __html: renderDynamicValue(schema, 'html', dynamicValues),
          }}
        />
      </div>
      {selected ? (
        <PropertiesPanel title="Custom Content">
          <CustomContentProperties
            schema={schema}
            onSchemaChange={onSchemaChange}
          />
        </PropertiesPanel>
      ) : null}
    </>
  );
};

export default CustomContent;
