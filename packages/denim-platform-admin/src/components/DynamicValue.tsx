import React, {
  FunctionComponent,
  createContext,
  useContext,
  ReactChild,
} from 'react';
import {
  DenimFormControlType,
  DenimColumnType,
  DenimColumn,
  DenimQueryConditionOrGroup,
} from 'denim';
import {
  DenimApplicationField,
  DenimApplicationLayout,
  DenimFilterControl,
} from 'denim-forms';
import numeral from 'numeral';
import { stripPathVariables } from '../screens/Screens';
import { useConsumerSchema } from '../providers/ConsumerSchemaProvider';

export type DynamicValueSchema = {
  code: string;
  arguments: {
    name: string;
    label: string;
    type: string;
  }[];
  type: string;
  label: string;
  key?: string;
  tag?: any;
};

const staticString =
  "return (stringValue || '').replace(/:(\\w+)/g, (match, prop) => eval(prop));";
const staticNumber = 'return staticNumber;';

const getConditionText = (
  condition: DenimQueryConditionOrGroup,
  dynamicValues: DynamicValueSchema[]
): string => {
  if (condition.conditionType === 'single') {
    return `${condition.field} ${condition.operator} ${renderDynamicValue(
      condition,
      'value',
      dynamicValues,
      'Dynamic Value'
    )}`;
  }

  return `(${condition.conditions
    .map((condition) => getConditionText(condition, dynamicValues))
    .join(` ${condition.type.toUpperCase()} `)})`;
};

export const getDataTypesForColumn = (column: DenimColumn) => {
  let types: string[] = [];

  switch (column.type) {
    case DenimColumnType.Text:
      types = ['string'];
      break;
    case DenimColumnType.ForeignKey:
      types = ['string', `record-${column.properties.foreignTableId}`];
      break;
    case DenimColumnType.Boolean:
      types = ['boolean'];
      break;
    case DenimColumnType.Number:
      types = ['number'];
      break;
  }

  return types;
};

export const renderDynamicValue = (
  schema: any,
  keyProp: string,
  dynamicValues: DynamicValueSchema[],
  defaultValue: string = '< Dynamic Value >'
): string => {
  const code = schema[keyProp];
  const params = schema[keyProp + '__props'] || {};
  let value =
    dynamicValues.find(({ code: c }) => c === code)?.label || defaultValue;

  if (code === staticString) {
    return params.stringValue;
  }

  if (code === staticNumber) {
    return numeral(params.staticNumber).format('0,000.0000');
  }

  if (code === 'return staticQuery;') {
    const query: DenimQueryConditionOrGroup = params.staticQuery;

    return `Static Query ${getConditionText(query, dynamicValues)}`;
  }

  return value;
};

const DynamicValueContext = createContext<{
  dynamicValues: DynamicValueSchema[];
}>({
  dynamicValues: [
    {
      code: staticString,
      arguments: [],
      type: 'string',
      label: 'Static String',
    },
    {
      code: staticNumber,
      arguments: [],
      type: 'number',
      label: 'Static Number',
    },
    {
      code: 'return true;',
      arguments: [],
      type: 'boolean',
      label: 'True',
    },
    {
      code: 'return false;',
      arguments: [],
      type: 'boolean',
      label: 'False',
    },
    {
      code: "return !boolValue;",
      arguments: [
        {
          name: 'boolValue',
          label: 'Boolean',
          type: 'boolean',
        }
      ],
      type: 'boolean',
      label: 'Not',
    },
    {
      code: "return 'pencil';",
      arguments: [],
      type: 'icon',
      label: 'Pencil',
    },
    {
      code: "return 'list';",
      arguments: [],
      type: 'icon',
      label: 'List',
    },
    {
      code: "return 'delete';",
      arguments: [],
      type: 'icon',
      label: 'Delete',
    },
    {
      code: 'return { link: link };',
      arguments: [
        {
          name: 'link',
          label: 'Relative URL',
          type: 'string',
        },
      ],
      type: 'button-action',
      label: 'Link (In-Application)',
    },
    {
      code: 'return { href: link };',
      arguments: [
        {
          name: 'link',
          label: 'URL',
          type: 'string',
        },
      ],
      type: 'button-action',
      label: 'Link (External)',
    },
    {
      code: "return 'deleteRecord';",
      arguments: [],
      type: 'button-action',
      label: 'Delete Record',
    },
    {
      code: 'return function() { application.navigate(url); };',
      arguments: [
        {
          name: 'url',
          label: 'Relative Path',
          type: 'string',
        },
      ],
      type: 'callback',
      label: 'Navigate',
    },
  ],
});

export const useDynamicValues = () => useContext(DynamicValueContext);

export const DynamicValueProvider: FunctionComponent<{
  values: DynamicValueSchema[];
  groupKey?: string;
}> = ({ values, groupKey, children }) => {
  const parent = useDynamicValues();

  return (
    <DynamicValueContext.Provider
      value={{
        dynamicValues: parent.dynamicValues
          .filter(({ key: dk }) => {
            return !groupKey || !dk || dk !== groupKey;
          })
          .concat(
            values.map((val) => ({
              ...val,
              key: groupKey,
            }))
          ),
      }}
    >
      {children}
    </DynamicValueContext.Provider>
  );
};

const DynamicValue: FunctionComponent<{
  label: string;
  schema: any;
  propKey: string;
  onSchemaChange: (newValue: any | ((oldValue: any) => any)) => void;
  types: string[];
}> = ({ label, schema, propKey, onSchemaChange, types }) => {
  const { tables } = useConsumerSchema();
  const { dynamicValues } = useDynamicValues();
  const variableFields: ReactChild[] = [];
  const value = schema[propKey];

  if (value === staticString) {
    // Static string value.
    const stringValue = schema[propKey + '__props']?.stringValue;

    variableFields.push(
      <DenimApplicationField
        schema={{
          id: `${propKey}-string-value`,
          label: 'Value',
          type: DenimFormControlType.TextInput,
          controlProps: {
            placeholder: 'Use :name for variables',
          },
        }}
        value={stringValue || ''}
        onChange={(value) => {
          onSchemaChange((schema: any) => {
            return {
              ...schema,
              [propKey + '__props']: {
                ...schema[propKey + '__props'],
                stringValue: value,
              },
            };
          });
        }}
      />
    );

    const variables = stripPathVariables([stringValue || '']);

    variables.forEach((variable) => {
      variableFields.push(
        <DynamicValue
          label={`:${variable}`}
          propKey={variable}
          types={['string']}
          schema={schema[propKey + '__props']}
          onSchemaChange={(schema) => {
            onSchemaChange((oldSchema: any) => {
              return {
                ...oldSchema,
                [propKey + '__props']:
                  typeof schema === 'function'
                    ? schema(oldSchema[propKey + '__props'])
                    : schema,
              };
            });
          }}
        />
      );
    });
  } else if (value === staticNumber) {
    const staticNumber = schema[propKey + '__props']?.staticNumber;

    variableFields.push(
      <DenimApplicationField
        schema={{
          id: `${propKey}-text-value`,
          label: 'Value',
          type: DenimFormControlType.TextInput,
          controlProps: {
            placeholder: 'Enter a number of any format',
            format: '0,000.0000',
          },
        }}
        value={staticNumber || ''}
        onChange={(value) => {
          onSchemaChange((schema: any) => {
            return {
              ...schema,
              [propKey + '__props']: {
                ...schema[propKey + '__props'],
                staticNumber: value,
              },
            };
          });
        }}
      />
    );
  } else if (value === 'return staticQuery;') {
    const valueSchema = dynamicValues.find(({ code }) => code === value);
    const table = tables.find(({ id }) => id === valueSchema?.tag);

    if (table) {
      variableFields.push(
        <DenimFilterControl
          onChange={(value) => {
            onSchemaChange((schema: any) => {
              return {
                ...schema,
                [propKey + '__props']: {
                  ...schema[propKey + '__props'],
                  staticQuery: value,
                },
              };
            });
          }}
          value={schema[propKey + '__props'].staticQuery}
          columns={[
            {
              name: 'id',
              label: 'Record ID',
              type: DenimColumnType.Text,
              properties: {},
            } as DenimColumn,
          ].concat(table.columns)}
          fieldControls={(
            column,
            key,
            value,
            onChange,
            condition,
            onConditionChange
          ) => {
            const onSchemaChange = (newSchema: any) => {
              if (typeof newSchema === 'function') {
                return onConditionChange(newSchema(condition));
              }

              return onConditionChange(newSchema);
            };
            const types: string[] = getDataTypesForColumn(column);

            if (types.length) {
              return (
                <DynamicValue
                  label="Value"
                  types={types}
                  schema={condition}
                  propKey="value"
                  onSchemaChange={onSchemaChange}
                />
              );
            }

            return <div key={key}>Field type not supported.</div>;
          }}
        />
      );
    }
  } else {
    const valueSchema = dynamicValues.find(({ code }) => code === value);

    if (valueSchema) {
      valueSchema.arguments.forEach((argument) => {
        variableFields.push(
          <DynamicValue
            label={argument.label}
            propKey={argument.name}
            types={[argument.type]}
            schema={schema[propKey + '__props']}
            onSchemaChange={(schema) => {
              onSchemaChange((oldSchema: any) => {
                return {
                  ...oldSchema,
                  [propKey + '__props']:
                    typeof schema === 'function'
                      ? schema(oldSchema[propKey + '__props'])
                      : schema,
                };
              });
            }}
          />
        );
      });
    }
  }

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationField
          schema={{
            id: 'record-id',
            label: label,
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: dynamicValues
                .filter(({ type }) => type === '*' || types.includes(type))
                .map((value) => ({
                  label: value.label,
                  value: value.code,
                })),
            },
          }}
          value={value || ''}
          onChange={(value) => {
            onSchemaChange((schema: any) => {
              return {
                ...schema,
                [propKey]: value,
                [propKey + '__props']: {},
              };
            });
          }}
        />,
        <div style={{ paddingLeft: '0.5em' }}>
          <DenimApplicationLayout content={variableFields} />
        </div>,
      ]}
    />
  );
};

export default DynamicValue;
