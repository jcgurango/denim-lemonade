import React, { FunctionComponent } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import DenimPickerProps from './DenimPickerProps';
import DenimTag from './DenimTag';
import NativeDropDown from './NativeDropDown';

const DenimMultiDropDown: FunctionComponent<
  DenimControlProps &
    DenimPickerProps
> = ({ onChange, value, schema, form, errors, options, ...props }) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  const select = (newValue: any) => {
    if (Array.isArray(value) && value.indexOf(newValue) > -1) {
      return value;
    }

    return [].concat(value || []).concat(newValue);
  };

  const deselect = (newValue: any) => {
    if (Array.isArray(value) && value.indexOf(newValue) > -1) {
      return value.filter((value) => value !== newValue);
    }

    return value;
  };

  return (
    <ControlContainer
      error={errors.length > 0}
      helpText={helpText}
    >
      {Array.isArray(value) ? (
        value.map((val) => {
          const option = options?.find(({ value }) => value === val);

          if (option) {
            return (
              <DenimTag
                key={option.value}
                color="rgb(80, 80, 80)"
                style={{ marginBottom: 8 }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ color: 'white', flex: 1 }}>{option.label}</Text>
                  <TouchableOpacity onPress={() => onChange(deselect(val))}>
                    <Text style={{ color: 'white' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </DenimTag>
            );
          }

          return null;
        })
      ) : null}
      <NativeDropDown
        onChange={(value: any) => onChange(select(value))}
        value={''}
        options={options?.filter(({ value: optionValue }) => !value || !Array.isArray(value) || !value.includes(optionValue))}
        {...props}
      />
    </ControlContainer>
  );
};

export default DenimMultiDropDown;
