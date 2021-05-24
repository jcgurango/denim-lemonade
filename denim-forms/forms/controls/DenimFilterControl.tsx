import React, { Fragment, FunctionComponent } from 'react';
import {
  DenimColumn,
  DenimFormControlSchema,
  DenimFormControlType,
  DenimQueryCondition,
  DenimQueryConditionGroup,
  DenimQueryOperator,
  DenimLocalQuery,
} from 'denim';
import styled from 'styled-components';
import DenimFormControl from '../DenimFormControl';
import { useDenimForm } from '../providers/DenimFormProvider';
import DenimDropDown from './DenimDropDown';
import NativeDropDown from './NativeDropDown';

export interface DenimFilterControlProps {
  value?: DenimQueryConditionGroup;
  onChange: (value: DenimQueryConditionGroup) => void;
  onApply: () => void;
  columns: DenimColumn[];
  fieldControls: {
    [key: string]: DenimFormControlSchema;
  };
}

const ConditionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ConditionGroupContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const ConditionPartContainer = styled.div`
  display: flex;
  flex: 1;
`;

const ConditionGroupType = styled.div`
  display: flex;
  align-self: stretch;
  justify-content: center;
  border-width: 1px;
  border-color: black;
  padding: 1em;
  background-color: rgb(200, 200, 200);
`;

const ConditionsContainer = styled.div`
  flex: 1;
  margin-left: 1.25em;
  justify-content: center;
  flex-direction: column;
`;

const DenimFilterControl: FunctionComponent<DenimFilterControlProps> = ({
  value,
  onChange,
  onApply,
  columns,
  fieldControls,
}) => {
  const {
    componentRegistry: { button: DenimButton },
  } = useDenimForm();
  const currentQuery: DenimQueryConditionGroup = value || {
    conditionType: 'group',
    type: 'AND',
    conditions: [],
  };

  const renderCondition = (
    column: DenimColumn,
    columnSchema: DenimFormControlSchema,
    condition: DenimQueryCondition,
    key: string,
    onChange: (value: DenimQueryCondition) => void,
    onRemove: () => void
  ) => {
    const extraProps: any = {};

    if (columnSchema.type === DenimFormControlType.TextInput) {
      extraProps.onSubmitEditing = () => {
        onApply();
      };
    }

    return (
      <ConditionContainer key={key + '-' + column.name}>
        <ConditionPartContainer>{column.label}</ConditionPartContainer>
        <ConditionPartContainer>
          <DenimDropDown
            value={condition.operator}
            onChange={(newOperator) =>
              onChange({
                ...condition,
                operator: newOperator,
              })
            }
            options={[
              {
                label: 'Is equal to',
                value: 'eq',
              },
              {
                label: 'Does not equal',
                value: 'neq',
              },
              {
                label: 'Contains',
                value: 'contains',
              },
              {
                label: 'Does not contain',
                value: 'ncontains',
              },
              {
                label: 'Is greater than',
                value: 'gt',
              },
              {
                label: 'Is greater than or equal to',
                value: 'gte',
              },
              {
                label: 'Is less than',
                value: 'lt',
              },
              {
                label: 'Is less than or equal to',
                value: 'lte',
              },
              {
                label: 'Has a value',
                value: 'notnull',
              },
              {
                label: 'Has no value',
                value: 'null',
              },
            ].filter(({ value }: any) =>
              DenimLocalQuery.validOperatorsFor(column).includes(value)
            )}
          />
        </ConditionPartContainer>
        <ConditionPartContainer>
          {!['notnull', 'null'].includes(condition.operator) ? (
            <DenimFormControl
              schema={{
                ...columnSchema,
                id: key,
                hideLabel: true,
                controlProps: {
                  ...(columnSchema.controlProps || {}),
                  ...extraProps,
                },
              }}
              value={condition.value}
              onChange={(newValue) =>
                onChange({
                  ...condition,
                  value: newValue,
                })
              }
            />
          ) : null}
        </ConditionPartContainer>
        <DenimButton text="Remove" type="danger" onPress={onRemove} />
      </ConditionContainer>
    );
  };

  const renderGroup = (
    group: DenimQueryConditionGroup,
    onChange: (value: DenimQueryConditionGroup) => void,
    onRemove: () => void,
    parentKey = ''
  ) => {
    return (
      <ConditionGroupContainer>
        <ConditionGroupType>
          <NativeDropDown
            options={[
              {
                value: 'AND',
                label: 'AND',
              },
              {
                value: 'OR',
                label: 'OR',
              },
            ]}
            value={group.type}
            onChange={(newValue: any) => {
              if (newValue) {
                onChange({
                  ...group,
                  type: newValue,
                });
              }
            }}
            placeholder="Type"
          />
        </ConditionGroupType>
        <ConditionsContainer>
          {group.conditions.map((condition, i) => {
            if (condition.conditionType === 'single') {
              const column = columns.find(
                ({ name }) => name === condition.field
              );
              const columnSchema = fieldControls[condition.field];

              if (column && columnSchema) {
                return renderCondition(
                  column,
                  columnSchema,
                  condition,
                  parentKey + '-' + i,
                  (newGroup) =>
                    onChange({
                      ...group,
                      conditions: group.conditions.map((condition, x) => {
                        if (x === i) {
                          return newGroup;
                        }

                        return condition;
                      }),
                    }),
                  () =>
                    onChange({
                      ...group,
                      conditions: group.conditions.filter((condition, x) => {
                        return x !== i;
                      }),
                    })
                );
              }

              return null;
            }

            return (
              <Fragment key={parentKey + '-' + i}>
                {renderGroup(
                  condition,
                  (newGroup) =>
                    onChange({
                      ...group,
                      conditions: group.conditions.map((condition, x) => {
                        if (x === i) {
                          return newGroup;
                        }

                        return condition;
                      }),
                    }),
                  () =>
                    onChange({
                      ...group,
                      conditions: group.conditions.filter((condition, x) => {
                        return x !== i;
                      }),
                    }),
                  parentKey + '-' + i
                )}
              </Fragment>
            );
          })}
          <ConditionContainer>
            <ConditionPartContainer>
              <DenimDropDown
                value=""
                onChange={(value) => {
                  onChange({
                    ...group,
                    conditions: [
                      ...group.conditions,
                      {
                        conditionType: 'single',
                        field: value,
                        operator: DenimQueryOperator.Equals,
                        value: null,
                      },
                    ],
                  });
                }}
                options={columns.map((column) => ({
                  label: column.label,
                  value: column.name,
                }))}
                placeholder="Select a field..."
              />
            </ConditionPartContainer>
            <ConditionPartContainer>
              <DenimButton
                text="Add group"
                onPress={() => {
                  onChange({
                    ...group,
                    conditions: [
                      ...group.conditions,
                      {
                        conditionType: 'group',
                        type: 'AND',
                        conditions: [],
                      },
                    ],
                  });
                }}
              />
            </ConditionPartContainer>
            <ConditionPartContainer>
              {group !== currentQuery ? (
                <DenimButton
                  text="Remove Group"
                  type="danger"
                  onPress={() => onRemove()}
                />
              ) : (
                <DenimButton text="Apply Filters" onPress={() => onApply()} />
              )}
            </ConditionPartContainer>
          </ConditionContainer>
        </ConditionsContainer>
      </ConditionGroupContainer>
    );
  };

  return renderGroup(currentQuery, onChange, () => {});
};

export default DenimFilterControl;
