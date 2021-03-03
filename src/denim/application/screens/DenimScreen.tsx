import React, { FunctionComponent, useContext, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Link, useHistory, useParams } from 'react-router-dom';
import { DenimQueryConditionOrGroup, DenimRecord, isMobile } from '../../core';
import { ConnectedForm, DenimIcon, useDenimUser } from '../../forms';
import DenimTabControl from '../../forms/controls/DenimTabControl';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import {
  DenimAuthenticator,
  DenimDataSource,
  DenimSchemaSource,
} from '../../service';
import {
  DenimApplicationContextVariable,
  DenimRouterSchema,
  DenimRouterComponentSchema,
  DenimRouterParameterMap,
} from '../types/router';

export interface DenimScreenProps {
  routerSchema: DenimRouterSchema;
  schema: DenimRouterComponentSchema;
  state?: any;
  onStateChange?: React.Dispatch<any>;
  getScreenState?: (id: string) => any;
  formProvider: ConnectedForm<any, any>;
  schemaSource: DenimSchemaSource<any>;
  dataSource: DenimDataSource<any, any>;
  dataContext: any;
  path: string;
  auth?: DenimAuthenticator<any>;
}

const DeleteButton: FunctionComponent<{
  deleteRecord: () => Promise<void>;
  onComplete: () => void;
}> = ({ deleteRecord, onComplete }) => {
  const {
    componentRegistry: { button: DenimButton },
  } = useDenimForm();
  const [deleting, setDeleting] = useState(false);
  const notifications = useDenimNotifications();

  return (
    <DenimButton
      type="danger"
      text="Delete"
      disabled={deleting}
      onPress={async () => {
        try {
          setDeleting(true);
          await deleteRecord();
          onComplete();
        } catch (e) {
          notifications.notify({
            message: e.message,
            code: 0,
            type: 'error',
          });
        }

        setDeleting(false);
      }}
    />
  );
};

const DenimScreen: FunctionComponent<DenimScreenProps> = ({
  routerSchema,
  schema,
  state: passedState,
  onStateChange: setPassedState,
  formProvider,
  schemaSource,
  dataSource,
  dataContext,
  path,
  auth,
}) => {
  const renderChildSchema = (component: DenimRouterComponentSchema) => {
    return (
      <DenimScreen
        schema={component}
        state={state}
        onStateChange={setState}
        formProvider={formProvider}
        schemaSource={schemaSource}
        dataSource={dataSource}
        dataContext={dataContext}
        path={path}
        routerSchema={routerSchema}
        auth={auth}
      />
    );
  };

  const [internalState, setInternalState] = useState<any>(
    schema.defaultState || {},
  );
  const state =
    typeof passedState === 'undefined' ? internalState : passedState;
  const setState =
    typeof setPassedState === 'undefined' ? setInternalState : setPassedState;
  const PreComponent = schema.preContent || (() => null);
  const PostComponent = schema.postContent || (() => null);
  const { Context } = formProvider;
  const {
    componentRegistry: { button: DenimButton, control: DenimFormControl },
  } = useDenimForm();
  const data = useContext(Context);
  const history = useHistory();
  const route = useParams<any>();
  const { user, roles } = useDenimUser();
  const mobile = isMobile();

  const readContextVariable = (
    variable: DenimApplicationContextVariable,
    record: DenimRecord | undefined = data.currentRecord,
  ) => {
    if (typeof variable === 'string') {
      return variable;
    }

    if (typeof variable === 'object') {
      if ('$route' in variable) {
        return route[variable.$route];
      }

      if ('$user' in variable) {
        if (!user) {
          return null;
        }

        return user[variable.$user];
      }

      if ('$screen' in variable) {
        return state[variable.$screen];
      }

      if ('$record' in variable) {
        if (!record) {
          return null;
        }

        return record[variable.$record];
      }
    }

    return variable;
  };

  const writeContextVariable = (
    variable: DenimApplicationContextVariable,
    newValue: any,
    record?: DenimRecord,
  ) => {
    if (typeof variable === 'object') {
      if ('$route' in variable) {
        const newRoute = {
          ...route,
          [variable.$route]: newValue,
        };
        const currentPath = Object.keys(newRoute).reduce((current, param) => {
          return current.replace(
            ':' + param,
            readContextVariable(newRoute[param], record),
          );
        }, path);
        const newPath = Object.keys(newRoute).reduce((path, key) => {
          return path.replace(':' + key, newRoute[key]);
        }, path);

        if (currentPath !== newPath) {
          history.push(newPath);
        }
        return;
      }

      if ('$user' in variable) {
        if (user) {
          user[variable.$user] = newValue;
        }

        return;
      }

      if ('$screen' in variable) {
        setState((variables: any) => ({
          ...variables,
          [variable.$screen]: newValue,
        }));
        return;
      }
    }
  };

  const buildScreenPathFromParams = (
    routerSchema: DenimRouterSchema,
    screenId: string,
    record?: DenimRecord,
    paramsSchema?: DenimRouterParameterMap,
  ) => {
    const screen = routerSchema.screens.find(({ id }) => id === screenId);
    const params: {
      [param: string]: DenimApplicationContextVariable;
    } = {
      ...(paramsSchema || {}),
    };
    const pathParameters = Object.keys(params).sort().join('|');
    const path = screen?.paths.find((path) => {
      const params = [];
      const regex = /:([\w-]+)/g;
      let match;

      while ((match = regex.exec(path))) {
        params.push(match[1]);
      }

      return params.sort().join('|') === pathParameters;
    });

    if (screen && path) {
      const newPath = Object.keys(params).reduce((current, param) => {
        return current.replace(
          ':' + param,
          readContextVariable(params[param], record),
        );
      }, path);

      return newPath;
    }

    return '';
  };

  const iterateQueryContextVariables = (
    query: DenimQueryConditionOrGroup,
  ): DenimQueryConditionOrGroup => {
    if (query.conditionType === 'single') {
      return {
        ...query,
        value: readContextVariable(query.value),
      };
    }

    return {
      ...query,
      conditions: query.conditions.map((condition) =>
        iterateQueryContextVariables(condition),
      ),
    };
  };

  const renderScreen = () => {
    if (schema.type === 'content') {
      if (typeof schema.content === 'function') {
        const Element = schema.content;

        return (
          <View style={{ flex: 1 }}>
            <Element state={state} onStateChange={setState} />
          </View>
        );
      }

      return schema.content;
    }

    if (schema.type === 'view') {
      const { View: DenimView } = formProvider;
      let query = null;

      if (schema.filter) {
        if (
          typeof schema.filter === 'object' &&
          'conditionType' in schema.filter
        ) {
          query = iterateQueryContextVariables(schema.filter);
        } else {
          query = readContextVariable(schema.filter);
        }
      }

      return (
        <>
          <Modal transparent={true} visible={!!state.pendingRecordDeletion}>
            <View
              style={[
                styles.modalContainer,
                mobile ? styles.mobileModalContainer : null,
              ]}
            >
              <View
                style={[styles.modalBox, mobile ? styles.mobileModalBox : null]}
              >
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 18,
                    marginBottom: 16,
                  }}
                >
                  Are you sure you want to delete this record?
                </Text>
                <DeleteButton
                  deleteRecord={() => {
                    const table = data.getDataProviderFor(schema.table);

                    if (table) {
                      return table.deleteRecord(
                        dataContext,
                        state.pendingRecordDeletion,
                      );
                    }

                    return Promise.resolve();
                  }}
                  onComplete={() =>
                    setState((values: any) => ({
                      ...values,
                      pendingRecordDeletion: false,
                      extraViewData: Math.random().toString(),
                    }))
                  }
                />
                <View style={{ height: 12 }} />
                <DenimButton
                  text="Cancel"
                  type="primary"
                  onPress={() =>
                    setState((values: any) => ({
                      ...values,
                      pendingRecordDeletion: false,
                    }))
                  }
                />
              </View>
            </View>
          </Modal>
          <DenimView
            schema={schema.view}
            table={schema.table}
            query={query}
            extraData={state.extraViewData}
            defaultSort={schema.defaultSort}
            renderActions={
              schema.actions
                ? (record: DenimRecord) => {
                    if (schema.actions) {
                      return (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                          }}
                        >
                          {schema.actions.map((action) => {
                            if (action.type === 'delete') {
                              return (
                                <a
                                  href="/"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setState((values: any) => ({
                                      ...values,
                                      pendingRecordDeletion: record.id,
                                    }));
                                  }}
                                  title={action.title || 'Delete'}
                                  style={{ marginRight: 12 }}
                                >
                                  <DenimIcon type={action.icon || 'delete'} />
                                </a>
                              );
                            }

                            if (action.type === 'view') {
                              if ('screen' in action) {
                                const newPath = buildScreenPathFromParams(
                                  routerSchema,
                                  action.screen,
                                  record,
                                  action.params,
                                );

                                if (newPath) {
                                  return (
                                    <Link
                                      to={newPath}
                                      title={action.title || 'View'}
                                      style={{ marginRight: 12 }}
                                    >
                                      <DenimIcon
                                        type={action.icon || 'pencil'}
                                      />
                                    </Link>
                                  );
                                }
                              }
                            }

                            return null;
                          })}
                        </View>
                      );
                    }

                    return <></>;
                  }
                : undefined
            }
          />
        </>
      );
    }

    if (schema.type === 'filter') {
      const { Filter } = formProvider;
      const query = schema.filter ? readContextVariable(schema.filter) : null;
      const setQuery = (value: any) => {
        if (schema.filter) {
          writeContextVariable(schema.filter, value);
        }
      };

      return (
        <Filter
          table={schema.table}
          filterColumns={schema.filterColumns}
          query={query}
          onQueryChange={setQuery}
          globalSearchColumns={schema.globalSearchColumns}
        />
      );
    }

    if (schema.type === 'form') {
      const { Form } = formProvider;
      const recordId = schema.record
        ? readContextVariable(schema.record)
        : null;

      return (
        <Form
          table={schema.table}
          record={recordId}
          schema={schema.form}
          onSave={(record) => {
            if (record.id && schema.record) {
              writeContextVariable(schema.record, record.id, record);
            }
          }}
        />
      );
    }

    if (schema.type === 'tabs') {
      return (
        <DenimTabControl
          tab={readContextVariable(schema.tabIndex)}
          onTabChange={(value) => writeContextVariable(schema.tabIndex, value)}
          tabs={schema.tabs.map((tab) => ({
            label: tab.label,
            content: renderChildSchema(tab.component),
          }))}
        />
      );
    }

    if (schema.type === 'layout') {
      return (
        <View style={{ flexDirection: schema.flowDirection, flex: 1 }}>
          {schema.children.map(
            ({ relativeWidth, component: content }, index) => (
              <View
                style={[
                  { flex: relativeWidth },
                  index > 0
                    ? {
                        marginLeft:
                          schema.flowDirection === 'row' ? 12 : undefined,
                        marginTop:
                          schema.flowDirection === 'column' ? 12 : undefined,
                      }
                    : null,
                ]}
                key={content.id}
              >
                {renderChildSchema(content)}
              </View>
            ),
          )}
        </View>
      );
    }

    if (schema.type === 'form-provider') {
      const { FormProvider } = formProvider;
      const recordId = schema.record
        ? typeof schema.record === 'string' ||
          !('conditionType' in schema.record)
          ? readContextVariable(schema.record)
          // eslint-disable-next-line react-hooks/rules-of-hooks
          : useMemo(
              () =>
                iterateQueryContextVariables(
                  schema.record as DenimQueryConditionOrGroup,
                ),
              // eslint-disable-next-line react-hooks/exhaustive-deps
              [schema.record],
            )
        : null;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const prefill = useMemo(() => {
        if (!schema.prefill) {
          return schema.prefill;
        }

        return Object.keys(schema.prefill).reduce((current, next) => {
          if (!schema.prefill) {
            return current;
          }

          return {
            [next]: readContextVariable(schema.prefill && schema.prefill[next]),
          };
        }, {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [schema.prefill]);

      return (
        <FormProvider
          table={schema.table}
          record={recordId}
          prefill={prefill}
          onSave={(record) => {
            if (schema.saveRedirect) {
              const params: {
                [param: string]: DenimApplicationContextVariable;
              } = {
                ...(schema.saveRedirect.params || {}),
              };
              const newPath = buildScreenPathFromParams(
                routerSchema,
                schema.saveRedirect.screen,
                record,
                schema.saveRedirect.params,
              );

              if (newPath) {
                const currentPath = Object.keys(params).reduce(
                  (current, param) => {
                    return current.replace(
                      ':' + param,
                      readContextVariable(params[param], record),
                    );
                  },
                  path,
                );

                if (currentPath !== newPath) {
                  history.push(newPath);
                }
              }
            }
          }}
        >
          {renderChildSchema(schema.component)}
        </FormProvider>
      );
    }

    if (schema.type === 'field') {
      const { table, tableSchema } = data;
      let controlSchema = schema.field;

      if (table && tableSchema) {
        const column = tableSchema.columns.find(
          ({ name }) => name === controlSchema.id,
        );

        if (column) {
          const readonly = auth && !auth.authorizeField(table, controlSchema.id, roles, data.currentRecord);
          const newSchema = data.getControlFor(
            tableSchema,
            column,
            controlSchema,
          );

          if (newSchema) {
            controlSchema = newSchema;

            if (readonly) {
              controlSchema.controlProps = {
                ...(controlSchema.controlProps || { }),
                disabled: true,
              };
            }
          }
        }
      }

      return (
        <DenimFormControl
          schema={controlSchema}
          value={schema.value ? readContextVariable(schema.value) : undefined}
          onChange={schema.onChange}
        />
      );
    }

    if (schema.type === 'button') {
      if (schema.buttonAction === 'screen') {
        const path = buildScreenPathFromParams(
          routerSchema,
          schema.screen,
          undefined,
          schema.params,
        );

        return (
          <Link to={path} style={{ textDecoration: 'none' }}>
            <DenimButton
              text={readContextVariable(schema.text)}
              onPress={() => {}}
            />
          </Link>
        );
      }
    }

    return null;
  };

  return (
    <>
      <PreComponent />
      {renderScreen()}
      <PostComponent />
    </>
  );
};

export default DenimScreen;

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
