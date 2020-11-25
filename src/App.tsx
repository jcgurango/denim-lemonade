import React from 'react';
import { SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { createConnectedDataProvider } from './denim/forms/providers/DenimConnectedDataProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource, DenimValidator } from './denim/service';
import TestDataSource from './TestDataSource';

class TestSchemaSource extends AirTableSchemaSource<{}> {
  createValidator(table: string): DenimValidator<{}> {
    const validator = super.createValidator(table);

    validator.registerValidationHook(
      'Test Record CRUD',
      (context, table, column, validation) => {
        if (column?.name === 'Name') {
          const v: any = validation;
          return v.required();
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

const dataSource = new TestDataSource(schemaSource);

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
          <ScrollView>
            <Form
              table="Test Record CRUD"
              record=""
              schema={{
                id: 'test-form',
                sections: [
                  {
                    id: 'test-section',
                    label: 'Test Section',
                    showLabel: true,
                    collapsible: true,
                    defaultOpen: true,
                    rows: [
                      {
                        id: 'row0',
                        controls: [
                          {
                            id: 'Name',
                            relativeWidth: 1,
                          },
                        ],
                      },
                      {
                        id: 'row1',
                        controls: [
                          {
                            id: 'Notes',
                            relativeWidth: 1,
                          },
                        ],
                      },
                      {
                        id: 'row2',
                        controls: [
                          {
                            id: 'Status',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Multiple Select',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Checkbox',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Phone',
                            relativeWidth: 1,
                          },
                        ],
                      },
                      {
                        id: 'row3',
                        controls: [
                          {
                            id: 'Date',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Date Time',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Email',
                            relativeWidth: 1,
                          },
                          {
                            id: 'URL',
                            relativeWidth: 1,
                          },
                        ],
                      },
                      {
                        id: 'row4',
                        controls: [
                          {
                            id: 'Number',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Currency',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Percent',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Duration',
                            relativeWidth: 1,
                          },
                        ],
                      },
                      {
                        id: 'row5',
                        controls: [
                          {
                            id: 'Rating',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Calculation',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Single Link',
                            relativeWidth: 1,
                          },
                          {
                            id: 'Link',
                            relativeWidth: 1,
                          },
                        ],
                      },
                    ],
                  },
                ],
              }}
            />
          </ScrollView>
        </Provider>
      </SafeAreaView>
    </>
  );
};

export default App;
