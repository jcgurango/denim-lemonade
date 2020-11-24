import React, { createContext, FunctionComponent, useContext } from 'react';

const TranslationContext = createContext({
  translate: (id: string) => `[no_translation_service ${id}]`,
});

export const useTranslation = () => useContext(TranslationContext);

interface Translation {
  [key: string]: string;
}

interface TranslationProviderProps {
  translations: Translation;
}

const TranslationProvider: FunctionComponent<TranslationProviderProps> = ({
  translations,
  children,
}) => {
  const translate = (id: string) => {
    if (translations[id]) {
      return translations[id];
    }

    return `[missing_translation ${id}]`;
  };

  return (
    <TranslationContext.Provider value={{ translate }}>
      {children}
    </TranslationContext.Provider>
  );
};

export default TranslationProvider;
