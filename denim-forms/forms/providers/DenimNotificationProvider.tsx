import React, { FunctionComponent, useContext } from 'react';
import { DenimNotification } from 'denim';

interface DenimNotificationContextProps {
  notify: (notification: DenimNotification) => void;
  handleError: (e: Error) => boolean;
}

const DenimNotificationContext = React.createContext<DenimNotificationContextProps>({
  notify: () => { },
  handleError: () => false,
});

export const useDenimNotifications = () => useContext(DenimNotificationContext);

const DenimNotificationProvider: FunctionComponent<Partial<DenimNotificationContextProps>> = ({
  children,
  ...props
}) => {
  const context = useDenimNotifications();

  return (
    <DenimNotificationContext.Provider value={{ ...context, ...props }}>
      {children}
    </DenimNotificationContext.Provider>
  );
};

export default DenimNotificationProvider;
