import React, { useMemo } from 'react';
import { FunctionComponent } from 'react';
import {
  DenimColumn,
  DenimColumnType,
  DenimFormControlSchema,
  DenimFormControlType,
} from '../../core';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimApplication } from '../DenimApplicationV2';

export interface DenimApplicationFieldProps {
  schema: DenimFormControlSchema;
  value?: any;
  onChange?: (value: any) => void;
}

export const getControlFor = (
  column: DenimColumn,
  control: DenimFormControlSchema,
) => {
  switch (column.type) {
    case DenimColumnType.Boolean:
      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.CheckBox,
        controlProps: {
          ...(column.defaultControlProps || { }),
          ...(control.controlProps || { }),
        },
      };
    case DenimColumnType.Select:
      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.DropDown,
        controlProps: {
          ...(column.defaultControlProps || { }),
          options: column.properties.options,
          ...(control.controlProps || {}),
        },
      };
    case DenimColumnType.MultiSelect:
      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.MultiDropDown,
        controlProps: {
          ...(column.defaultControlProps || { }),
          options: column.properties.options,
          ...(control.controlProps || {}),
        },
      };
    case DenimColumnType.ForeignKey:
      const { dropdown, ...props } = control.controlProps || {};

      if (dropdown) {
        return {
          ...control,
          label: control.label || column.label,
          id: column.name,
          type: column.properties.multiple
            ? DenimFormControlType.MultiDropDown
            : DenimFormControlType.DropDown,
          controlProps: {
            ...(column.defaultControlProps || { }),
            relationship: column.properties.foreignTableId,
            ...(props || {}),
          },
        };
      }

      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: column.properties.multiple
          ? DenimFormControlType.MultiLookup
          : DenimFormControlType.Lookup,
        controlProps: {
          ...(column.defaultControlProps || { }),
          relationship: column.properties.foreignTableId,
          ...(control.controlProps || {}),
        },
      };
    case DenimColumnType.Text:
      if (column.properties?.long) {
        return {
          ...control,
          label: control.label || column.label,
          id: column.name,
          type: DenimFormControlType.MultilineTextInput,
          controlProps: {
            ...(column.defaultControlProps || { }),
            ...(control.controlProps || { }),
          },
        };
      }

      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.TextInput,
        controlProps: {
          ...(column.defaultControlProps || { }),
          ...(control.controlProps || { }),
        },
      };
    case DenimColumnType.Number:
      return {
        ...control,
        controlProps: {
          ...(column.defaultControlProps || { }),
          ...control.controlProps,
          format: '{0:#,###,###,###,###,###,###,##0.00}',
          numerical: true,
        },
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.TextInput,
      };
    case DenimColumnType.DateTime:
      return {
        ...control,
        label: control.label || column.label,
        id: column.name,
        type: DenimFormControlType.DatePicker,
        controlProps: {
          ...(column.defaultControlProps || { }),
          withTime: column.properties.includesTime,
          ...(control.controlProps || {}),
        },
      };
  }

  return {
    ...control,
    label: control.label || column.label,
    type: DenimFormControlType.ReadOnly,
  };
};

const DenimApplicationField: FunctionComponent<DenimApplicationFieldProps> = ({
  schema,
  value,
  onChange,
}) => {
  const {
    componentRegistry: { control: FormControl },
  } = useDenimForm();
  const application = useDenimApplication();
  const controlSchema = useMemo(() => {
    const { tableSchema } = application;
    const column = tableSchema?.columns.find(({ name }) => name === schema.id);

    if (column) {
      return getControlFor(column, schema);
    }

    return schema;
  }, [application, schema]);

  return (
    <FormControl schema={controlSchema} value={value} onChange={onChange} />
  );
};

export default DenimApplicationField;
