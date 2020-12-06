import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { createConnectedDataProvider } from './denim/forms/providers/DenimConnectedDataProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource, DenimValidator } from './denim/service';
import DenimRemoteDataSource from './denim/service/DenimRemoteDataSource';

class TestSchemaSource extends AirTableSchemaSource<{}> {
  createValidator(table: string): DenimValidator<{}> {
    const validator = super.createValidator(table);

    validator.registerValidationHook(
      'Test Record CRUD',
      (context, table, column, validation) => {
        if (column?.name === 'Name') {
          return [
            ...validation.filter(([func]) => func !== 'yup.nullable'),
            ['yup.required'],
          ];
        }

        return validation;
      },
    );

    return validator;
  }
}

const schemaSource = new TestSchemaSource(
  require('./schema/airtable-schema.json'),
);

const dataSource = new DenimRemoteDataSource(schemaSource, 'http://localhost:9090/data');

const { Provider, Form } = createConnectedDataProvider<
  {},
  DenimSchemaSource<{}>
>();

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <Provider
          context={{}}
          schemaSource={schemaSource}
          dataSource={dataSource}
        >
          <Form 
            table="Employee"
            record="recowFaLyXtlu13w4"
            schema={{
              id: 'Employee-Form',
              sections: [
                {
                  id: 'personal-section',
                  label: 'Personal Information',
                  showLabel: true,
                  collapsible: true,
                  defaultOpen: true,
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
                  ],
                },
                {
                  id: 'contact-section',
                  label: 'Contact Information',
                  showLabel: true,
                  collapsible: true,
                  defaultOpen: false,
                  rows: [
                    {
                      id: 'row0',
                      controls: [
                        {
                          label: 'Address 1',
                          id: 'Address 1',
                          relativeWidth: 5,
                        },                                             
                      ],
                    },
                    {
                      id: 'row1',
                      controls: [
                        {
                          label: 'Address 2',
                          id: 'Address 2',
                          relativeWidth: 5,
                        },                        
                      ],
                    },
                    {
                      id: 'row2',
                      controls: [
                        {
                          label: 'Address 3',
                          id: 'Address 3',
                          relativeWidth: 5,
                        },                        
                      ],
                    },
                    {
                      id: 'row3',
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
                      id: 'row4',
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
                      id: 'row5',
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
                },
                {
                  id: 'job-section',
                  label: 'Job Information',
                  showLabel: true,
                  collapsible: true,
                  defaultOpen: false,
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
                        },
                        {
                          label: 'Job Position',
                          id: 'Job Positions',
                          relativeWidth: 1,
                        },
                        {
                          label: 'Job Role',
                          id: 'Job Roles',
                          relativeWidth: 3,
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
                },
                {
                  id: 'payroll-section',
                  label: 'Payroll Information',
                  showLabel: true,
                  collapsible: true,
                  defaultOpen: false,
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
                          relativeWidth: 5,
                        },                      
                      ],
                    },
                  ],
                },
                {
                  id: 'link-section',
                  label: 'Link Attachment',
                  showLabel: true,
                  collapsible: true,
                  defaultOpen: false,
                  rows: [
                    {
                      id: 'row0',
                      controls: [
                        {
                          label: 'Curriculum Vitae',
                          id: 'Curriculum Vitae',
                          relativeWidth: 5,
                        },                    
                      ],
                    },
                    {
                      id: 'row1',
                      controls: [
                        {
                          label: 'Dependents',
                          id: 'Dependents',
                          relativeWidth: 5,
                        },                      
                      ],
                    },
                    {
                      id: 'row2',
                      controls: [
                        {
                          label: 'Job History',
                          id: 'Job History',
                          relativeWidth: 5,
                        },                                              
                      ],
                    },
                    {
                      id: 'row3',
                      controls: [
                        {
                          label: 'Attachments',
                          id: 'Attachments',
                          relativeWidth: 5,
                        },                                             
                      ],
                    },
                  ],
                },
              ],
            }}
          />
        </Provider>
      </SafeAreaView>
    </>
  );
};

export default App;

