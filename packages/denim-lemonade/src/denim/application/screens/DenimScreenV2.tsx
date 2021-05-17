import React from 'react';
import { FunctionComponent } from 'react';
import { Route, useParams } from 'react-router';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';

interface DenimScreenV2Props {
  id: string;
  paths: string[];
  allowedRoles?: string[];
}

const ScreenWrapper: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const pathParams = useParams<{
    [key: string]: any;
  }>();

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        routeParameters: pathParams,
      }}
    >
      {children}
    </DenimApplicationContext.Provider>
  );
};

const DenimScreenV2: FunctionComponent<DenimScreenV2Props> = ({
  id,
  paths,
  allowedRoles,
  children,
}) => {
  const application = useDenimApplication();

  return (
    <>
      {paths
        .filter(() => {
          if (!allowedRoles) {
            return true;
          }

          return !!allowedRoles.find((role) =>
            application.roles.includes(role),
          );
        })
        .map((path) => (
          <Route key={path} path={path} exact>
            <DenimApplicationContext.Provider
              value={{
                ...application,
                screenId: id,
                route: path,
              }}
            >
              <ScreenWrapper>{children}</ScreenWrapper>
            </DenimApplicationContext.Provider>
          </Route>
        ))}
    </>
  );
};

export default DenimScreenV2;
