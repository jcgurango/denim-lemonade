import React, { Fragment, FunctionComponent } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  DenimColumn,
  DenimFormControlSchema,
  DenimFormControlType,
  DenimQueryCondition,
  DenimQueryConditionGroup,
  DenimQueryOperator,
} from '../../core';
import { DenimLocalQuery } from '../../service';
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

const DenimFilterControl: FunctionComponent<DenimFilterControlProps> = ({
  value,
  onChange,
  onApply,
  columns,
  fieldControls,
}) => {
  const { componentRegistry: { button: DenimButton } } = useDenimForm();
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
    onRemove: () => void,
  ) => {
    const extraProps: any = { };

    if (columnSchema.type === DenimFormControlType.TextInput) {
      extraProps.onSubmitEditing = () => {
        onApply();
      };
    }

    return (
      <View style={styles.conditionContainer} key={key + '-' + column.name}>
        <View style={styles.conditionPartContainer}>
          <Text>{column.label}</Text>
        </View>
        <View style={styles.conditionPartContainer}>
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
              DenimLocalQuery.validOperatorsFor(column).includes(value),
            )}
          />
        </View>
        <View style={styles.conditionPartContainer}>
          {!['notnull', 'null'].includes(condition.operator) ? (
            <DenimFormControl
              schema={{
                ...columnSchema,
                id: key,
                hideLabel: true,
                controlProps: {
                  ...(columnSchema.controlProps || { }),
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
        </View>
        <DenimButton text="Remove" type="danger" onPress={onRemove} />
      </View>
    );
  };

  const renderGroup = (
    group: DenimQueryConditionGroup,
    onChange: (value: DenimQueryConditionGroup) => void,
    onRemove: () => void,
    parentKey = '',
  ) => {
    return (
      <View style={styles.conditionGroupContainer}>
        <View style={styles.conditionGroupType}>
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
        </View>
        <View style={styles.conditionsContainer}>
          {group.conditions.map((condition, i) => {
            if (condition.conditionType === 'single') {
              const column = columns.find(
                ({ name }) => name === condition.field,
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
                    }),
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
                  parentKey + '-' + i,
                )}
              </Fragment>
            );
          })}
          <View style={styles.conditionContainer}>
            <View style={styles.conditionPartContainer}>
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
            </View>
            <View style={styles.conditionPartContainer}>
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
            </View>
            <View style={styles.conditionPartContainer}>
              {group !== currentQuery ? (
                <DenimButton
                  text="Remove Group"
                  type="danger"
                  onPress={() => onRemove()}
                />
              ) : (
                <DenimButton
                  text="Apply Filters"
                  onPress={() => onApply()}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return renderGroup(currentQuery, onChange, () => {});
};

export default DenimFilterControl;

const styles = StyleSheet.create({
  conditionGroupContainer: {
    flexDirection: 'row',
  },
  conditionGroupType: {
    borderWidth: 1,
    borderColor: 'black',
    alignSelf: 'stretch',
    backgroundColor: 'rgb(200, 200, 200)',
    padding: 16,
    justifyContent: 'center',
  },
  conditionsContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionPartContainer: {
    flex: 1,
  },
});
