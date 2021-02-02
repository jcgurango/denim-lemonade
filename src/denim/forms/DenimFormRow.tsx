import React, { FunctionComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { DenimFormRowSchema, DenimFormSchema } from '../core';
import isMobile from '../core/utils/isMobile';
import { useDenimForm } from './providers/DenimFormProvider';

export interface DenimFormRowProps {
  schema: DenimFormRowSchema;
  form: DenimFormSchema;
}

const DenimFormRow: FunctionComponent<DenimFormRowProps> = ({ schema, form }) => {
  const { componentRegistry: { control: DenimFormControl } } = useDenimForm();
  const mobile = isMobile();

  return (
    <View style={[styles.row, mobile ? styles.rowMobile : null]}>
      {schema.controls.map((control, i) => (
        <View
          key={control.id}
          style={[mobile ? null : { flex: control.relativeWidth }]}
        >
          <View
            style={[
              styles.controlContainer,
              (!mobile && i > 0) ? null : styles.firstControlContainer,
              (mobile && i < schema.controls.length - 1) ? styles.mobileBottomPadding : null,
            ]}
          >
            <DenimFormControl schema={control} form={form} />
          </View>
        </View>
      ))}
    </View>
  );
};

export default DenimFormRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rowMobile: {
    flexDirection: 'column',
  },
  controlContainer: {
    marginLeft: 16,
  },
  firstControlContainer: {
    marginLeft: 0,
  },
  mobileBottomPadding: {
    marginBottom: 8,
  },
});
