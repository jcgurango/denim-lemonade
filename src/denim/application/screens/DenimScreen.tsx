import React, { useState } from 'react';
import { FunctionComponent } from 'react';
import DenimApplicationDataContextProvider from '../providers/DenimApplicationDataContextProvider';
import { DenimRouterComponentSchema } from '../types/router';
import DenimScreenRenderer from './DenimScreenRenderer';

interface DenimScreenProps {
  path: string;
  schema: DenimRouterComponentSchema;
}

const DenimScreen: FunctionComponent<DenimScreenProps> = ({
  path,
  schema,
}) => {
  const [state, setState] = useState({});

  return (
    <DenimApplicationDataContextProvider
      state={state}
      setState={(key, value) => {
        if (typeof(key) === 'function') {
          setState(key);
        } else {
          setState((variables) => ({
            ...variables,
            [key]: value,
          }));
        }
      }}
      path={path}
      schema={schema}
    >
      <DenimScreenRenderer
        schema={schema}
      />
    </DenimApplicationDataContextProvider>
  );
};

export default DenimScreen;
