import React, { Fragment, FunctionComponent } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import {
  DenimColumn,
  DenimFormControlSchema,
  DenimQueryConditionGroup,
  DenimQueryOperator,
} from '../../core';
import DenimForm from '../DenimForm';
import DenimFormControl from '../DenimFormControl';
import DenimDropDown from './DenimDropDown';
import NativeDropDown from './NativeDropDown';

export interface DenimFilterControlProps {
  value?: DenimQueryConditionGroup;
  onChange: (value: DenimQueryConditionGroup) => void;
  columns: DenimColumn[];
  fieldControls: {
    [key: string]: DenimFormControlSchema;
  };
}

const DenimFilterControl: FunctionComponent<DenimFilterControlProps> = ({
  value,
  onChange,
  columns,
  fieldControls,
}) => {
  const currentQuery: DenimQueryConditionGroup = value || {
    conditionType: 'group',
    type: 'AND',
    conditions: [],
  };

  const renderGroup = (
    group: DenimQueryConditionGroup,
    onChange: (value: DenimQueryConditionGroup) => void,
    key = '',
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
                return (
                  <View style={styles.conditionContainer}>
                    <View style={styles.conditionPartContainer}>
                      <Text>{column.label}</Text>
                    </View>
                    <View style={styles.conditionPartContainer} />
                    <View style={styles.conditionPartContainer}>
                      <DenimFormControl
                        schema={{
                          ...columnSchema,
                          id: key + '-' + i,
                        }}
                      />
                    </View>
                  </View>
                );
              }

              return null;
            }

            return (
              <Fragment key={key + '-' + i}>
                {renderGroup(condition, () => {}, key + '-' + i)}
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
            <View style={styles.conditionPartContainer} />
            <View style={styles.conditionPartContainer}>
              <Button
                title="Add group"
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
          </View>
        </View>
      </View>
    );
  };

  return renderGroup(currentQuery, onChange);
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
