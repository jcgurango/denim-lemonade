import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  DenimRelatedRecord,
  DenimRelatedRecordCollection,
  isMobile,
} from '../../core';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import { useDenimLookupData } from '../providers/DenimLookupDataProvider';
import DenimTag from './DenimTag';

interface DenimLookupControlProps {
  relationship?: string;
}

interface DenimLookupProps {
  onRecordChange: (value: DenimRelatedRecord | null) => void;
  record: DenimRelatedRecord | null;
  relationship: string;
  disabled?: boolean;
}

const LookupField: FunctionComponent<TextInputProps & DenimLookupProps> = ({
  onRecordChange,
  record,
  relationship,
  disabled,
  ...props
}) => {
  const [searchText, setSearchText] = useState('');
  const searchRef = useRef<TextInput>(null);
  const denimForm = useDenimForm();
  const denimLookupData = useDenimLookupData();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const Button = denimForm.componentRegistry.button;
  const [showLookup, setShowLookup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DenimRelatedRecord[]>([]);
  const displayText = String(record?.name || '');
  const mobile = isMobile();

  useEffect(() => {
    if (showLookup) {
      setSearchText('');
      setSearchResults([]);

      if (searchRef.current) {
        searchRef.current.focus();
      }
    }
  }, [showLookup]);

  useEffect(() => {
    if (searchText.length) {
      let cancelled = false;
      setLoading(true);

      const bounce = setTimeout(async () => {
        const data = await denimLookupData.lookup(
          relationship || '',
          searchText,
        );

        if (!cancelled) {
          setSearchResults(data);
          setLoading(false);
        }
      }, 300);

      return () => {
        clearInterval(bounce);
        cancelled = true;
      };
    }
  }, [searchText, relationship, denimLookupData]);

  const select = (record?: DenimRelatedRecord) => {
    onRecordChange(record || null);
    setShowLookup(false);
  };

  return (
    <>
      <TextInput
        style={[
          styles.textInput,
          Platform.OS === 'web' ? { height: 24 } : null,
        ]}
        placeholder={disabled ? '-' : 'Select a record...'}
        value={displayText}
        onFocus={() => setShowLookup(true)}
        {...props}
      />
      <Modal transparent={true} visible={showLookup}>
        <View
          style={[
            styles.lookupModalContainer,
            mobile ? styles.mobileLookupModalContainer : null,
          ]}
        >
          <View
            style={[
              styles.lookupModalBox,
              mobile ? styles.mobileLookupModalBox : null,
            ]}
          >
            <ControlContainer>
              <TextInput
                style={[
                  styles.textInput,
                  Platform.OS === 'web' ? { height: 24 } : null,
                ]}
                ref={searchRef}
                onChangeText={setSearchText}
                value={searchText}
                placeholder="Search for a record..."
              />
            </ControlContainer>
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              searchResults.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  onPress={() => select(record)}
                >
                  <View style={styles.lookupResultContainer}>
                    <Text>{record.name}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={styles.buttonContainer}>
              <Button
                text="Cancel"
                onPress={() => setShowLookup(false)}
                type="danger"
              />
              {record?.id ? (
                <Button text="Clear" onPress={() => select()} />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export const useNameCache = (ids?: string[], relationship?: string) => {
  const [nameCache, setNameCache] = useState<{ [id: string]: string }>({});
  const { find } = useDenimLookupData();

  useEffect(() => {
    if (ids && relationship) {
      ids.forEach(async (id: string) => {
        if (!nameCache[id]) {
          const record = await find(relationship, id);

          if (record) {
            const name = String(record.name);

            setNameCache((cache) => ({
              ...cache,
              [record.id]: name,
            }));
          }
        }
      });
    }
  }, [ids, nameCache, relationship, find]);

  return nameCache;
};

const DenimLookup: FunctionComponent<
  DenimControlProps & TextInputProps & DenimLookupControlProps
> = ({
  schema,
  form,
  errors,
  relationship,
  value,
  onChange,
  disabled,
  ...props
}) => {
  const nameCache = useNameCache(
    (value && value.id && !value.name && [value.id]) || undefined,
    relationship,
  );
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';
  let record = {
    ...value,
  };

  if (record && record.id && !record.name) {
    record.name = nameCache[record.id] || '...';
  }

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      <LookupField
        relationship={relationship || ''}
        record={record}
        {...props}
        onRecordChange={onChange}
        disabled={disabled}
      />
    </ControlContainer>
  );
};

export const DenimMultiLookup: FunctionComponent<
  DenimControlProps & TextInputProps & DenimLookupControlProps
> = ({
  onChange,
  schema,
  form,
  errors,
  relationship,
  value,
  disabled,
  ...props
}) => {
  const nameCache = useNameCache(
    value &&
      value.records &&
      value.records.map(({ id }: DenimRelatedRecord) => id),
    relationship,
  );
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors?.map(({ message }) => message).join('\n') || '';

  const deselect = (recordId: string) => {
    return (
      value && {
        ...value,
        records: value.records.filter(
          ({ id }: { id: string }) => id !== recordId,
        ),
      }
    );
  };

  const select = (record: DenimRelatedRecord): DenimRelatedRecordCollection => {
    return {
      type: 'record-collection',
      records: [...(value?.records || []), record],
    };
  };

  return (
    <ControlContainer error={(errors?.length || 0) > 0} helpText={helpText}>
      {value?.type === 'record-collection' && Array.isArray(value?.records)
        ? value.records.map((record: DenimRelatedRecord) => {
            return (
              <DenimTag
                key={record.id}
                color="rgb(80, 80, 80)"
                style={{ marginBottom: 8 }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ color: 'white', flex: 1 }}>
                    {record.name || nameCache[record.id] || '...'}
                  </Text>
                  {!disabled ? (
                    <TouchableOpacity
                      onPress={() => onChange(deselect(record.id))}
                    >
                      <Text style={{ color: 'white' }}>×</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </DenimTag>
            );
          })
        : null}
      {!disabled ? (
        <LookupField
          relationship={relationship || ''}
          onRecordChange={(record: DenimRelatedRecord | null) =>
            record && onChange(select(record))
          }
          record={null}
          disabled={disabled}
          {...props}
        />
      ) : null}
    </ControlContainer>
  );
};

export default DenimLookup;

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    ...(Platform.OS === 'web'
      ? {
          outlineWidth: 0,
        }
      : {}),
  },
  lookupModalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileLookupModalContainer: {
    justifyContent: 'flex-end',
  },
  lookupModalBox: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 800,
  },
  mobileLookupModalBox: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  loading: {
    alignSelf: 'center',
    marginTop: 24,
  },
  lookupResultContainer: {
    borderWidth: 1,
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  buttonContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
