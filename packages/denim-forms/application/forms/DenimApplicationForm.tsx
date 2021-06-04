import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionComponent } from 'react';
import { ActivityIndicator } from 'react-native';
import * as Yup from 'yup';
import {
  DenimNotificationCodes,
  DenimQueryConditionOrGroup,
  DenimRecord,
  DenimColumnType,
} from 'denim';
import { DenimFormProvider } from '../../forms';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';

export interface DenimApplicationFormProps {
  table: string;
  record?: DenimQueryConditionOrGroup | string;
  onSave?: (record: DenimRecord) => void;
  showSave?: boolean;
  prefill?: DenimRecord;
}

const DenimApplicationForm: FunctionComponent<DenimApplicationFormProps> = ({
  table,
  record,
  children,
  onSave = () => {},
  showSave = true,
  prefill,
}) => {
  const application = useDenimApplication();
  const notifications = useDenimNotifications();
  const tableSchema = useMemo(() => {
    return application.dataSource?.getTable(table);
  }, [application.dataSource, table]);

  const convertedPrefill = useMemo(() => {
    return (
      prefill &&
      Object.keys(prefill).reduce<DenimRecord>((current, key) => {
        let value = prefill[key];
        const column = tableSchema?.columns.find(({ name }) => name === key);

        if (
          column?.type === DenimColumnType.ForeignKey &&
          typeof value === 'string'
        ) {
          value = {
            type: 'record',
            id: value,
          };

          if (column.properties.multiple) {
            value = {
              type: 'record-collection',
              records: [value],
            };
          }
        }

        return {
          ...current,
          [key]: value,
        };
      }, {})
    );
  }, [prefill]);

  const [currentRecord, setCurrentRecord] = useState<DenimRecord | undefined>(
    record ? undefined : convertedPrefill
  );
  const [updateData, setUpdateData] = useState<DenimRecord | undefined>(
    currentRecord === convertedPrefill ? convertedPrefill : {}
  );

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
            record
          );

          if (!cancelled) {
            setCurrentRecord(foundRecord || undefined);
          }
        } else {
          const [foundRecord] =
            (await application.dataSource?.retrieveRecords(table, {
              pageSize: 1,
              page: 1,
              conditions: record,
            })) || [];

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
            updateData || {}
          );
        } else {
          newRecord = await application.dataSource?.createRecord(
            table,
            updateData || {}
          );
        }

        if (newRecord) {
          setCurrentRecord(newRecord);
          setUpdateData(undefined);

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

  const getValue = useCallback(
    (field) => currentRecord && currentRecord[field],
    [currentRecord]
  );

  const setValue = useCallback(
    (field) => (newValue: any) => {
      setCurrentRecord((current: any) => ({
        ...current,
        [field]: newValue,
      }));
      setUpdateData((current: any) => ({
        ...current,
        [field]: newValue,
      }));
    },
    []
  );

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
        getValue={getValue}
        setValue={setValue}
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
        save={save}
        canSave={formValid && !saving}
      >
        {children}
        {showSave ? (
          <div style={{ marginTop: '1em' }}>
            <DenimButton
              text={saving ? 'Saving...' : 'Save'}
              onPress={save}
              disabled={!formValid || saving}
            />
          </div>
        ) : null}
      </DenimFormProvider>
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationForm;
