import React, { FunctionComponent,} from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { isMobile } from '../../forms';

const DenimModal: FunctionComponent<{ visible: boolean }> = ({
  children,
  visible,
}) => {
  const mobile = isMobile();

  return (
    <Modal transparent={true} visible={visible}>
      <View
        style={[
          styles.modalContainer,
          mobile ? styles.mobileModalContainer : null,
        ]}
      >
        <View style={[styles.modalBox, mobile ? styles.mobileModalBox : null]}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

export default DenimModal;

const styles = StyleSheet.create({
  modalContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileModalContainer: {
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  mobileModalBox: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
});
