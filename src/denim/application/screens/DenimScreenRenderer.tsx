import React, { FunctionComponent, useContext, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { Link, useHistory } from 'react-router-dom';
import { DenimQueryConditionOrGroup, DenimRecord, isMobile } from '../../core';
import { DenimIcon, useDenimUser } from '../../forms';
import DenimTabControl from '../../forms/controls/DenimTabControl';
import { useDenimForm } from '../../forms/providers/DenimFormProvider';
import { useDenimNotifications } from '../../forms/providers/DenimNotificationProvider';
import { useDenimData } from '../providers/DenimApplicationDataContextProvider';
import {
  DenimApplicationContextVariable,
  DenimRouterComponentSchema,
} from '../types/router';

export interface DenimScreenRendererProps {
  schema: DenimRouterComponentSchema;
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

const DenimScreenRenderer: FunctionComponent<DenimScreenRendererProps> = ({
  schema,
}) => {
  const renderChildSchema = (component: DenimRouterComponentSchema) => {
    return <DenimScreenRenderer schema={component} />;
  };

  const {
    state,
    setState,
    readContextVariable,
    writeContextVariable,
    buildScreenPathFromParams,
    formProvider,
    dataContext,
    path,
    auth
  } = useDenimData();

  const PreComponent = schema.preContent || (() => null);
  const PostComponent = schema.postContent || (() => null);
  const {
    componentRegistry: { button: DenimButton, control: DenimFormControl },
  } = useDenimForm();
  const history = useHistory();
  const { roles } = useDenimUser();
  const mobile = isMobile();
  const data = useContext(formProvider.Context);

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
          : // eslint-disable-next-line react-hooks/rules-of-hooks
            useMemo(
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
          const readonly =
            auth &&
            !auth.authorizeField(
              table,
              controlSchema.id,
              roles,
              data.currentRecord,
            );
          const newSchema = data.getControlFor(
            tableSchema,
            column,
            controlSchema,
          );

          if (newSchema) {
            controlSchema = newSchema;

            if (readonly) {
              controlSchema.controlProps = {
                ...(controlSchema.controlProps || {}),
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

export default DenimScreenRenderer;

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
