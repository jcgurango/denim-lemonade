import React, { FunctionComponent, useEffect, useState } from 'react';
import { DenimRelatedRecord, DenimSelectOption } from '../../core';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import { useDenimLookupData } from '../providers/DenimLookupDataProvider';
import DenimPickerProps from './DenimPickerProps';
import NativeDropDown from './NativeDropDown';

export const useRelatedRecords = (
  relationship: string | undefined,
  options: any,
) => {
  const [loadedRecords, setLoadedRecords] = useState<
    DenimRelatedRecord[] | null
  >(null);
  const lookup = useDenimLookupData();

  useEffect(() => {
    if (relationship) {
      (async () => {
        const relatedRecords = await lookup.lookup(relationship, '**||**');
        setLoadedRecords(relatedRecords);
      })();
    }
  }, [lookup, relationship]);

  const passedOptions: DenimSelectOption[] = loadedRecords
    ? loadedRecords.map((record) => ({
        label: record.name || '',
        value: record.id,
      }))
    : options;

  return {
    records: loadedRecords,
    passedOptions,
  };
};

const DenimDropDown: FunctionComponent<
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
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  const { records, passedOptions } = useRelatedRecords(relationship, options);

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      <NativeDropDown
        onChange={(value: any) => {
          if (value && relationship) {
            onChange(records?.find(({ id }) => id === value));
            return;
          }

          onChange(value || null);
        }}
        value={value && value.id ? value.id : value}
        options={passedOptions}
        placeholder={relationship && !records ? 'Loading...' : placeholder}
        disabled={disabled}
        {...props}
      />
    </ControlContainer>
  );
};

export default DenimDropDown;
