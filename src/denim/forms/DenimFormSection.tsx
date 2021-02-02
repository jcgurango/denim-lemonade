import React, { FunctionComponent, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from './providers/TranslationProvider';
import { DenimFormSchema, DenimFormSectionSchema } from '../core';
import { useDenimForm } from './providers/DenimFormProvider';

export interface DenimFormSectionProps {
  form: DenimFormSchema;
  schema: DenimFormSectionSchema;
}

const DenimFormSection: FunctionComponent<DenimFormSectionProps> = ({
  form,
  schema,
}) => {
  const [isOpen, setIsOpen] = useState(
    schema.collapsible ? schema.defaultOpen : true,
  );
  const translation = useTranslation();
  const {
    componentRegistry: { row: DenimFormRow },
    styleOverrides,
  } = useDenimForm();

  const renderLabelText = () => (
    <Text style={[styles.sectionLabel, styleOverrides?.formSection?.label]}>
      {schema.label ||
        translation.translate(`Forms.${form.id}.Sections.${schema.id}`)}
    </Text>
  );

  const renderLabel = () =>
    schema.collapsible ? (
      <TouchableOpacity onPress={() => setIsOpen((open) => !open)}>
        {renderLabelText()}
      </TouchableOpacity>
    ) : (
      <View>{renderLabelText()}</View>
    );

  const renderRows = () =>
    schema.rows.map((row) => (
      <DenimFormRow key={row.id} schema={row} form={form} />
    ));

  return (
    <View style={styles.section}>
      {schema.showLabel ? renderLabel() : null}
      {isOpen ? renderRows() : null}
    </View>
  );
};

export default DenimFormSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 24,
    marginBottom: 8,
  },
});
