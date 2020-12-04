import React, { ComponentType, FunctionComponent, useMemo } from 'react';
import { DenimMenuSchema, DenimRouterSchema } from './types/router';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from 'react-router-dom';
import { DenimForm, ConnectedForm } from '../forms';
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

const DenimApplication: FunctionComponent<DenimApplicationProps> = ({
  router,
  menu,
  dataContext,
  formProvider,
  schemaSource,
  dataSource,
}) => {
  const screens = useMemo(() => {
    const screens: {
      [key: string]: {
        paths: string[];
        linkPath: string;
        Component: ComponentType;
      };
    } = {};

    router.screens.forEach((screen) => {
      if (screen.type === 'form') {
        screens[screen.id] = {
          paths: [
            screen.slug || '/' + screen.id,
            (screen.slug || '/' + screen.id) + '/:id',
          ],
          linkPath: screen.slug || '/' + screen.id,
          Component: () => {
            const { id } = useParams<{ id?: string }>();

            if (screen.table) {
              const { Provider, Form } = formProvider;

              return (
                <Provider
                  schemaSource={schemaSource}
                  dataSource={dataSource}
                  context={dataContext}
                >
                  <Form
                    table={screen.table}
                    record={id || screen.record || ''}
                    schema={screen.form}
                  />
                </Provider>
              );
            }

            return <DenimForm schema={screen.form} />;
          },
        };
      }

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
    });

    return screens;
  }, [router.screens]);

  return (
    <Router>
      <div style={{ padding: 16 }}>
        {menu.menuItems.map((item) => {
          if (item.type === 'screen') {
            return <Link to={screens[item.screen].linkPath}>{item.label}</Link>;
          }

          return null;
        })}
      </div>
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
    </Router>
  );
};

export default DenimApplication;
