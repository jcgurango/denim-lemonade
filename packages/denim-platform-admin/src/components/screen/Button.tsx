import React, { FunctionComponent } from 'react';
import { DenimApplicationField, DenimApplicationLayout } from 'denim-forms';
import {
  ComponentPropertiesProps,
  ComponentRendererProps,
  PropertiesPanel,
} from '../../screens/Screens';
import DynamicValue, { renderDynamicValue, useDynamicValues } from '../DynamicValue';
import { DenimFormControlType } from 'denim';

export interface LayoutAttributes {
  text: string;
  icon?: string;
  iconOnly?: boolean;
  action: any;
  type?: string;
  inline?: boolean;
  disabled?: boolean;
}

export const ButtonProperties: FunctionComponent<
  ComponentPropertiesProps<LayoutAttributes>
> = ({ schema, onSchemaChange }) => {
  return (
    <DenimApplicationLayout
      content={[
        <DynamicValue
          label="Text"
          propKey="text"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['string']}
        />,
        <DynamicValue
          label="Icon"
          propKey="icon"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['icon']}
        />,
        <DynamicValue
          label="Icon Only"
          propKey="iconOnly"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['boolean']}
        />,
        <DynamicValue
          label="Action"
          propKey="action"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['button-action']}
        />,
        <DynamicValue
          label="Inline"
          propKey="inline"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['boolean']}
        />,
        <DynamicValue
          label="Disabled"
          propKey="disabled"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['boolean']}
        />,
        <DenimApplicationField
          schema={{
            id: 'type',
            label: 'Type',
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: [
                {
                  label: 'Primary',
                  value: 'primary',
                },
                {
                  label: 'Secondary',
                  value: 'secondary',
                },
                {
                  label: 'Danger',
                  value: 'danger',
                },
              ],
            },
          }}
          value={schema.type}
          onChange={(type) =>
            onSchemaChange((schema) => ({
              ...schema,
              type,
            }))
          }
        />,
      ]}
    />
  );
};

const Button: FunctionComponent<
  ComponentRendererProps<LayoutAttributes>
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
        Button: {renderDynamicValue(schema, 'text', dynamicValues) || 'Button'}
      </div>
      {selected ? (
        <PropertiesPanel title="Layout">
          <ButtonProperties
            schema={schema}
            onSchemaChange={onSchemaChange}
          />
        </PropertiesPanel>
      ) : null}
    </>
  );
};

export default Button;
