import React, { FunctionComponent, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Link, useHistory, useParams } from 'react-router-dom';
import { DenimRecord, isMobile } from '../../core';
import { ConnectedForm, useDenimUser } from '../../forms';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import { DenimDataSource, DenimSchemaSource } from '../../service';
import {
  DenimApplicationContextVariable,
  DenimRouterSchema,
  DenimRouterScreenSchema,
} from '../types/router';

export interface DenimScreenProps {
  routerSchema: DenimRouterSchema;
  schema: DenimRouterScreenSchema;
  state?: any;
  onStateChange?: React.Dispatch<any>;
  getScreenState?: (id: string) => any;
  formProvider: ConnectedForm<any, any>;
  schemaSource: DenimSchemaSource<any>;
  dataSource: DenimDataSource<any, any>;
  dataContext: any;
  path: string;
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
}) => {
  const [internalState, setInternalState] = useState<any>({});
  const state =
    typeof passedState === 'undefined' ? internalState : passedState;
  const setState =
    typeof setPassedState === 'undefined' ? setInternalState : setPassedState;
  const PreComponent = schema.preContent || (() => null);
  const PostComponent = schema.postContent || (() => null);
  const { Provider, Context } = formProvider;
  const {
    componentRegistry: { button: DenimButton },
  } = useDenimForm();
  const data = useContext(Context);
  const history = useHistory();
  const route = useParams<any>();
  const { user } = useDenimUser();
  const mobile = isMobile();

  const readContextVariable = (variable: DenimApplicationContextVariable) => {
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
    }

    return variable;
  };

  const writeContextVariable = (
    variable: DenimApplicationContextVariable,
    newValue: any,
  ) => {
    if (typeof variable === 'object') {
      if ('$route' in variable) {
        const newRoute = {
          ...route,
          [variable.$route]: newValue,
        };
        const newPath = Object.keys(newRoute).reduce((path, key) => {
          return path.replace(':' + key, newRoute[key]);
        }, path);

        history.push(newPath);
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

  const renderScreen = () => {
    if (schema.type === 'page') {
      return (
        <View style={{ flexDirection: schema.flowDirection }}>
          {schema.children.map((row, r) => (
            <View
              style={{
                flexDirection:
                  schema.flowDirection === 'row' ? 'column' : 'row',
                flex: row.relativeWidth,
                marginLeft:
                  r > 0 && schema.flowDirection === 'row' ? 16 : undefined,
                marginTop:
                  r > 0 && schema.flowDirection === 'column' ? 16 : undefined,
              }}
              key={`${schema.id}-row-${r}`}
            >
              {row.children.map((column, c) => (
                <View
                  style={{
                    flex: column.relativeWidth,
                    marginLeft:
                      c > 0 && schema.flowDirection === 'column'
                        ? 16
                        : undefined,
                    marginTop:
                      c > 0 && schema.flowDirection === 'row' ? 16 : undefined,
                  }}
                  key={column.screen.id}
                >
                  <DenimScreen
                    schema={column.screen}
                    state={state}
                    onStateChange={setState}
                    formProvider={formProvider}
                    schemaSource={schemaSource}
                    dataSource={dataSource}
                    dataContext={dataContext}
                    path={path}
                    routerSchema={routerSchema}
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

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
      const query = schema.filter ? readContextVariable(schema.filter) : null;

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
            renderActions={
              schema.actions
                ? (record: DenimRecord) => {
                    if (schema.actions) {
                      return (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
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
                                >
                                  <svg
                                    width="20"
                                    height="19"
                                    viewBox="0 0 20 19"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      fill-rule="evenodd"
                                      clip-rule="evenodd"
                                      d="M5.00002 3.16667H8.33335L9.16669 3.95834H11.6667V5.54167H1.66669V3.95834H4.16669L5.00002 3.16667ZM4.16669 15.8333C3.25002 15.8333 2.50002 15.1208 2.50002 14.25V6.33334H10.8334V14.25C10.8334 15.1208 10.0834 15.8333 9.16669 15.8333H4.16669ZM18.3334 6.33334H12.5V7.91667H18.3334V6.33334ZM15.8334 12.6667H12.5V14.25H15.8334V12.6667ZM12.5 9.5H17.5V11.0833H12.5V9.5ZM4.16669 7.91667H9.16669V14.25H4.16669V7.91667Z"
                                      fill="black"
                                      fill-opacity="0.54"
                                    />
                                  </svg>
                                </a>
                              );
                            }

                            if (action.type === 'view') {
                              if ('screen' in action) {
                                const screen = routerSchema.screens.find(
                                  ({ id }) => id === action.screen,
                                );

                                if (screen) {
                                  const path = screen.paths[0].replace(
                                    ':' + (action.routeParameter || 'id'),
                                    String(record.id),
                                  );

                                  return (
                                    <Link to={path}>
                                      <svg
                                        width="20"
                                        height="19"
                                        viewBox="0 0 20 19"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          fill-rule="evenodd"
                                          clip-rule="evenodd"
                                          d="M15.3073 2.60458L17.2573 4.45708C17.5823 4.76583 17.5823 5.26458 17.2573 5.57333L15.7323 7.02208L12.6073 4.05333L14.1323 2.60458C14.2906 2.45417 14.499 2.375 14.7156 2.375C14.9323 2.375 15.1406 2.44625 15.3073 2.60458ZM2.49896 13.6563V16.625H5.62396L14.8406 7.86918L11.7156 4.90043L2.49896 13.6563ZM4.9323 15.0417H4.16563V14.3133L11.7156 7.14083L12.4823 7.86916L4.9323 15.0417Z"
                                          fill="black"
                                          fill-opacity="0.54"
                                        />
                                      </svg>
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
              writeContextVariable(schema.record, record.id);
            }
          }}
        />
      );
    }

    return null;
  };

  return (
    <Provider
      schemaSource={schemaSource}
      dataSource={dataSource}
      context={dataContext}
    >
      <PreComponent />
      {renderScreen()}
      <PostComponent />
    </Provider>
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
