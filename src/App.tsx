import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import {
  DenimForm,
  DenimFormProvider,
  TranslationProvider,
} from './denim/forms';
import { DenimFormControlType } from './denim/core';
import * as Yup from 'yup';
import { ValidationError } from 'yup';
import DenimLookupDataProvider from './denim/forms/providers/DenimLookupDataProvider';
import { createConnectedDataProvider } from './denim/forms/providers/DenimConnectedDataProvider';
import AirTableSchemaSource from './denim/connectors/airtable/AirTableSchemaSource';
import { DenimSchemaSource } from './denim/service';
import TestDataSource from './TestDataSource';

const validation = Yup.object({
  test: Yup.string().required(),
  test3: Yup.string().required().oneOf(['test1', 'test2']).nullable(true),
});

const schemaSource = new AirTableSchemaSource<{}>(
  require('./schema/airtable-schema.json'),
);

const dataSource = new TestDataSource(schemaSource);

const { Provider, Form } = createConnectedDataProvider<
  {},
  DenimSchemaSource<{}>
>();

const App = () => {
  const [value, setValue] = useState<any>({});
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await validation.validate(value, {
          abortEarly: false,
        });
        setErrors([]);
      } catch (e) {
        if (e.inner) {
          setErrors(e.inner);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [value]);

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
            table="Test Record CRUD"
            record="recMxGdKQY6HHadtc"
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
        </Provider>
      </SafeAreaView>
    </>
  );
};

export default App;
