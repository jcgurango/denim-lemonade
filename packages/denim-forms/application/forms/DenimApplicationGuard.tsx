import React, { FunctionComponent } from 'react';
import { useDenimApplication } from '../DenimApplicationV2';

const DenimApplicationGuard: FunctionComponent<{ allowedRoles?: string[] }> = ({
  allowedRoles,
  children,
}) => {
  const application = useDenimApplication();

  if (
    allowedRoles &&
    allowedRoles.length &&
    (!application.roles ||
      !allowedRoles.find((role) => application.roles?.includes(role)))
  ) {
    return null;
  }

  return <>{children}</>;
};

export default DenimApplicationGuard;
