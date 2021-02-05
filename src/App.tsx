import React from 'react';
import copyToClipboard from 'copy-to-clipboard';
import { createConnectedFormProvider } from './denim/forms/providers/DenimConnectedFormProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource } from './denim/service';
import DenimRemoteDataSource from './denim/service/DenimRemoteDataSource';
import {
  DenimFormProvider,
  DenimUserProvider,
  useDenimUser,
} from './denim/forms';
import DenimApplication from './denim/application';
import { DenimFormSchema } from './denim/core';
import LemonadeValidations from './validation';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import config from './config.json';
import { useDenimNotifications } from './denim/forms/providers/DenimNotificationProvider';
import { useDenimForm } from './denim/forms/providers/DenimFormProvider';
import { Link } from 'react-router-dom';
import LemonadeButton from './components/LemonadeButton';
import {
  LemonadeCell,
  LemonadeHeaderCell,
  LemonadeHeaderRow,
  LemonadeRow,
} from './components/LemonadeView';
import LemonadeFormControl from './components/LemonadeFormControl';

const schemaSource = new AirTableSchemaSource<{}>(
  require('./schema/airtable-schema.json'),
);

LemonadeValidations(schemaSource);

const dataSource = new DenimRemoteDataSource(
  schemaSource,
  config.serverUrl + '/data',
);

const field = (id: string): {
  id: string,
  component: {
    id: string,
    type: 'field',
    paths: [],
    field: {
      id: string,
    },
  },
} => ({
  id,
  component: {
    id,
    type: 'field',
    paths: [],
    field: {
      id,
    },
  },
});

const employeePersonalSection = {
  id: 'personal-section',
  label: 'Personal',
  showLabel: true,
  rows: [
    {
      id: 'row0',
      controls: [
        {
          label: 'Employee ID',
          id: 'Employee ID',
          relativeWidth: 1,
        },
        {
          label: 'Full Name',
          id: 'Full Name',
          relativeWidth: 4,
        },
      ],
    },
    {
      id: 'row1',
      controls: [
        {
          label: 'Title',
          id: 'Title',
          relativeWidth: 1,
        },
        {
          label: 'Last Name',
          id: 'Last Name',
          relativeWidth: 1,
        },
        {
          label: 'First Name',
          id: 'First Name',
          relativeWidth: 1,
        },
        {
          label: 'Middle Name',
          id: 'Middle Name',
          relativeWidth: 1,
        },
        {
          label: 'Nickname',
          id: 'Nickname',
          relativeWidth: 1,
        },
      ],
    },
    {
      id: 'row2',
      controls: [
        {
          label: 'Gender',
          id: 'Gender',
          relativeWidth: 1,
        },
        {
          label: 'Marital Status',
          id: 'Marital Status',
          relativeWidth: 1,
        },
        {
          label: 'Date of Birth',
          id: 'Date of Birth',
          relativeWidth: 3,
        },
      ],
    },
    {
      id: 'row3',
      controls: [
        {
          label: 'Email',
          id: 'Email',
          relativeWidth: 2,
        },
        {
          label: 'LinkedIn Account',
          id: 'LinkedIn Account',
          relativeWidth: 3,
        },
      ],
    },
    {
      id: 'row4',
      controls: [
        {
          label: 'Address 1',
          id: 'Address 1',
          relativeWidth: 5,
        },
      ],
    },
    {
      id: 'row5',
      controls: [
        {
          label: 'Address 2',
          id: 'Address 2',
          relativeWidth: 5,
        },
      ],
    },
    {
      id: 'row6',
      controls: [
        {
          label: 'Address 3',
          id: 'Address 3',
          relativeWidth: 5,
        },
      ],
    },
    {
      id: 'row7',
      controls: [
        {
          label: 'City',
          id: 'City',
          relativeWidth: 1,
        },
        {
          label: 'State/Province',
          id: 'State/Province',
          relativeWidth: 1,
        },
        {
          label: 'Zip',
          id: 'Zip',
          relativeWidth: 1,
        },
        {
          label: 'Country',
          id: 'Country',
          relativeWidth: 2,
        },
      ],
    },
    {
      id: 'row8',
      controls: [
        {
          label: 'Home Number',
          id: 'Home Number',
          relativeWidth: 2,
        },
        {
          label: 'Mobile Number',
          id: 'Mobile Number',
          relativeWidth: 3,
        },
      ],
    },
    {
      id: 'row9',
      controls: [
        {
          label: 'Contact Person',
          id: 'Contact Person',
          relativeWidth: 2,
        },
        {
          label: 'Relation to Contact Person',
          id: 'Relation to Contact Person',
          relativeWidth: 2,
        },
        {
          label: 'Contact Person Mobile No',
          id: 'Contact Person Mobile No',
          relativeWidth: 1,
        },
      ],
    },
  ],
};

const employeeEmploymentSection = {
  id: 'job-section',
  label: 'Employment',
  showLabel: true,
  rows: [
    {
      id: 'row0',
      controls: [
        {
          label: 'Account Status',
          id: 'Account Status',
          relativeWidth: 1,
        },
        {
          label: 'Entry Date',
          id: 'Entry Date',
          relativeWidth: 1,
        },
        {
          label: 'Exit Date',
          id: 'Exit Date',
          relativeWidth: 1,
        },
        {
          label: 'Daily Work Hours',
          id: 'Daily Work Hours',
          relativeWidth: 1,
        },
        {
          label: 'Leave Scheme',
          id: 'Leave Scheme',
          relativeWidth: 1,
          controlProps: {
            dropdown: true,
          },
        },
      ],
    },
    {
      id: 'row1',
      controls: [
        {
          label: 'Base',
          id: 'Base',
          relativeWidth: 1,
        },
        {
          label: 'Department',
          id: 'Department',
          relativeWidth: 1,
        },
        {
          label: 'Department Supervisor',
          id: 'Department Supervisor',
          relativeWidth: 1,
        },
        {
          label: 'Member Type',
          id: 'Member Type',
          relativeWidth: 1,
        },
        {
          label: 'Direct Manager',
          id: 'Direct Manager',
          relativeWidth: 1,
        },
      ],
    },
    {
      id: 'row2',
      controls: [
        {
          label: 'Job Title',
          id: 'Job Title',
          relativeWidth: 1,
          controlProps: {
            dropdown: true,
          },
        },
        {
          label: 'Job Position',
          id: 'Job Positions',
          relativeWidth: 1,
          controlProps: {
            dropdown: true,
          },
        },
        {
          label: 'Job Role',
          id: 'Job Roles',
          relativeWidth: 3,
          controlProps: {
            dropdown: true,
          },
        },
      ],
    },
    {
      id: 'row3',
      controls: [
        {
          label: 'Language',
          id: 'Language',
          relativeWidth: 1,
        },
        {
          label: 'Skills',
          id: 'Skills',
          relativeWidth: 4,
        },
      ],
    },
  ],
};

const employeeCompensationSection = {
  id: 'payroll-section',
  label: 'Compensation and Benefits',
  showLabel: true,
  rows: [
    {
      id: 'row0',
      controls: [
        {
          label: 'Payroll ID',
          id: 'Payroll ID',
          relativeWidth: 2,
        },
        {
          label: 'Employee Wage',
          id: 'Employee Wage',
          relativeWidth: 3,
        },
      ],
    },
    {
      id: 'row1',
      controls: [
        {
          label: 'Employee Allowance',
          id: 'Employee Allowance',
          relativeWidth: 1,
          controlProps: {
            dropdown: true,
          },
        },
      ],
    },
  ],
};

const employeeForm: DenimFormSchema = {
  id: 'Employee-Form',
  sections: [
    employeePersonalSection,
    employeeEmploymentSection,
    employeeCompensationSection,
  ],
};

const connectedFormProvider = createConnectedFormProvider<
  {},
  DenimSchemaSource<{}>
>();

const App = () => {
  const form = useDenimForm();
  const user = useDenimUser();

  return (
    <DenimFormProvider
      componentRegistry={{
        ...form.componentRegistry,
        button: LemonadeButton,
        viewHeaderRow: LemonadeHeaderRow,
        viewHeaderCell: LemonadeHeaderCell,
        viewRow: LemonadeRow,
        viewCell: LemonadeCell,
        control: LemonadeFormControl,
      }}
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
        router={{
          screens: [
            {
              id: 'employees',
              paths: ['/'],
              type: 'layout',
              flowDirection: 'column',
              children: [
                {
                  id: 'top-bar',
                  component: {
                    id: 'top-bar',
                    type: 'layout',
                    paths: [],
                    flowDirection: 'row',
                    children: [
                      {
                        id: 'logo',
                        relativeWidth: 2,
                        component: {
                          id: 'lemonade-logo',
                          paths: [],
                          type: 'content',
                          content: (
                            <img
                              src={require('./assets/images/logo.jpg').default}
                              alt="Lemonade HR"
                              style={{ width: '180px' }}
                            />
                          ),
                        },
                      },
                      {
                        id: 'filter',
                        relativeWidth: 3,
                        component: {
                          id: 'employee-filter',
                          paths: [],
                          table: 'Employee',
                          type: 'filter',
                          filterColumns: [
                            'Employee ID',
                            'Last Name',
                            'First Name',
                            'Payroll ID',
                          ],
                          globalSearchColumns: [
                            'Employee ID',
                            'Last Name',
                            'First Name',
                            'Job Title',
                          ],
                          filter: {
                            $screen: 'filter',
                          },
                        },
                      },
                      {
                        id: 'create',
                        relativeWidth: 1,
                        component: {
                          id: 'create',
                          paths: [],
                          type: 'content',
                          content: () => {
                            const {
                              componentRegistry: { button: DenimButton },
                            } = useDenimForm();

                            return (
                              <Link
                                to="/employee"
                                style={{ textDecoration: 'none' }}
                              >
                                <DenimButton text="Create" onPress={() => {}} />
                              </Link>
                            );
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  id: 'grid',
                  relativeWidth: 1,
                  component: {
                    id: 'employee-list',
                    paths: [],
                    type: 'view',
                    table: 'Employee',
                    form: 'employee',
                    view: {
                      id: 'employee-view',
                      columns: [
                        'Employee ID',
                        'Last Name',
                        'First Name',
                        'Full Name',
                        'Account Status',
                        'Job Title',
                      ],
                    },
                    filter: {
                      $screen: 'filter',
                    },
                    actions: [
                      {
                        type: 'view',
                        screen: 'employee',
                      },
                      {
                        type: 'delete',
                      },
                    ],
                  },
                },
              ],
              roles: ['hr'],
            },
            {
              id: 'employee-self',
              paths: ['/'],
              type: 'form',
              table: 'Employee',
              record: {
                $user: 'id',
              },
              form: employeeForm,
              roles: ['employee'],
            },
            {
              id: 'employee',
              paths: ['/employee/:id', '/employee'],
              type: 'form-provider',
              roles: ['hr'],
              table: 'Employee',
              record: {
                $route: 'id',
              },
              component: {
                id: 'employee',
                paths: [],
                type: 'layout',
                roles: ['hr'],
                flowDirection: 'column',
                children: [
                  {
                    id: 'copy-click',
                    component: {
                      id: 'copy-click',
                      paths: [],
                      type: 'content',
                      content: () => {
                        const url = 'https://airtable.com/shrMs1b9PvJW0F6D0';
                        const notifications = useDenimNotifications();
  
                        const copy = (
                          e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                        ) => {
                          e.stopPropagation();
                          e.preventDefault();
  
                          copyToClipboard(url);
                          notifications.notify({
                            type: 'success',
                            message: 'Link copied to clipboard.',
                            code: 1003,
                          });
                        };
  
                        return Platform.OS === 'web' ? (
                          <a
                            href={url}
                            target="_blank"
                            onClick={copy}
                            style={{
                              textAlign: 'center',
                              fontFamily: 'Open Sans',
                              fontSize: 18,
                              textDecoration: 'none',
                              color: '#555555',
                            }}
                          >
                            💡 Click this to get the link off Employee Information
                            Form
                          </a>
                        ) : (
                          <View
                            style={{
                              padding: 12,
                              paddingTop: 0,
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            <TouchableOpacity>
                              <Text>
                                💡 Click this to get the link off Employee
                                Information Form
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      },
                    },
                  },
                  {
                    id: 'form',
                    component: {
                      id: 'form',
                      type: 'layout',
                      paths: [],
                      flowDirection: 'row',
                      children: [
                        {
                          id: 'left-side',
                          relativeWidth: 1,
                          component: {
                            id: 'left-side',
                            paths: [],
                            type: 'layout',
                            flowDirection: 'column',
                            children: [
                              {
                                id: 'lemonade-logo',
                                component: {
                                  id: 'lemonade-logo',
                                  paths: [],
                                  type: 'content',
                                  content: (
                                    <Link to="/" style={{ textAlign: 'center' }}>
                                      <img
                                        src={
                                          require('./assets/images/logo.jpg')
                                            .default
                                        }
                                        alt="Lemonade HR"
                                        style={{ width: '180px' }}
                                      />
                                    </Link>
                                  ),
                                },
                              },
                              {
                                id: 'mini-details',
                                component: {
                                  id: 'employee-form',
                                  paths: ['/employee/:id', '/employee'],
                                  type: 'layout',
                                  flowDirection: 'column',
                                  children: [
                                    field('Full Name'),
                                    field('Job Title'),
                                    field('Department'),
                                    field('Entry Date'),
                                    field('Mobile Number'),
                                    field('Email'),
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          id: 'main-form',
                          relativeWidth: 4,
                          component: {
                            id: 'employee-form-tabs',
                            paths: [],
                            type: 'tabs',
                            tabIndex: {
                              $screen: 'tab',
                            },
                            tabs: [
                              {
                                label: 'Personal',
                                component: {
                                  id: 'employee-personal',
                                  type: 'form',
                                  table: 'Employee',
                                  paths: [],
                                  form: {
                                    id: 'employee-personal',
                                    sections: [employeePersonalSection],
                                  },
                                },
                              },
                              {
                                label: 'Employment',
                                component: {
                                  id: 'employee-employment',
                                  type: 'form',
                                  table: 'Employee',
                                  paths: [],
                                  form: {
                                    id: 'employee-employment',
                                    sections: [employeeEmploymentSection],
                                  },
                                },
                              },
                              {
                                label: 'Compensation & Benefits',
                                component: {
                                  id: 'employee-compensation',
                                  type: 'form',
                                  table: 'Employee',
                                  paths: [],
                                  form: {
                                    id: 'employee-compensation',
                                    sections: [employeeCompensationSection],
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        }}
        menu={{
          menuItems: [
            {
              screen: 'employees',
              id: 'employees',
              type: 'screen',
              label: 'Employees',
              roles: ['hr'],
            },
            {
              screen: 'employee',
              id: 'employee',
              type: 'screen',
              label: 'New Employee',
              roles: ['hr'],
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

export default () => {
  if (window.location.pathname === '/loading') {
    return <ActivityIndicator />;
  }

  return (
    <DenimUserProvider authUrl={config.serverUrl + '/auth'}>
      <App />
    </DenimUserProvider>
  );
};
