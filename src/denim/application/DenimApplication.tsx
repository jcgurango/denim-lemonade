import React, { ComponentType, FunctionComponent, useMemo } from 'react';
import { DenimMenuSchema, DenimRouterSchema } from './types/router';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from 'react-router-dom';
import { DenimForm, ConnectedForm, useDenimUser } from '../forms';
import { DenimDataSource, DenimSchemaSource } from '../service';
import { DenimRecord } from '../core';

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

  // Create components for each provided screen.
  const screens = useMemo(() => {
    // key = ID of the screen.
    // paths = what paths to be bound for the screen.
    // linkPath = main link path for the screen if it appears in a menu.
    // Component = the component to be rendered for the screen.
    const screens: {
      [key: string]: {
        paths: string[];
        linkPath: string;
        Component: ComponentType;
      };
    } = {};

    router.screens.forEach((screen) => {
      if (
        user.roles.find((role) => !screen.roles || screen.roles.includes(role))
      ) {
        // Form screens
        if (screen.type === 'form') {
          screens[screen.id] = {
            paths: [
              screen.slug || '/' + screen.id,
              (screen.slug || '/' + screen.id) + '/:id',
            ],
            linkPath: screen.slug || '/' + screen.id,
            Component: () => {
              const user = useDenimUser();
              const { id } = useParams<{ id?: string }>();

              if (screen.table) {
                const { Provider, Form } = formProvider;
                let recordId: any = screen.record;

                if (
                  typeof recordId !== 'string' &&
                  typeof recordId !== 'undefined'
                ) {
                  recordId = user.user ? user.user[recordId.$user] : null;
                }

                return (
                  <Provider
                    schemaSource={schemaSource}
                    dataSource={dataSource}
                    context={dataContext}
                  >
                    <Form
                      table={screen.table}
                      record={recordId || id || ''}
                      schema={screen.form}
                    />
                  </Provider>
                );
              }

              return <DenimForm schema={screen.form} />;
            },
          };
        }

        // View screens
        if (screen.type === 'view') {
          screens[screen.id] = {
            paths: [screen.slug || '/' + screen.id],
            linkPath: screen.slug || '/' + screen.id,
            Component: () => {
              const { Provider, View } = formProvider;

              return (
                <Provider
                  schemaSource={schemaSource}
                  dataSource={dataSource}
                  context={dataContext}
                >
                  <View
                    schema={screen.view}
                    table={screen.table}
                    renderActions={
                      screen.form
                        ? (record: DenimRecord) => {
                            if (screen.form) {
                              return (
                                <Link
                                  to={
                                    screens[screen.form].linkPath +
                                    '/' +
                                    record.id
                                  }
                                >
                                  View
                                </Link>
                              );
                            }

                            return <></>;
                          }
                        : undefined
                    }
                  />
                </Provider>
              );
            },
          };
        }
      }
    });

    return screens;
  }, [router.screens, user]);

  // Render a react-router for the screens.
  return (
    <Router>
      <div style={{ padding: 16 }}>
        {menu.menuItems.map((item) => {
          if (
            user.roles.find((role) => !item.roles || item.roles.includes(role))
          ) {
            if (item.type === 'screen') {
              return (
                <Link key={item.id} to={screens[item.screen].linkPath}>
                  {item.label}
                </Link>
              );
            }
          }

          return null;
        })}
      </div>
      <main style={{ padding: '16px', width: '100%', boxSizing: 'border-box', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Switch>
          {Object.keys(screens).map((id) => {
            const screen = screens[id];

            return screen.paths.map((path) => (
              <Route
                key={`${id}-${path}`}
                path={path}
                component={screen.Component}
                exact
              />
            ));
          })}
        </Switch>
      </main>
    </Router>
  );
};

export default DenimApplication;
