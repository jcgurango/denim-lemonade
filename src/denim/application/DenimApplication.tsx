import React, { FunctionComponent, Fragment } from 'react';
import { DenimMenuSchema, DenimRouterSchema } from './types/router';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';
import { ConnectedForm, useDenimUser } from '../forms';
import { DenimDataSource, DenimSchemaSource } from '../service';
import DenimApplicationNotifications from './DenimApplicationNotifications';
import { StyleSheet, View } from 'react-native';
import DenimScreen from './screens/DenimScreen';

interface DenimApplicationProps {
  router: DenimRouterSchema;
  menu: DenimMenuSchema;
  dataContext: any;
  formProvider: ConnectedForm<any, any>;
  schemaSource: DenimSchemaSource<any>;
  dataSource: DenimDataSource<any, any>;
}

/**
 * Main container element for a DENIM application.
 */
const DenimApplication: FunctionComponent<DenimApplicationProps> = ({
  router,
  menu,
  dataContext,
  formProvider,
  schemaSource,
  dataSource,
}) => {
  const user = useDenimUser();

  // Render a react-router for the screens.
  return (
    <Router>
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
            {router.screens.map((screen) => {
              if (
                user.roles.find(
                  (role) => !screen.roles || screen.roles.includes(role),
                )
              ) {
                return (
                  <Fragment key={screen.id}>
                    {screen.paths.map((path) => (
                      <Route
                        key={path}
                        path={path}
                        render={() => (
                          <DenimScreen
                            formProvider={formProvider}
                            schemaSource={schemaSource}
                            dataSource={dataSource}
                            dataContext={dataContext}
                            schema={screen}
                            path={path}
                            routerSchema={router}
                          />
                        )}
                        exact
                      />
                    ))}
                  </Fragment>
                );
              }
            })}
          </Switch>
        </main>
      </DenimApplicationNotifications>
    </Router>
  );
};

export default DenimApplication;

const styles = StyleSheet.create({
  menuHeader: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
