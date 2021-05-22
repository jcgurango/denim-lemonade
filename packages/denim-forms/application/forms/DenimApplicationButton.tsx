import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Link } from 'react-router-dom';
import { isMobile } from '../../forms';
import { DenimIconType, useDenimViewData } from '../../forms';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import { useDenimApplication } from '../DenimApplicationV2';

export type DenimApplicationButtonAction =
  | {
      link: string;
    }
  | {
      callback: () => any;
    }
  | {
      href: string;
    }
  | 'deleteRecord';

export interface DenimApplicationButtonProps {
  text: string;
  action: DenimApplicationButtonAction;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'danger';
  icon?: DenimIconType;
  iconOnly?: boolean;
}

const DeleteModal: FunctionComponent<{
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ visible, onSuccess = () => {}, onCancel = () => {} }) => {
  const application = useDenimApplication();
  const mobile = isMobile();
  const notifications = useDenimNotifications();
  const [deleting, setDeleting] = useState(false);
  const name = application.record?.[application.tableSchema?.nameField || ''];

  const deleteRecord = async () => {
    setDeleting(true);

    try {
      await application.dataSource?.deleteRecord(
        application.tableSchema?.name || '',
        application.record?.id || '',
      );
      onSuccess();
    } catch (e) {
      notifications.notify({
        message: e.message,
        code: 0,
        type: 'error',
      });
      setDeleting(false);
    }
  };

  return (
    <Modal transparent={true} visible={visible}>
      <View
        style={[
          styles.modalContainer,
          mobile ? styles.mobileModalContainer : null,
        ]}
      >
        <View style={[styles.modalBox, mobile ? styles.mobileModalBox : null]}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 18,
              marginBottom: 16,
            }}
          >
            {name
              ? `Are you sure you want to delete "${name}"?`
              : 'Are you sure you want to delete this record?'}
          </Text>
          <DenimApplicationButton
            action={{
              callback: deleteRecord,
            }}
            text="Delete Record"
            type="danger"
            disabled={deleting}
          />
          <View style={{ height: 12 }} />
          <DenimApplicationButton
            text="Cancel"
            type="primary"
            action={{
              callback: onCancel,
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const DenimApplicationButton: FunctionComponent<DenimApplicationButtonProps> = ({
  text,
  action,
  type,
  icon,
  iconOnly,
  disabled,
}) => {
  const {
    componentRegistry: { button: DenimButton, icon: DenimIcon },
  } = useDenimForm();
  const [deleting, setDeleting] = useState(false);
  const viewData = useDenimViewData();
  let callback = () => {};
  let extraContent = null;

  if (action === 'deleteRecord') {
    extraContent = (
      <DeleteModal
        visible={deleting}
        onCancel={() => setDeleting(false)}
        onSuccess={() => viewData.refresh()}
      />
    );
    callback = () => {
      setDeleting(true);
    };
  }

  let button = (
    <DenimButton
      text={text}
      onPress={
        typeof action === 'object' && 'callback' in action
          ? action.callback
          : callback
      }
      type={type}
      disabled={disabled}
    />
  );

  const render = () => {
    if (iconOnly) {
      if (
        typeof action === 'object' &&
        ('href' in action || 'link' in action)
      ) {
        button = <DenimIcon type={icon} />;
      } else {
        button = (
          <a
            href="/"
            title={text}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              callback();
            }}
          >
            <DenimIcon type={icon} />
          </a>
        );
      }
    }

    if (typeof action === 'object') {
      if ('href' in action) {
        return (
          <a
            href={action.href}
            style={{ textDecoration: 'inherit' }}
            title={text}
          >
            {button}
          </a>
        );
      }

      if ('link' in action) {
        return (
          <Link
            to={action.link}
            style={{ textDecoration: 'inherit' }}
            title={text}
          >
            {button}
          </Link>
        );
      }
    }

    return button;
  };

  return (
    <>
      {render()}
      {extraContent}
    </>
  );
};

export default DenimApplicationButton;

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
