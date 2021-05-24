import React, { FunctionComponent } from 'react';
import { DenimRelatedRecord } from 'denim';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import { useRelatedRecords } from './DenimDropDown';
import { useNameCache } from './DenimLookup';
import DenimPickerProps from './DenimPickerProps';
import DenimTag from './DenimTag';
import NativeDropDown from './NativeDropDown';

const DenimMultiDropDown: FunctionComponent<
  DenimControlProps & DenimPickerProps
> = ({
  onChange,
  value,
  schema,
  form,
  errors,
  options,
  relationship,
  placeholder,
  disabled,
  ...props
}) => {
  const denimForm = useDenimForm();
  const nameCache = useNameCache(
    value &&
      value.records &&
      value.records.map(({ id }: DenimRelatedRecord) => id),
    relationship
  );
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  const { records, passedOptions } = useRelatedRecords(relationship, options);

  const select = (newValue: any) => {
    if (relationship) {
      if (
        value &&
        value.records &&
        Array.isArray(value.records) &&
        value.records.find(({ id }: any) => id === newValue)
      ) {
        return value;
      }

      const record = records?.find(({ id }) => id === newValue);

      if (record) {
        return {
          type: 'record-collection',
          ...(value || {}),
          records: [...(value?.records || []), record],
        };
      }

      return value;
    }

    if (Array.isArray(value) && value.indexOf(newValue) > -1) {
      return value;
    }

    return [].concat(value || []).concat(newValue);
  };

  const deselect = (newValue: any) => {
    if (relationship) {
      return {
        ...value,
        records: value.records.filter(
          ({ id }: { id: string }) => id !== newValue.id
        ),
      };
    }

    if (Array.isArray(value) && value.indexOf(newValue) > -1) {
      return value.filter((value) => value !== newValue);
    }

    return value;
  };

  const selected: (string | DenimRelatedRecord)[] =
    (relationship ? value?.records : value) || [];

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      {selected.map((val) => {
        const option = options?.find(({ value }) => value === val);
        let value = option?.value;
        let label = option?.label;

        if (typeof val === 'object') {
          value = val.id;
          label = val.name || nameCache[value] || (val.id ? '...' : '');
        }

        if (value && label) {
          return (
            <DenimTag
              key={value}
              color="rgb(80, 80, 80)"
              style={{ marginBottom: 8 }}
            >
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <div style={{ color: 'white', flex: 1 }}>{label}</div>
                {!disabled ? (
                  <a
                    style={{
                      display: 'block',
                      color: 'white',
                      textDecoration: 'inherit',
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(deselect(val));
                    }}
                  >
                    ×
                  </a>
                ) : null}
              </div>
            </DenimTag>
          );
        }

        return null;
      })}
      <NativeDropDown
        onChange={(value: any) => onChange(select(value))}
        value={''}
        options={passedOptions?.filter(({ value: optionValue }) =>
          relationship
            ? !value ||
              !value.records
                .map(({ id }: { id: string }) => id)
                .includes(optionValue)
            : !value || !Array.isArray(value) || !value.includes(optionValue)
        )}
        placeholder={relationship && !records ? 'Loading...' : placeholder}
        disabled={disabled}
        {...props}
      />
    </ControlContainer>
  );
};

export default DenimMultiDropDown;
