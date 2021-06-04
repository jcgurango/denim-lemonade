import React, {
  FunctionComponent,
  useContext,
  createContext,
  useCallback,
} from 'react';
import { DenimQueryOperator, DenimFormControlType, DenimTable } from 'denim';
import {
  DenimApplicationButton,
  DenimApplicationField,
  DenimApplicationFilter,
  DenimApplicationForm,
  DenimApplicationLayout,
  DenimApplicationView,
  DenimScreenV2,
  useDenimApplication,
  useDenimForm,
} from 'denim-forms';
import ConsumerSchemaProvider, {
  useConsumerSchema,
} from '../providers/ConsumerSchemaProvider';
import { FromConsumer } from '../App';
import DynamicValue, { DynamicValueProvider } from '../components/DynamicValue';
import { useMemoizedAdditionalFormFields } from '../components/screen/FormProvider';
import styled from 'styled-components';
import { CardStyle } from '../styles';
import { useEffect } from 'react';

const AppSchemaContext = createContext<{
  usersTable: DenimTable;
  usernameColumn: string;
  passwordColumn: string;
}>({
  usersTable: {} as any,
  usernameColumn: {} as any,
  passwordColumn: {} as any,
});

const TableAccessContainer = styled.div`
  ${CardStyle}
  padding: 1em;
`;

export const useAppSchema = () => useContext(AppSchemaContext);

const ViewActions: FunctionComponent<{
  prefix: string;
}> = ({ prefix }) => {
  const application = useDenimApplication();

  return (
    <>
      <DenimApplicationButton
        text="Edit"
        action={{
          link: `/${prefix}/${application.record?.id}`,
        }}
        icon="pencil"
        iconOnly
      />
      <DenimApplicationButton
        text="Delete"
        action="deleteRecord"
        icon="delete"
        iconOnly
      />
    </>
  );
};

export const InnerAppSchema: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const consumerSchema = useConsumerSchema();

  const usersTable = consumerSchema.tables.find(
    ({ id }) => id === application.record?.['users-table']
  );

  const fields = useMemoizedAdditionalFormFields(
    usersTable,
    useCallback(
      (column) =>
        `application.user && application.user[${JSON.stringify(column)}]`,
      []
    ),
    false,
    'User Data'
  );

  if (usersTable) {
    return (
      <DynamicValueProvider values={fields}>{children}</DynamicValueProvider>
    );
  }

  return <>{children}</>;
};

export const AppSchemaFieldsProvider: FunctionComponent<{}> = ({
  children,
}) => {
  return (
    <DenimApplicationForm
      table="app-setup"
      record={{
        conditionType: 'single',
        field: 'id',
        operator: DenimQueryOperator.DoesNotEqual,
        value: '',
      }}
      showSave={false}
    >
      <InnerAppSchema>{children}</InnerAppSchema>
    </DenimApplicationForm>
  );
};

const FormContent: FunctionComponent<{
  showForm?: boolean;
}> = ({ children, showForm }) => {
  const consumerSchema = useConsumerSchema();
  const application = useDenimApplication();

  const usersTable = consumerSchema.tables.find(
    ({ id }) => id === application.record?.['users-table']
  );

  const columnOptions =
    usersTable?.columns.map((column) => ({
      label: column.label,
      value: column.name,
    })) || [];

  return (
    <DenimApplicationLayout
      content={[
        ...(showForm
          ? [
              <DenimApplicationField
                schema={{
                  id: 'users-table',
                  type: DenimFormControlType.DropDown,
                  controlProps: {
                    options: consumerSchema.tables.map((table) => ({
                      label: table.label,
                      value: table.id,
                    })),
                  },
                }}
              />,
              <DenimApplicationField
                schema={{
                  id: 'username-column',
                  type: DenimFormControlType.DropDown,
                  controlProps: {
                    options: columnOptions,
                  },
                }}
              />,
              <DenimApplicationField
                schema={{
                  id: 'password-column',
                  type: DenimFormControlType.DropDown,
                  controlProps: {
                    options: columnOptions,
                  },
                }}
              />,
              <DenimApplicationButton action="saveRecord" text="Save" />,
            ]
          : []),
        <>
          {usersTable &&
          application.record?.['username-column'] &&
          application.record?.['password-column'] ? (
            <AppSchemaContext.Provider
              value={{
                usersTable,
                usernameColumn: String(application.record?.['username-column']),
                passwordColumn: String(application.record?.['password-column']),
              }}
            >
              {children}
            </AppSchemaContext.Provider>
          ) : (
            <div>
              Before you can create roles and users, you'll have to set the
              users table, username column, and password column. (See "App
              Settings")
            </div>
          )}
        </>,
      ]}
    />
  );
};

const Guard: FunctionComponent<{
  showForm?: boolean;
}> = ({ children, showForm }) => {
  return (
    <DenimApplicationForm
      table="app-setup"
      record={{
        conditionType: 'single',
        field: 'id',
        operator: DenimQueryOperator.DoesNotEqual,
        value: '',
      }}
      showSave={false}
    >
      <FormContent showForm={showForm}>{children}</FormContent>
    </DenimApplicationForm>
  );
};

const TableAccess: FunctionComponent<{
  table?: string;
  value: any;
  onChange: (newValue: any) => void;
  onRemove?: () => any;
}> = ({ table, value, onChange, onRemove = () => {} }) => {
  const consumerSchema = useConsumerSchema();
  const tableSchema = consumerSchema.tables.find(({ id }) => id === table);
  const actions = [
    {
      id: 'readAction',
      label: 'Read',
    },
    {
      id: 'createAction',
      label: 'Create',
    },
    {
      id: 'updateAction',
      label: 'Update',
    },
    {
      id: 'deleteAction',
      label: 'Delete',
    },
  ];

  return (
    <TableAccessContainer>
      <DenimApplicationLayout
        content={[
          <h3>{tableSchema?.label || 'Default'}</h3>,
          ...actions.map((action) => {
            const actionValue = value[action.id];

            return (
              <DenimApplicationLayout
                key={action.id}
                flowDirection="row"
                content={[
                  <DenimApplicationField
                    schema={{
                      id: action.id,
                      label: action.label,
                      type: DenimFormControlType.DropDown,
                      controlProps: {
                        options: [
                          {
                            label: 'Allow',
                            value: 'allow',
                          },
                          {
                            label: 'Block',
                            value: 'block',
                          },
                          ...(table
                            ? [
                                {
                                  label: 'Custom',
                                  value: 'custom',
                                },
                              ]
                            : []),
                        ],
                      },
                    }}
                    value={
                      typeof actionValue === 'string' || !actionValue
                        ? actionValue
                        : 'custom'
                    }
                    onChange={(newValue) => {
                      if (newValue === 'custom') {
                        onChange({
                          ...value,
                          [action.id]: {},
                        });
                      } else {
                        onChange({
                          ...value,
                          [action.id]: newValue,
                        });
                      }
                    }}
                  />,
                  ...(typeof actionValue === 'string' || !actionValue
                    ? []
                    : [
                        <DenimApplicationLayout
                          content={[
                            <DenimApplicationField
                              schema={{
                                id: 'allowedFields',
                                type: DenimFormControlType.MultiDropDown,
                                label: 'Allowed Fields',
                                controlProps: {
                                  options:
                                    tableSchema?.columns.map((column) => ({
                                      value: column.name,
                                      label: column.label,
                                    })) || [],
                                },
                              }}
                              value={actionValue.allowedFields}
                              onChange={(fields) => {
                                onChange({
                                  ...value,
                                  [action.id]: {
                                    ...value[action.id],
                                    allowedFields: fields,
                                  },
                                });
                              }}
                            />,
                            <DynamicValueProvider
                              values={
                                table
                                  ? [
                                      {
                                        code: 'return staticQuery;',
                                        label: 'Query',
                                        arguments: [],
                                        type: `condition-${
                                          table || 'no-table'
                                        }`,
                                        tag: table,
                                      },
                                    ]
                                  : []
                              }
                            >
                              <DynamicValue
                                label="Access Query"
                                propKey="query"
                                schema={actionValue}
                                onSchemaChange={(change: any) => {
                                  if (typeof change === 'function') {
                                    return onChange({
                                      ...value,
                                      [action.id]: change(actionValue),
                                    });
                                  }

                                  return onChange(change);
                                }}
                                types={[`condition-${table || 'no-table'}`]}
                              />
                            </DynamicValueProvider>,
                          ]}
                        />,
                      ]),
                ]}
              />
            );
          }),
          ...(table
            ? [
                <DenimApplicationButton
                  type="danger"
                  text="Remove"
                  action={{
                    callback: onRemove,
                  }}
                />,
              ]
            : []),
        ]}
      />
    </TableAccessContainer>
  );
};

const RoleSchema: FunctionComponent<{}> = () => {
  const form = useDenimForm();
  const appSchema = useAppSchema();
  const consumerSchema = useConsumerSchema();
  const tablesSchema = JSON.parse(form.getValue('tablesSchema') || '[]');
  const setTablesSchema = (value: any) =>
    form.setValue('tablesSchema')(JSON.stringify(value));
  const defaultSchema = JSON.parse(form.getValue('defaultSchema') || '{ }');

  useEffect(() => {
    if (!form.getValue('defaultSchema')) {
      form.setValue('defaultSchema')(
        JSON.stringify({
          readAction: 'block',
          createAction: 'block',
          updateAction: 'block',
          deleteAction: 'block',
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.getValue('defaultSchema')]);

  return (
    <DenimApplicationLayout
      content={[
        <h3>Role Query</h3>,
        <DenimApplicationFilter
          table={appSchema.usersTable.id}
          onChange={(query) => {
            form.setValue('query')(JSON.stringify(query));
          }}
          value={JSON.parse(
            form.getValue('query') ||
              JSON.stringify({
                conditionType: 'group',
                type: 'AND',
                conditions: [],
              })
          )}
          noApply
        />,
        <h3>Access</h3>,
        <TableAccess
          value={defaultSchema}
          onChange={(newValue) => {
            form.setValue('defaultSchema')(JSON.stringify(newValue));
          }}
        />,
        ...tablesSchema.map((schema: any) => (
          <TableAccess
            key={schema.table}
            table={schema.table}
            value={schema}
            onChange={(newSchema) => {
              setTablesSchema(
                tablesSchema.map((table: any) => {
                  if (table.table === newSchema.table) {
                    return newSchema;
                  }

                  return table;
                })
              );
            }}
            onRemove={() => {
              setTablesSchema(
                tablesSchema.filter((table: any) => {
                  return table.table !== schema.table;
                })
              );
            }}
          />
        )),
        <DenimApplicationField
          schema={{
            id: 'add-table',
            label: 'Add Table Access',
            type: DenimFormControlType.DropDown,
            controlProps: {
              options: consumerSchema.tables.map((table) => ({
                label: table.label,
                value: table.id,
              })),
            },
          }}
          value=""
          onChange={(table) => {
            if (!tablesSchema.find(({ table: t }: any) => t === table)) {
              setTablesSchema(
                tablesSchema.concat({
                  table: table,
                  readAction: 'allow',
                  createAction: 'allow',
                  updateAction: 'allow',
                  deleteAction: 'allow',
                })
              );
            }
          }}
        />,
      ]}
    />
  );
};

const RoleForm: FunctionComponent<{}> = () => {
  const application = useDenimApplication();

  return (
    <DenimApplicationForm
      table="roles"
      record={application.routeParameters?.id}
      onSave={(record) => {
        application.navigate(`/role/${record.id}`);
      }}
    >
      <DenimApplicationLayout
        content={[
          <DenimApplicationField schema={{ id: 'name' }} />,
          <FromConsumer>
            <ConsumerSchemaProvider>
              <RoleSchema />
            </ConsumerSchemaProvider>
          </FromConsumer>,
        ]}
      />
    </DenimApplicationForm>
  );
};

const UserForm: FunctionComponent<{}> = () => {
  const application = useDenimApplication();
  const schema = useAppSchema();

  return (
    <DenimApplicationForm
      table={schema.usersTable.name}
      record={application.routeParameters?.id}
      onSave={(record) => {
        application.navigate(`/user/${record.id}`);
      }}
    >
      <DenimApplicationLayout
        content={[
          <DenimApplicationLayout
            flowDirection="row"
            content={[
              <DenimApplicationField
                schema={{
                  id: schema.usernameColumn,
                }}
              />,
              <DenimApplicationField
                schema={{
                  id: schema.passwordColumn,
                  controlProps: {
                    secureTextEntry: true,
                  },
                }}
              />,
            ]}
          />,
          ...schema.usersTable.columns
            .filter(
              (column) =>
                column.name !== schema.usernameColumn &&
                column.name !== schema.passwordColumn
            )
            .map((column) => (
              <DenimApplicationField
                schema={{
                  id: column.name,
                }}
              />
            )),
        ]}
      />
    </DenimApplicationForm>
  );
};

const Users: FunctionComponent<{}> = () => {
  const schema = useAppSchema();

  return (
    <DenimApplicationLayout
      content={[
        <DenimApplicationView
          table={schema.usersTable.name}
          columns={[
            'id',
            schema.usernameColumn,
            ...schema.usersTable.columns
              .filter(
                (column) =>
                  column.name !== schema.usernameColumn &&
                  column.name !== schema.passwordColumn
              )
              .map((column) => column.name),
          ]}
          actions={<ViewActions prefix="user" />}
        />,
        <DenimApplicationButton
          text="Add New User"
          action={{
            link: `/user`,
          }}
        />,
      ]}
    />
  );
};

const Roles: FunctionComponent<{}> = () => {
  return (
    <ConsumerSchemaProvider>
      <DenimScreenV2 id="roles" paths={['/roles']}>
        <Guard>
          <DenimApplicationLayout
            content={[
              <DenimApplicationView
                table="roles"
                columns={['name']}
                actions={<ViewActions prefix="role" />}
              />,
              <DenimApplicationButton
                text="Add New Role"
                action={{
                  link: `/role`,
                }}
              />,
            ]}
          />
        </Guard>
      </DenimScreenV2>
      <DenimScreenV2 id="roles" paths={['/role', '/role/:id']}>
        <Guard>
          <AppSchemaFieldsProvider>
            <RoleForm />
          </AppSchemaFieldsProvider>
        </Guard>
      </DenimScreenV2>
      <DenimScreenV2 id="users" paths={['/users']}>
        <Guard>
          <Users />
        </Guard>
      </DenimScreenV2>
      <DenimScreenV2 id="users" paths={['/user', '/user/:id']}>
        <Guard>
          <UserForm />
        </Guard>
      </DenimScreenV2>
      <DenimScreenV2 id="app-settings" paths={['/settings']}>
        <Guard showForm />
      </DenimScreenV2>
    </ConsumerSchemaProvider>
  );
};

export default Roles;
