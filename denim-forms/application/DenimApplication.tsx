import React, { FunctionComponent } from 'react';
import { DenimMenuSchema, DenimRouterSchema } from './types/router';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { ConnectedForm, useDenimUser } from '../forms';
import {
  DenimAuthenticator,
  DenimDataSource,
  DenimSchemaSource,
} from 'denim';
import DenimApplicationNotifications from './DenimApplicationNotifications';
import DenimApplicationDataContextProvider from './providers/DenimApplicationDataContextProvider';
import DenimScreen from './screens/DenimScreen';

interface DenimApplicationProps {
  router: DenimRouterSchema;
  menu: DenimMenuSchema;
  dataContext: any;
  formProvider: ConnectedForm<any, any>;
  schemaSource: DenimSchemaSource<any>;
  dataSource: DenimDataSource<any, any>;
  auth?: DenimAuthenticator<any>;
}

/**
 * Main container element for a DENIM application.
 */
const DenimApplication: FunctionComponent<DenimApplicationProps> = ({
  router,
  auth,
  dataContext,
  formProvider,
  schemaSource,
  dataSource,
}) => {
  const { Provider } = formProvider;
  const user = useDenimUser();

  // Render a react-router for the screens.
  return (
    <Router>
      <Provider
        dataSource={dataSource}
        schemaSource={schemaSource}
        context={dataContext}
      >
        <DenimApplicationNotifications>
          <main
            style={{
              padding: '16px',
              width: '100%',
              boxSizing: 'border-box',
              maxWidth: '1200px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <Switch>
              <DenimApplicationDataContextProvider
                routerSchema={router}
                auth={auth}
                formProvider={formProvider}
                schemaSource={schemaSource}
                dataSource={dataSource}
                dataContext={dataContext}
              >
                {router.screens
                  .filter((screen) =>
                    user.roles.find(
                      (role) => !screen.roles || screen.roles.includes(role),
                    ),
                  )
                  .map((screen) => {
                    return screen.paths.map((path) => (
                      <Route
                        key={path}
                        path={path}
                        render={() => (
                          <DenimScreen
                            schema={screen}
                            path={path}
                          />
                        )}
                        exact
                      />
                    ));
                  })}
              </DenimApplicationDataContextProvider>
            </Switch>
          </main>
        </DenimApplicationNotifications>
      </Provider>
    </Router>
  );
};

export default DenimApplication;
