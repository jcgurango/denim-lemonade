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

const validation = Yup.object({
  test: Yup.string().required(),
  test3: Yup.string().required().oneOf(['test1', 'test2']).nullable(true),
});

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
        <DenimLookupDataProvider
          lookup={async () => ([
            {
              type: 'record',
              id: 'test1',
              name: 'test',
            },
            {
              type: 'record',
              id: 'test2',
              name: 'test 2',
            },
            {
              type: 'record',
              id: 'test3',
              name: 'test 3',
            },
            {
              type: 'record',
              id: 'test4',
              name: 'test 4',
            },
          ])}
        >
          <TranslationProvider
            translations={{
              'Forms.test-form.Sections.test-section': 'Test Section',
            }}
          >
            <DenimFormProvider
              getValue={(field) => value[field]}
              setValue={(field) => (newValue) =>
                setValue((current: any) => ({
                  ...current,
                  [field]: newValue,
                }))}
              getErrorsFor={(field) =>
                errors.filter((error) => {
                  return (
                    error.path === field || error.path.startsWith(field + '.')
                  );
                })
              }
            >
              <DenimForm
                schema={{
                  id: 'test-form',
                  sections: [
                    {
                      id: 'test-section',
                      showLabel: true,
                      collapsible: true,
                      defaultOpen: true,
                      rows: [
                        {
                          id: 'row0',
                          controls: [
                            {
                              id: 'test',
                              label: 'Test Long Text',
                              type: DenimFormControlType.MultilineTextInput,
                              relativeWidth: 1,
                            },
                          ],
                        },
                        {
                          id: 'row1',
                          controls: [
                            {
                              id: 'test1',
                              label: 'Test Short Text',
                              type: DenimFormControlType.TextInput,
                              relativeWidth: 1,
                            },
                            {
                              id: 'test2',
                              label: 'Test Short Text',
                              type: DenimFormControlType.TextInput,
                              relativeWidth: 2,
                            },
                          ],
                        },
                        {
                          id: 'row2',
                          controls: [
                            {
                              id: 'test3',
                              label: 'Test Dropdown',
                              type: DenimFormControlType.DropDown,
                              relativeWidth: 1,
                              controlProps: {
                                options: [
                                  {
                                    value: 'test1',
                                    label: 'Test 1',
                                  },
                                  {
                                    value: 'test2',
                                    label: 'Test 2',
                                  },
                                  {
                                    value: 'test3',
                                    label: 'Test 3',
                                  },
                                ],
                              },
                            },
                            {
                              id: 'test4',
                              label: 'Test Multi Dropdown',
                              type: DenimFormControlType.MultiDropDown,
                              relativeWidth: 1,
                              controlProps: {
                                options: [
                                  {
                                    value: 'test1',
                                    label: 'Test 1',
                                  },
                                  {
                                    value: 'test2',
                                    label: 'Test 2',
                                  },
                                  {
                                    value: 'test3',
                                    label: 'Test 3',
                                  },
                                ],
                              },
                            },
                            {
                              id: 'test6',
                              label: 'Test Readonly',
                              type: DenimFormControlType.ReadOnly,
                              relativeWidth: 1,
                              controlProps: {
                                value: 'HELLLO!!!!!!!',
                              },
                            },
                          ],
                        },
                        {
                          id: 'row3',
                          controls: [
                            {
                              id: 'test5',
                              label: 'Test Checkbox',
                              type: DenimFormControlType.CheckBox,
                              relativeWidth: 1,
                            },
                            {
                              id: 'test7',
                              label: 'Test Lookup',
                              type: DenimFormControlType.Lookup,
                              relativeWidth: 1,
                              controlProps: {
                                relationship: 'test',
                              },
                            },
                            {
                              id: 'test8',
                              label: 'Test Multi Lookup',
                              type: DenimFormControlType.MultiLookup,
                              relativeWidth: 1,
                              controlProps: {
                                relationship: 'test',
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                }}
              />
            </DenimFormProvider>
          </TranslationProvider>
        </DenimLookupDataProvider>
      </SafeAreaView>
    </>
  );
};

export default App;
