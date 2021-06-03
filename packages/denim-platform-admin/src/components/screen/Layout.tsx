import { DenimApplicationField, DenimApplicationLayout } from 'denim-forms';
import { DenimFormControlType } from 'denim';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import {
  Canvas,
  ComponentPropertiesProps,
  ComponentRendererProps,
  PropertiesPanel,
} from '../../screens/Screens';

export interface LayoutAttributes {
  flowDirection: 'column' | 'row';
  children: any[];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;

  > * {
    flex: 1;
  }

  &:empty:before {
    display: block;
    content: 'Drag a component here to begin...';
    text-align: center;
    margin-top: 100px;
    color: rgba(0, 0, 0, 0.6);
  }

  &.horizontal {
    > * {
      margin-bottom: 0px !important;
      
      &:not(:last-child) {
        margin-right: 0.5em;
      }
    }

    align-items: flex-start;
  }
`;

export const LayoutProperties: FunctionComponent<
  ComponentPropertiesProps<LayoutAttributes>
> = ({ schema, onSchemaChange }) => {
  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationField
          schema={{
            id: 'flow-direction',
            label: 'Direction',
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: [
                {
                  label: 'Vertical',
                  value: 'column',
                },
                {
                  label: 'Horizontal',
                  value: 'row',
                },
              ],
            },
          }}
          onChange={(flowDirection) => {
            onSchemaChange((schema) => ({
              ...schema,
              flowDirection,
            }));
          }}
          value={schema.flowDirection}
        />
      ]}
    />
  );
};

const Layout: FunctionComponent<
  ComponentRendererProps<LayoutAttributes>
> = ({ id, schema, onSchemaChange, selected, select }) => {
  return (
    <>
      <Container
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          select();
        }}
        style={{
          flexDirection: schema.flowDirection,
        }}
        className={schema.flowDirection === 'row' ? 'horizontal' : 'vertical'}
      >
        <Canvas
          id={id + '-children'}
          components={schema.children || []}
          onChange={(callback) =>
            onSchemaChange((oldSchema) => ({
              ...oldSchema,
              children: callback(schema.children || []),
            }))
          }
          bare
        />
      </Container>
      {selected ? (
        <PropertiesPanel title="Layout">
          <LayoutProperties
            schema={schema}
            onSchemaChange={onSchemaChange}
          />
        </PropertiesPanel>
      ) : null}
    </>
  );
};

export default Layout;
