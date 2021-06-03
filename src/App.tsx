import React, { useMemo, useState } from 'react';
import { createConnectedFormProvider } from './denim/forms/providers/DenimConnectedFormProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource } from './denim/service';
import DenimRemoteDataSource from './denim/service/DenimRemoteDataSource';
import {
  DenimFormControl,
  DenimFormProvider,
  useDenimUser,
} from './denim/forms';
import DenimApplication, { DenimRouterSchema } from './denim/application';
import { DenimFormControlType, DenimQueryOperator } from './denim/core';
import LemonadeValidations from './validation';
import { ActivityIndicator } from 'react-native';
import DenimButton from './denim/forms/controls/DenimButton';

const schemaSource = new AirTableSchemaSource<{}>(
  require('./schema/airtable-schema.json').concat(
    require('./schema/airtable-movement-schema.json'),
  ),
);

LemonadeValidations(schemaSource);

const dataSource = new DenimRemoteDataSource(
  schemaSource,
  (process.env.REACT_APP_API_BASE || window.location.origin) + '/api/data',
);

const connectedFormProvider = createConnectedFormProvider<
  {},
  DenimSchemaSource<{}>
>();

const App = () => {
  const user = useDenimUser();

  const routerSchema = useMemo<DenimRouterSchema>(
    () => ({
      screens: [
        {
          id: 'customer-invoices',
          type: 'view',
          paths: ['/customers/:customer'],
          table: 'Invoices',
          view: {
            id: 'customer-invoices',
            columns: ['Description', 'Subtotal', 'Payable', 'Paid'],
          },
          actions: [
            {
              type: 'view',
              screen: 'customer-invoice',
              params: {
                invoice: {
                  $record: 'id',
                },
              },
              icon: 'list',
            },
          ],
          filter: {
            conditionType: 'single',
            field: 'Customer ID',
            operator: DenimQueryOperator.Equals,
            value: {
              $route: 'customer',
            },
          },
          defaultSort: {
            column: 'Paid',
            ascending: true,
          },
        },
        {
          id: 'customer-invoice',
          type: 'form-provider',
          paths: ['/invoices/:invoice'],
          table: 'Invoices',
          record: {
            $route: 'invoice',
          },
          component: {
            id: 'invoice-form-provider',
            type: 'layout',
            flowDirection: 'column',
            children: [
              {
                relativeWidth: 1,
                component: {
                  id: 'invoice-fields',
                  type: 'layout',
                  flowDirection: 'column',
                  children: [
                    {
                      component: {
                        id: 'Invoice Number',
                        type: 'field',
                        field: {
                          id: 'Invoice Number',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Description',
                        type: 'field',
                        field: {
                          id: 'Description',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'invoice-lines',
                        type: 'view',
                        table: 'Invoice Lines',
                        view: {
                          id: 'invoice-lines-view',
                          columns: ['Description', 'Unit Cost', 'Quantity', 'Subtotal'],
                        },
                        filter: {
                          conditionType: 'single',
                          field: 'Invoice',
                          operator: DenimQueryOperator.Equals,
                          value: {
                            $record: 'Invoice Number',
                          },
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Subtotal',
                        type: 'field',
                        field: {
                          id: 'Subtotal',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Payable',
                        type: 'field',
                        field: {
                          id: 'Payable',
                          label: 'Total Amount Payable',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'payment-area',
                        type: 'conditional',
                        condition: {
                          conditionType: 'single',
                          field: {
                            $record: 'Paid',
                          },
                          operator: DenimQueryOperator.Equals,
                          value: true,
                        },
                        trueComponent: {
                          id: 'thank-you',
                          type: 'content',
                          content: 'Thank you for your payment!',
                        },
                        falseComponent: {
                          id: 'pay-now',
                          type: 'button',
                          text: 'Pay Now',
                          buttonAction: 'code',
                          callback: async (context) => {
                            const recordId = context.readContextVariable({
                              $record: 'id',
                            });
                            const value = await fetch(
                              `http://denim-demo.denimtool.com:9090/pay/${recordId}`,
                            );
                            const { id } = await value.json();

                            const stripe = (window as any).Stripe(
                              'pk_test_eDZuWIuDkIZ6YUv8TfDWgvLM',
                            );
                            stripe.redirectToCheckout({
                              sessionId: id,
                            });
                          },
                        },
                      },
                    },
                    {
                      component: {
                        id: 'back',
                        type: 'button',
                        text: 'Back to Invoices',
                        buttonAction: 'screen',
                        screen: 'customer-invoices',
                        params: {
                          customer: {
                            $record: 'Customer',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          id: 'customers',
          type: 'view',
          paths: ['/'],
          table: 'Customers',
          view: {
            id: 'customers',
            columns: ['Name', 'Email', 'Address', 'Accounts Receivable'],
          },
          actions: [
            {
              type: 'view',
              screen: 'customer',
              icon: 'pencil',
              params: {
                customer: {
                  $record: 'id',
                },
              },
            },
            {
              type: 'view',
              screen: 'invoices',
              icon: 'list',
              params: {
                customer: {
                  $record: 'Customer ID',
                },
              },
            },
          ],
        },
        {
          id: 'invoices',
          paths: ['/customers/:customer/invoices'],
          type: 'layout',
          flowDirection: 'column',
          children: [
            {
              component: {
                id: 'invoices-view',
                type: 'view',
                table: 'Invoices',
                view: {
                  id: 'invoices',
                  columns: ['Description', 'Subtotal', 'Payable', 'Paid'],
                },
                actions: [
                  {
                    type: 'view',
                    screen: 'invoice',
                    params: {
                      invoice: {
                        $record: 'id',
                      },
                    },
                    icon: 'pencil',
                  },
                ],
                filter: {
                  conditionType: 'single',
                  field: 'Customer ID',
                  operator: DenimQueryOperator.Equals,
                  value: {
                    $route: 'customer',
                  },
                },
                defaultSort: {
                  column: 'Paid',
                  ascending: true,
                },
              },
            },
            {
              component: {
                id: 'back',
                type: 'button',
                text: 'Back to Customers',
                buttonAction: 'screen',
                screen: 'customers',
              },
            },
          ],
        },
        {
          id: 'invoice',
          type: 'form-provider',
          paths: ['/invoices/:invoice/edit', '/new/invoice'],
          table: 'Invoices',
          record: {
            $route: 'invoice',
          },
          showSave: true,
          saveRedirect: {
            screen: 'invoice',
            params: {
              invoice: {
                $record: 'id',
              },
            },
          },
          component: {
            id: 'invoice-form-provider-content',
            type: 'layout',
            flowDirection: 'column',
            children: [
              {
                relativeWidth: 1,
                component: {
                  id: 'invoice-fields',
                  type: 'layout',
                  flowDirection: 'column',
                  children: [
                    {
                      component: {
                        id: 'Customer',
                        type: 'field',
                        field: {
                          id: 'Customer',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Invoice Number',
                        type: 'field',
                        field: {
                          id: 'Invoice Number',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Description',
                        type: 'field',
                        field: {
                          id: 'Description',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'invoice-lines',
                        type: 'view',
                        table: 'Invoice Lines',
                        view: {
                          id: 'invoice-lines-view',
                          columns: ['Description', 'Unit Cost', 'Quantity', 'Subtotal'],
                        },
                        filter: {
                          conditionType: 'single',
                          field: 'Invoice',
                          operator: DenimQueryOperator.Equals,
                          value: {
                            $record: 'Invoice Number',
                          },
                        },
                        editable: true,
                        prefill: {
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Subtotal',
                        type: 'field',
                        field: {
                          id: 'Subtotal',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Payable',
                        type: 'field',
                        field: {
                          id: 'Payable',
                          label: 'Total Amount Payable',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'back',
                        type: 'button',
                        text: 'Back to Invoices',
                        buttonAction: 'screen',
                        screen: 'invoices',
                        params: {
                          customer: {
                            $record: 'Customer',
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          id: 'customer',
          type: 'form-provider',
          paths: ['/customers/:customer/edit'],
          table: 'Customers',
          record: {
            $route: 'customer',
          },
          showSave: true,
          component: {
            id: 'customer-form-provider-content',
            type: 'layout',
            flowDirection: 'column',
            children: [
              {
                relativeWidth: 1,
                component: {
                  id: 'customer-fields',
                  type: 'layout',
                  flowDirection: 'column',
                  children: [
                    {
                      component: {
                        id: 'Name',
                        type: 'field',
                        field: {
                          id: 'Name',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Email',
                        type: 'field',
                        field: {
                          id: 'Email',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Address',
                        type: 'field',
                        field: {
                          id: 'Address',
                          controlProps: {
                            multiline: true,
                          },
                        },
                      },
                    },
                    {
                      component: {
                        id: 'Accounts Receivable',
                        type: 'field',
                        field: {
                          id: 'Accounts Receivable',
                        },
                      },
                    },
                    {
                      component: {
                        id: 'back',
                        type: 'button',
                        text: 'Back to Customers',
                        buttonAction: 'screen',
                        screen: 'customers',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    }),
    [],
  );

  return (
    <DenimFormProvider
      styleOverrides={{
        formSection: {
          label: {
            fontSize: 22,
            fontFamily: 'Open Sans',
            fontWeight: 'bold',
            color: '#10AC84',
          },
        },
        tabControl: {
          container: {
            borderRadius: 12,
            overflow: 'hidden',
            borderColor: '#374056',
          },
          tabHeaderContainer: {
            backgroundColor: '#374056',
          },
          tabHeader: {
            backgroundColor: '#374056',
            padding: 22,
          },
          tabHeaderText: {
            fontSize: 22,
            fontFamily: 'Open Sans',
          },
          selectedTabHeader: {
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            paddingHorizontal: 44,
          },
          selectedTabHeaderText: {
            fontSize: 22,
            fontFamily: 'Open Sans',
            fontWeight: 'bold',
            color: '#10AC84',
          },
          contentContainer: {
            paddingHorizontal: 60,
            paddingVertical: 36,
          },
        },
      }}
    >
      <DenimApplication
        router={routerSchema}
        menu={{
          menuItems: [
            {
              screen: 'employees',
              id: 'employees',
              type: 'screen',
              label: 'Employees',
              roles: ['hr', 'hr-user'],
            },
            {
              screen: 'employee',
              id: 'employee',
              type: 'screen',
              label: 'New Employee',
              roles: ['hr', 'hr-user'],
            },
            {
              screen: 'employee-self',
              id: 'employee-self',
              type: 'screen',
              label: 'My 201',
              roles: ['employee'],
            },
          ],
        }}
        dataContext={{
          headers: {
            Authorization: 'Bearer ' + user.token,
          },
        }}
        formProvider={connectedFormProvider}
        schemaSource={schemaSource}
        dataSource={dataSource}
      />
    </DenimFormProvider>
  );
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div
      style={{
        width: '500px',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '20px',
        borderRadius: '4px',
        border: '1px solid rgb(200, 200, 200)',
        padding: '12px',
        fontFamily: 'Arial',
      }}
    >
      <DenimFormProvider
        setValue={(field) => {
          if (field === 'email') {
            return setUsername;
          }

          if (field === 'password') {
            return setPassword;
          }

          return () => {};
        }}
        getValue={(field) => {
          if (field === 'email') {
            return username;
          }

          if (field === 'password') {
            return password;
          }

          return null;
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '16px' }}>Login</div>
        <div style={{ marginTop: '10px' }}>
          <DenimFormControl
            schema={{
              id: 'email',
              label: 'Email',
              type: DenimFormControlType.TextInput,
              controlProps: {
                placeholder: 'my@email.com',
              },
            }}
          />
        </div>
        <div style={{ marginTop: '10px' }}>
          <DenimFormControl
            schema={{
              id: 'password',
              label: 'Password',
              type: DenimFormControlType.TextInput,
              controlProps: {
                placeholder: '••••••••••••',
                secureTextEntry: true,
              },
            }}
          />
        </div>
      </DenimFormProvider>
      <div style={{ marginTop: '10px' }}>
        <DenimButton text="Login" onPress={() => {}} />
      </div>
    </div>
  );
};

const Default = () => {
  if (window.location.pathname === '/loading') {
    return <ActivityIndicator />;
  }

  if (localStorage.getItem('unauthenticated')) {
    return <Login />;
  }

  return <App />;
};

export default Default;
