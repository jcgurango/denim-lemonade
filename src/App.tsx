import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import DenimFormProvider from './forms/providers/DenimFormProvider';
import TranslationProvider from './forms/providers/TranslationProvider';
import { DenimForm } from './forms';
import { DenimFormControlType } from './core';
import * as Yup from 'yup';
import { ValidationError } from 'yup';

const validation = Yup.object({
  test: Yup.string().required(),
});

const App = () => {
  const [value, setValue] = useState<any>({ });
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
        <TranslationProvider
          translations={{
            'Forms.test-form.Sections.test-section': 'Test Section',
          }}
        >
          <DenimFormProvider
            getValue={(field) => value[field]}
            setValue={(field) => (newValue) => setValue((current: any) => ({
              ...current,
              [field]: newValue,
            }))}
            getErrorsFor={(field) => errors.filter((error) => {
              return error.path === field || error.path.startsWith(field + '.');
            })}
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
                            label: 'Test Label',
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
                            label: 'Test Label',
                            type: DenimFormControlType.TextInput,
                            relativeWidth: 1,
                          },
                          {
                            id: 'test2',
                            label: 'Test Label',
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
                            label: 'Test Label',
                            type: DenimFormControlType.TextInput,
                            relativeWidth: 1,
                          },
                          {
                            id: 'test4',
                            label: 'Test Label',
                            type: DenimFormControlType.TextInput,
                            relativeWidth: 1,
                          },
                          {
                            id: 'test5',
                            label: 'Test Label',
                            type: DenimFormControlType.TextInput,
                            relativeWidth: 1,
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
      </SafeAreaView>
    </>
  );
};

export default App;
