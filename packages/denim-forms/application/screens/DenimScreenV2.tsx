import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import { Route, useParams } from 'react-router';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';
import DenimApplicationLoginForm from '../forms/DenimApplicationLoginForm';

interface DenimScreenV2Props {
  id: string;
  paths: string[];
  allowedRoles?: string[];
}

const ScreenWrapper: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const pathParams =
    useParams<{
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
  const [screenState, setScreenState] = useState({});

  return (
    <>
      {paths.map((path) => {
        if (
          allowedRoles &&
          allowedRoles.length &&
          !allowedRoles.find((role) => application.roles.includes(role))
        ) {
          return (
            <Route key={path} path={path} exact>
              <DenimApplicationLoginForm />
            </Route>
          );
        }

        return (
          <Route key={path} path={path} exact>
            <DenimApplicationContext.Provider
              value={{
                ...application,
                screenId: id,
                route: path,
                screenState,
                setScreenState,
              }}
            >
              <ScreenWrapper>{children}</ScreenWrapper>
            </DenimApplicationContext.Provider>
          </Route>
        );
      })}
    </>
  );
};

export default DenimScreenV2;
