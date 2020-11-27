import React, {
  createContext,
  FunctionComponent,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator } from 'react-native';
import * as Yup from 'yup';
import { Schema } from 'yup';
import {
  DenimColumn,
  DenimColumnType,
  DenimDataContext,
  DenimFormControlSchema,
  DenimFormControlType,
  DenimFormSchema,
  DenimQueryOperator,
  DenimRecord,
  DenimTable,
} from '../../core';
import {
  DenimDataSource,
  DenimSchemaSource,
  DenimTableDataProvider,
} from '../../service';
import DenimForm, { DenimFormProps } from '../DenimForm';
import DenimFormProvider, { useDenimForm } from './DenimFormProvider';
import DenimLookupDataProvider from './DenimLookupDataProvider';

interface DenimConnectedDataProviderProps<
  T extends DenimDataContext,
  S extends DenimSchemaSource<T>
> {
  dataSource: DenimDataSource<T, S>;
  schemaSource: S;
  context: T;
}

interface ConnectedFormProps {
  table: string;
  record: string;
  onSave?: (record: DenimRecord) => {};
}

interface AsynchronousProps {
  renderLoading?: () => ReactElement<any, any> | null;
}

export interface DenimConnectedDataContext<T extends DenimDataContext> {
  getTableValidator: (table: string) => Schema<any, object>;
  getTableSchema: (table: string) => DenimTable | undefined;
  getControlFor: (
    table: DenimTable,
    column: DenimColumn,
    control: DenimFormControlSchema,
  ) => DenimFormControlSchema | null;
  getDataProviderFor: (
    table: string,
  ) => DenimTableDataProvider<T, DenimSchemaSource<T>> | null;
  context?: T;
}

export const createConnectedDataProvider = <
  T extends DenimDataContext,
  S extends DenimSchemaSource<T>
>() => {
  const Context = createContext<DenimConnectedDataContext<T>>({
    getTableValidator: () => Yup.object(),
    getTableSchema: () => undefined,
    getControlFor: () => null,
    getDataProviderFor: () => null,
  });

  const Provider: FunctionComponent<DenimConnectedDataProviderProps<T, S>> = ({
    schemaSource,
    dataSource,
    context,
    children,
  }) => {
    return (
      <Context.Provider
        value={{
          context,
          getTableValidator: useCallback(
            (table) => {
              const validator = schemaSource.createValidator(table);
              return validator.createValidator(context);
            },
            [schemaSource],
          ),
          getTableSchema: useCallback(
            (table: string) =>
              schemaSource.schema.tables.find(
                ({ id, name }) => id === table || name === table,
              ),
            [schemaSource.schema],
          ),
          getControlFor: (
            table: DenimTable,
            column: DenimColumn,
            control: DenimFormControlSchema,
          ) => {
            switch (column.type) {
              case DenimColumnType.Boolean:
                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: DenimFormControlType.CheckBox,
                };
              case DenimColumnType.Select:
                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: DenimFormControlType.DropDown,
                  controlProps: {
                    options: column.properties.options,
                    ...(control.controlProps || { }),
                  },
                };
              case DenimColumnType.MultiSelect:
                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: DenimFormControlType.MultiDropDown,
                  controlProps: {
                    options: column.properties.options,
                    ...(control.controlProps || { }),
                  },
                };
              case DenimColumnType.ForeignKey:
                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: column.properties.multiple
                    ? DenimFormControlType.MultiLookup
                    : DenimFormControlType.Lookup,
                  controlProps: {
                    relationship: column.name,
                    ...(control.controlProps || { }),
                  },
                };
              case DenimColumnType.Text:
              case DenimColumnType.Number:
                if (column.properties?.long) {
                  return {
                    ...control,
                    label: control.label || column.name,
                    id: column.name,
                    type: DenimFormControlType.MultilineTextInput,
                  };
                }

                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: DenimFormControlType.TextInput,
                };
              case DenimColumnType.DateTime:
                return {
                  ...control,
                  label: control.label || column.name,
                  id: column.name,
                  type: DenimFormControlType.DatePicker,
                  controlProps: {
                    withTime: column.properties.includesTime,
                    ...(control.controlProps || { }),
                  },
                };
            }

            return {
              ...control,
              label: control.label || column.name,
              type: DenimFormControlType.ReadOnly,
            };
          },
          getDataProviderFor: (table) => dataSource.createDataProvider(table),
        }}
      >
        {children}
      </Context.Provider>
    );
  };

  const Form: FunctionComponent<
    DenimFormProps & ConnectedFormProps & AsynchronousProps
  > = ({
    schema,
    table,
    record,
    onSave = () => {},
    renderLoading = () => <ActivityIndicator />,
    ...props
  }) => {
    const context = useContext(Context);
    const dataProvider = useMemo(() => context.getDataProviderFor(table), [
      context,
      table,
    ]);
    const validator = useMemo(() => context.getTableValidator(table), [
      context.getTableValidator,
      table,
    ]);
    const convertedSchema = useMemo<DenimFormSchema>(() => {
      const tableSchema = context.getTableSchema(table);

      if (!tableSchema) {
        return schema;
      }

      return {
        ...schema,
        sections: schema.sections.map((section) => ({
          ...section,
          rows: section.rows.map((row) => ({
            ...row,
            controls: row.controls.map((control) => {
              const column = tableSchema?.columns.find(
                ({ name }) => name === control.id,
              );

              if (column) {
                return (
                  context.getControlFor(tableSchema, column, control) || control
                );
              }

              return control;
            }),
          })),
        })),
      };
    }, [schema, context.getControlFor]);
    const [formValid, setFormValid] = useState(false);
    const [recordData, setRecordData] = useState<DenimRecord | null>(
      record ? null : {},
    );
    const [updateData, setUpdateData] = useState<DenimRecord | null>({});
    const [errors, setErrors] = useState<Yup.ValidationError[]>([]);
    const [saving, setSaving] = useState(false);
    const form = useDenimForm();
    const Button = form.componentRegistry.button;

    useEffect(() => {
      if (record && (!recordData || recordData.id !== record)) {
        let cancelled = false;

        (async () => {
          if (context.context) {
            const retrievedRecord = await dataProvider?.retrieveRecord(
              context.context,
              record,
            );

            if (!cancelled) {
              setRecordData(retrievedRecord || null);
            }
          }
        })();

        return () => {
          cancelled = true;
        };
      }
    }, [recordData, record]);

    useEffect(() => {
      let cancelled = false;

      (async () => {
        try {
          await validator.validate(recordData, {
            abortEarly: false,
          });
          if (!cancelled) {
            setErrors([]);
            setFormValid(true);
          }
        } catch (e) {
          if (!cancelled) {
            if (e.inner) {
              setErrors(e.inner);
            }
            setFormValid(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [recordData]);

    if (record && !recordData) {
      return renderLoading();
    }

    const save = async () => {
      if (dataProvider) {
        setErrors([]);
        setSaving(true);
        const c: any = context.context;
        const rec: any = updateData;

        try {
          const savedRecord = await ((record || recordData?.id)
            ? dataProvider.updateRecord(c, String(record || recordData?.id), rec)
            : dataProvider.createRecord(c, rec));
          setRecordData(savedRecord);
          setUpdateData({});
          onSave(savedRecord);
        } catch (e) {
          if (e.inner) {
            setErrors(e.inner);
          } else {
            setErrors([e]);
          }
        }

        setSaving(false);
      }
    };

    return (
      <DenimFormProvider
        getValue={(field) => recordData && recordData[field]}
        setValue={(field) => (newValue) => {
          setRecordData((current: any) => ({
            ...current,
            [field]: newValue,
          }));
          setUpdateData((current: any) => ({
            ...current,
            [field]: newValue,
          }));
        }}
        getErrorsFor={(field) =>
          errors.filter((error) => {
            return (
              error.path &&
              (error.path === field || error.path.startsWith(field + '.'))
            );
          })
        }
      >
        <DenimLookupDataProvider
          lookup={async (relationship: string, query: string) => {
            const tableSchema = context.getTableSchema(table);

            if (tableSchema) {
              const column = tableSchema?.columns.find(
                ({ name }) => name === relationship,
              );

              if (column?.type === DenimColumnType.ForeignKey) {
                const otherTable = column.properties.foreignTableId;
                const otherTableSchema = context.getTableSchema(otherTable);

                if (otherTableSchema) {
                  const nameField = otherTableSchema.nameField;
                  const data = context.getDataProviderFor(
                    otherTableSchema.name,
                  );
                  const c: any = context.context;

                  if (data) {
                    const records = await data.retrieveRecords(c, {
                      conditions: {
                        conditionType: 'single',
                        field: nameField,
                        operator: DenimQueryOperator.StringContains,
                        value: query,
                      },
                      expand: [],
                    });

                    return records.map((record) => ({
                      type: 'record',
                      id: String(record.id),
                      name: String(record[nameField]),
                      record,
                    }));
                  }
                }
              }
            }

            return [];
          }}
        >
          <DenimForm
            schema={convertedSchema}
            error={errors.filter((error) => !error.path).join('\n')}
            {...props}
          />
          <Button text="Save" onPress={save} disabled={saving || !formValid} />
        </DenimLookupDataProvider>
      </DenimFormProvider>
    );
  };

  return {
    Provider,
    Form,
  };
};
