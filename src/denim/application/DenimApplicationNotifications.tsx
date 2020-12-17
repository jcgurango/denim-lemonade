import React, { FunctionComponent, useRef } from 'react';
import DenimNotificationProvider from '../forms/providers/DenimNotificationProvider';
import NotificationSystem from 'react-notification-system';
import { DenimNotification } from '../core';

const DenimApplicationNotifications: FunctionComponent = ({ children }) => {
  const notificationSystemRef = useRef<any>(null);

  const notify = (notification: DenimNotification) => {
    if (notificationSystemRef.current) {
      notificationSystemRef.current.addNotification({
        message: notification.message,
        level: notification.type,
      });
    }
  };

  return (
    <DenimNotificationProvider notify={notify}>
      {children}
      <NotificationSystem ref={notificationSystemRef} />
    </DenimNotificationProvider>
  );
};

export default DenimApplicationNotifications;
