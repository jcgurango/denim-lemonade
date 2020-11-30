import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { createConnectedDataProvider } from './denim/forms/providers/DenimConnectedDataProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource, DenimValidator } from './denim/service';
import TestDataSource from './TestDataSource';
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
            record="recRcikjjU1emtvAo"
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
                          label: 'Full Name',
                          id: 'First Name',
                          relativeWidth: 1,
                        },
                      ],
                    },
                    {
                      id: 'row1',
                      controls: [
                        {
                          id: 'Date of Birth',
                          relativeWidth: 1,
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
