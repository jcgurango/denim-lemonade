import React, { FunctionComponent } from 'react';
import { DenimApplicationField, DenimApplicationLayout } from 'denim-forms';
import { DenimQueryConditionOrGroup, DenimFormControlType } from 'denim';
import {
  Canvas,
  ComponentPropertiesProps,
  ComponentRendererProps,
  PropertiesPanel,
} from '../../screens/Screens';
import DynamicValue, { DynamicValueProvider } from '../DynamicValue';
import { useConsumerSchema } from '../../providers/ConsumerSchemaProvider';
import { useMemoizedAdditionalFormFields } from './FormProvider';

export interface GridViewAttributes {
  table?: string;
  columns?: string[];
  query?: DenimQueryConditionOrGroup;
  actions: any[];
}

export const GridViewProperties: FunctionComponent<
  ComponentPropertiesProps<GridViewAttributes>
> = ({ schema, onSchemaChange }) => {
  const consumerSchema = useConsumerSchema();
  const table = consumerSchema.tables.find(({ id }) => id === schema.table);

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationField
          schema={{
            id: 'table',
            label: 'Table',
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: consumerSchema.tables.map((table) => ({
                value: table.id,
                label: table.label,
              })),
            },
          }}
          value={schema.table}
          onChange={(table) =>
            onSchemaChange((schema) => ({
              ...schema,
              table,
              columns: [],
              query: undefined,
            }))
          }
        />,
        ...(table
          ? [
              <DenimApplicationField
                schema={{
                  id: 'columns',
                  label: 'Columns',
                  type: DenimFormControlType.MultiDropDown,
                  controlProps: {
                    options: table.columns.map((column) => ({
                      value: column.name,
                      label: column.label,
                    })),
                  },
                }}
                value={schema.columns}
                onChange={(columns) =>
                  onSchemaChange((schema) => ({
                    ...schema,
                    columns,
                  }))
                }
              />,
              <DynamicValueProvider
                values={
                  schema.table
                    ? [
                        {
                          code: 'return staticQuery;',
                          label: 'Static Query',
                          arguments: [],
                          type: `condition-${schema.table || 'no-table'}`,
                          tag: schema.table,
                        },
                      ]
                    : []
                }
              >
                <DynamicValue
                  label="Query"
                  propKey="query"
                  schema={schema}
                  onSchemaChange={onSchemaChange}
                  types={[`condition-${schema.table || 'no-table'}`]}
                />
              </DynamicValueProvider>,
            ]
          : []),
      ]}
    />
  );
};

const GridView: FunctionComponent<ComponentRendererProps<GridViewAttributes>> =
  ({ id, schema, onSchemaChange, selected, select }) => {
    const consumerSchema = useConsumerSchema();
    const table = consumerSchema.tables.find(({ id }) => id === schema.table);
    const additionalFields = useMemoizedAdditionalFormFields(table);

    return (
      <>
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            select();
          }}
        >
          <DenimApplicationLayout
            content={[
              <h3>View: {table?.label || '- No Table Selected -'}</h3>,
              <DenimApplicationLayout
                flowDirection="row"
                content={
                  schema.columns?.map((column) => {
                    const columnSchema = table?.columns.find(
                      ({ name }) => name === column
                    );

                    if (columnSchema) {
                      return (
                        <div key={columnSchema.name}>{columnSchema.label}</div>
                      );
                    }

                    return '';
                  }) || []
                }
              />,
              <h4>Actions</h4>,
              <DynamicValueProvider values={additionalFields} groupKey="record">
                <Canvas
                  id={id + '-actions'}
                  components={schema.actions || []}
                  onChange={(callback) =>
                    onSchemaChange((oldSchema) => ({
                      ...oldSchema,
                      actions: callback(oldSchema.actions || []),
                    }))
                  }
                />
              </DynamicValueProvider>,
            ]}
          />
        </div>
        {selected ? (
          <PropertiesPanel title="Layout">
            <GridViewProperties
              schema={schema}
              onSchemaChange={onSchemaChange}
            />
          </PropertiesPanel>
        ) : null}
      </>
    );
  };

export default GridView;
