import { DenimApplicationField, DenimApplicationLayout } from 'denim-forms';
import { DenimFormControlType, DenimColumnType, DenimTable } from 'denim';
import React, { FunctionComponent, ReactChild } from 'react';
import { useConsumerSchema } from '../../providers/ConsumerSchemaProvider';
import {
  ComponentPropertiesProps,
  ComponentRendererProps,
  PropertiesPanel,
  Canvas,
} from '../../screens/Screens';
import DynamicValue, {
  DynamicValueProvider,
  DynamicValueSchema,
  getDataTypesForColumn,
  renderDynamicValue,
  useDynamicValues,
} from '../DynamicValue';
import { useMemo } from 'react';

export interface FormProviderAttributes {
  table?: string;
  children?: any[];
  prefill: any;
}

export const FormProviderProperties: FunctionComponent<
  ComponentPropertiesProps<FormProviderAttributes>
> = ({ schema, onSchemaChange }) => {
  const consumerSchema = useConsumerSchema();
  const table = consumerSchema.tables.find(({ id }) => id === schema.table);
  const additionalFields: DynamicValueSchema[] =
    useMemoizedAdditionalFormFields(table);

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationField
          schema={{
            id: 'table',
            label: 'Form Table',
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: consumerSchema.tables.map(({ id, label }) => ({
                value: id,
                label,
              })),
            },
          }}
          value={schema.table || ''}
          onChange={(value) => {
            onSchemaChange((schema: any) => {
              return {
                ...schema,
                table: value,
                record: undefined,
                showSave: undefined,
                prefill: undefined,
                onSave: undefined,
              };
            });
          }}
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
            label="Record From"
            propKey="record"
            schema={schema}
            onSchemaChange={onSchemaChange}
            types={['string', `condition-${schema.table || 'no-table'}`]}
          />
        </DynamicValueProvider>,
        <DynamicValue
          label="Show Save"
          propKey="showSave"
          schema={schema}
          onSchemaChange={onSchemaChange}
          types={['boolean']}
        />,
        <DynamicValueProvider values={additionalFields} groupKey="record">
          <DynamicValue
            label="After Save Action"
            propKey="onSave"
            schema={schema}
            onSchemaChange={onSchemaChange}
            types={['callback']}
          />
        </DynamicValueProvider>,
        <DenimApplicationField
          schema={{
            id: 'prefill',
            label: 'Prefill',
            type: DenimFormControlType.CheckBox,
          }}
          value={schema.prefill}
          onChange={(prefill) => {
            onSchemaChange((schema) => ({
              ...schema,
              prefill: prefill ? {} : null,
            }));
          }}
        />,
        ...(schema.prefill && table
          ? [
              <h3>Prefill</h3>,
              ...table.columns.reduce<ReactChild[]>((current, column) => {
                const types = getDataTypesForColumn(column);

                if (types.length) {
                  return current.concat(
                    <DynamicValue
                      label={column.label}
                      propKey={column.name}
                      types={types}
                      schema={schema.prefill}
                      onSchemaChange={(schema) => {
                        onSchemaChange((oldSchema) => {
                          return {
                            ...oldSchema,
                            prefill:
                              typeof schema === 'function'
                                ? schema(oldSchema.prefill)
                                : schema,
                          };
                        });
                      }}
                    />
                  );
                }

                return current;
              }, []),
            ]
          : []),
      ]}
    />
  );
};

export const useMemoizedAdditionalFormFields = (
  table: DenimTable | undefined,
  generateFieldAccessor: (column: string) => string = (column) => {
    return `application.record && application.record[${JSON.stringify(
      column
    )}]`;
  },
  addFieldSchema: boolean = true,
  tableName = `${table?.name}`
): DynamicValueSchema[] => {
  const consumerSchema = useConsumerSchema();

  return useMemo(() => {
    const additionalFields: DynamicValueSchema[] = [];

    if (table) {
      additionalFields.push({
        code: `return ${generateFieldAccessor('id')};`,
        arguments: [],
        type: 'string',
        label: `Record ID from ${tableName}`,
      });

      additionalFields.push({
        code: `return !!(${generateFieldAccessor('id')});`,
        arguments: [],
        type: 'boolean',
        label: `Record from ${tableName} Exists`,
      });

      table.columns.forEach((column) => {
        additionalFields.push({
          code: `return !!(${generateFieldAccessor(column.name)});`,
          arguments: [],
          type: 'boolean',
          label: `${column.label} from ${tableName} has value`,
        });
  
        if (column.type === DenimColumnType.Text) {
          additionalFields.push({
            code: `return ${generateFieldAccessor(column.name)};`,
            arguments: [],
            type: 'string',
            label: `"${column.label}" from ${tableName}`,
          });
        }

        if (column.type === DenimColumnType.Boolean) {
          additionalFields.push({
            code: `return ${generateFieldAccessor(column.name)}`,
            arguments: [],
            type: 'boolean',
            label: `"${column.label}" from ${tableName}`,
          });

          additionalFields.push({
            code: `return (${generateFieldAccessor(
              column.name
            )}) ? yesText : noText;`,
            arguments: [
              {
                name: 'yesText',
                label: 'True Text',
                type: 'string',
              },
              {
                name: 'noText',
                label: 'False Text',
                type: 'string',
              },
            ],
            type: 'string',
            label: `"${column.label}" from ${tableName} (Formatted)`,
          });
        }

        if (column.type === DenimColumnType.ForeignKey) {
          if (column.properties.multiple) {
            const table = consumerSchema.tables.find(
              ({ id, name }) =>
                id === column.properties.foreignTableId ||
                name === column.properties.foreignTableId
            );

            if (table) {
              additionalFields.push({
                code: `
                  const records = ${generateFieldAccessor(
                    column.name
                  )} || { type: 'record-collection', records: [] };

                  return {
                    records: records,
                  };
                `,
                arguments: [],
                type: `condition-${table.id}`,
                label: `Child Records ("${column.label}" from ${tableName})`,
              });
            }
          } else {
            additionalFields.push({
              code: `return (${generateFieldAccessor(
                column.name
              )}) && (${generateFieldAccessor(column.name)}).id;`,
              arguments: [],
              type: 'string',
              label: `Record ID from "${column.label}" (${tableName})`,
            });
          }
        }

        if (column.type === DenimColumnType.Number) {
          additionalFields.push({
            code: `return ${generateFieldAccessor(column.name)};`,
            arguments: [],
            type: 'number',
            label: `"${column.label}" from ${tableName}`,
          });

          additionalFields.push({
            code: `return formatNumber(${generateFieldAccessor(
              column.name
            )}, format);`,
            arguments: [
              {
                name: 'format',
                label: 'Format',
                type: 'string',
              },
            ],
            type: 'string',
            label: `"${column.label}" from ${tableName} (Formatted)`,
          });
        }

        if (addFieldSchema) {
          additionalFields.push({
            code: `return ${JSON.stringify({ id: column.name })};`,
            arguments: [],
            type: 'field-schema',
            label: `"${column.label}" from ${tableName}`,
          });
        }
      });
    }

    return additionalFields;
  }, [
    table,
    generateFieldAccessor,
    addFieldSchema,
    consumerSchema.tables,
    tableName,
  ]);
};

const FormProvider: FunctionComponent<
  ComponentRendererProps<FormProviderAttributes>
> = ({ id, schema, onSchemaChange, selected, select }) => {
  const { dynamicValues } = useDynamicValues();
  const consumerSchema = useConsumerSchema();
  const table = consumerSchema.tables.find(({ id }) => id === schema.table);
  const additionalFields: DynamicValueSchema[] =
    useMemoizedAdditionalFormFields(table);

  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          select();
        }}
      >
        <div style={{ marginBottom: '1em' }}>
          Form Provider for <b>{table?.name || '-- no table selected --'}</b>
        </div>
        <div style={{ marginBottom: '1em' }}>
          Record:{' '}
          {renderDynamicValue(schema, 'record', dynamicValues, '- None -')}
        </div>
        <DynamicValueProvider values={additionalFields} groupKey="record">
          <Canvas
            id={id + '-children'}
            components={schema.children || []}
            onChange={(callback) =>
              onSchemaChange((oldSchema) => ({
                ...oldSchema,
                children: callback(oldSchema.children || []),
              }))
            }
          />
        </DynamicValueProvider>
      </div>
      {selected ? (
        <>
          <PropertiesPanel title="Form Provider">
            <FormProviderProperties
              schema={schema}
              onSchemaChange={onSchemaChange}
            />
          </PropertiesPanel>
        </>
      ) : null}
    </>
  );
};

export default FormProvider;
