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
import { DenimRelatedRecord, DenimRelatedRecordCollection } from '../../core';
import {
  DenimControlProps,
  useDenimForm,
} from '../providers/DenimFormProvider';
import { useDenimLookupData } from '../providers/DenimLookupDataProvider';
import DenimTag from './DenimTag';

interface DenimLookupProps {
  onRecordChange: (value: DenimRelatedRecord | null) => void;
  record: DenimRelatedRecord | null;
  relationship?: string;
}

interface DenimMultiLookupProps {
  onChange: (value: DenimRelatedRecordCollection | null) => void;
  value: DenimRelatedRecordCollection | null;
  relationship?: string;
}

const LookupField: FunctionComponent<TextInputProps & DenimLookupProps> = ({
  onRecordChange,
  record,
  relationship,
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

  useEffect(() => {
    if (showLookup) {
      setSearchText('');
      setSearchResults([]);
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
  }, [searchText, relationship]);

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
        placeholder="Select a record..."
        value={displayText}
        onFocus={() => setShowLookup(true)}
        {...props}
      />
      <Modal transparent={true} visible={showLookup}>
        <View style={styles.lookupModalContainer}>
          <View style={styles.lookupModalBox}>
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

const DenimLookup: FunctionComponent<
  DenimControlProps & TextInputProps & DenimLookupProps
> = ({ schema, form, errors, relationship, value, onChange, ...props }) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  return (
    <ControlContainer error={errors.length > 0} helpText={helpText}>
      <LookupField relationship={relationship} record={value} {...props} onRecordChange={onChange} />
    </ControlContainer>
  );
};

export const DenimMultiLookup: FunctionComponent<
  DenimControlProps & TextInputProps & DenimMultiLookupProps
> = ({ onChange, schema, form, errors, relationship, value, ...props }) => {
  const denimForm = useDenimForm();
  const ControlContainer = denimForm.componentRegistry.controlContainer;
  const helpText = errors.map(({ message }) => message).join('\n');

  const deselect = (recordId: string) => {
    return value && {
      ...value,
      records: value.records.filter(({ id }: { id: string }) => id !== recordId),
    };
  };

  const select = (record: DenimRelatedRecord): DenimRelatedRecordCollection => {
    return {
      type: 'record-collection',
      records: [
        ...(value?.records || []),
        record,
      ],
    };
  };

  return (
    <ControlContainer error={errors.length > 0} helpText={helpText}>
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
                  {record.name}
                </Text>
                <TouchableOpacity onPress={() => onChange(deselect(record.id))}>
                  <Text style={{ color: 'white' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </DenimTag>
          );
          })
        : null}
      <LookupField
        relationship={relationship}
        onRecordChange={(record: DenimRelatedRecord | null) => record && onChange(select(record))}
        record={null}
        {...props}
      />
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
  lookupModalBox: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 800,
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
