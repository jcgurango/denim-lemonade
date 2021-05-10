import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionComponent } from 'react';
import { ActivityIndicator } from 'react-native';
import * as Yup from 'yup';
import {
  DenimColumnType,
  DenimNotificationCodes,
  DenimQuery,
  DenimQueryOperator,
  DenimRecord,
  DenimRelatedRecord,
} from '../../core';
import { DenimFormProvider } from '../../forms';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import DenimLookupDataProvider from '../../forms/providers/DenimLookupDataProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import { DenimDataSourceV2 } from '../../service';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';

export interface DenimApplicationFormProps {
  table: string;
  record?: DenimQuery | string;
  onSave?: (record: DenimRecord) => void;
}

export const getLookupProviderFor = (
  dataSource: DenimDataSourceV2,
  table: string,
) => {
  const tableSchema = dataSource.getTable(table);

  return {
    lookup: async (relationship: string, query: string) => {
      const column = tableSchema?.columns.find(
        ({ name }) => name === relationship,
      );

      if (column?.type === DenimColumnType.ForeignKey) {
        const otherTable = column.properties.foreignTableId;
        const otherTableSchema = dataSource.getTable(otherTable);

        const nameField = otherTableSchema.nameField;
        const denimQuery: DenimQuery =
          query === '**||**'
            ? {
                expand: [],
                retrieveAll: true,
              }
            : {
                conditions: {
                  conditionType: 'single',
                  field: nameField,
                  operator: DenimQueryOperator.Contains,
                  value: query,
                },
                expand: [],
                pageSize: 10,
                page: 1,
              };

        const records = await dataSource.retrieveRecords(
          otherTableSchema.name,
          denimQuery,
        );

        return records.map(
          (record) =>
            ({
              type: 'record',
              id: String(record.id),
              name: String(record[nameField]),
              record,
            } as DenimRelatedRecord),
        );
      }

      return [];
    },
    find: async (relationship: string, id: string) => {
      const column = tableSchema?.columns.find(
        ({ name }) => name === relationship,
      );

      if (column?.type === DenimColumnType.ForeignKey) {
        const otherTable = column.properties.foreignTableId;
        const otherTableSchema = dataSource.getTable(otherTable);

        const nameField = otherTableSchema.nameField;

        const record = await dataSource.retrieveRecord(
          otherTableSchema.name,
          id,
        );

        if (record) {
          return {
            type: 'record',
            id: String(record.id),
            name: String(record[nameField]),
            record,
          } as DenimRelatedRecord;
        }
      }

      return null;
    },
  };
};

const DenimApplicationForm: FunctionComponent<DenimApplicationFormProps> = ({
  table,
  record,
  children,
  onSave = () => {},
}) => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const lookup = useMemo(() => {
    if (application.dataSource) {
      return getLookupProviderFor(application.dataSource, table);
    }

    return { lookup: async () => [], find: async () => null };
  }, [application.dataSource, table]);
  const tableSchema = useMemo(() => {
    return application.dataSource?.getTable(table);
  }, [application.dataSource, table]);
  const [currentRecord, setCurrentRecord] = useState<DenimRecord | undefined>(
    undefined,
  );
  const [updateData, setUpdateData] = useState<DenimRecord | undefined>({});
  const [formValid, setFormValid] = useState(false);
  const [errors, setErrors] = useState<Yup.ValidationError[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    componentRegistry: { button: DenimButton },
  } = useDenimForm();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (record) {
        setLoading(true);

        if (typeof record === 'string') {
          const foundRecord = await application.dataSource?.retrieveRecord(
            table,
            record,
          );

          if (!cancelled) {
            setCurrentRecord(foundRecord || undefined);
          }
        } else {
          const [foundRecord] =
            (await application.dataSource?.retrieveRecords(table, record)) ||
            [];

          if (!cancelled) {
            setCurrentRecord(foundRecord || undefined);
          }
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [record, table, application.dataSource]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await application.dataSource?.validate(table, currentRecord || {});

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
  }, [currentRecord, table, application.dataSource]);

  const save = useCallback(() => {
    (async () => {
      setSaving(true);
      notifications.notify({
        type: 'info',
        message: 'Saving record...',
        code: DenimNotificationCodes.SavingRecord,
      });

      try {
        let newRecord = null;

        if (currentRecord?.id) {
          newRecord = await application.dataSource?.updateRecord(
            table,
            currentRecord.id,
            updateData || {},
          );
        } else {
          newRecord = await application.dataSource?.createRecord(
            table,
            updateData || {},
          );
        }

        if (newRecord) {
          notifications.notify({
            type: 'success',
            message: 'Record saved.',
            code: DenimNotificationCodes.SavingSuccessful,
          });

          onSave(newRecord);
        }
      } catch (e) {
        if (!notifications.handleError(e)) {
          notifications.notify({
            type: 'error',
            message: 'Failed to save the record.',
            code: DenimNotificationCodes.SavingFailed,
          });
        }
      }

      setSaving(false);
    })();
  }, [
    application.dataSource,
    currentRecord?.id,
    notifications,
    onSave,
    table,
    updateData,
  ]);

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        record: currentRecord,
        tableSchema,
      }}
    >
      <DenimFormProvider
        getValue={(field) => currentRecord && currentRecord[field]}
        setValue={(field) => (newValue) => {
          setCurrentRecord((current: any) => ({
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
              (error.path === field ||
                error.path.startsWith(field + '.') ||
                error.path.startsWith(field + '['))
            );
          })
        }
      >
        <DenimLookupDataProvider {...lookup}>
          {children}
          <div style={{ marginTop: '1em' }}>
            <DenimButton
              text={saving ? 'Saving...' : 'Save'}
              onPress={save}
              disabled={!formValid || saving}
            />
          </div>
        </DenimLookupDataProvider>
      </DenimFormProvider>
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationForm;
