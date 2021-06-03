import React from 'react';
import { useState, useEffect } from 'react';
import {
  DenimApplicationAuthenticationProvider,
  DenimApplicationV2,
  DenimScreenV2,
} from 'denim-forms';
import './App.css';
import { applicationSchema } from './schema';
import ScreenRenderer from './components/ScreenRenderer';
import { dataSource } from './Data';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await dataSource.retrieveSchema();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <DenimApplicationV2 dataSource={dataSource}>
      <DenimApplicationAuthenticationProvider
        authUrl={
          (process.env.REACT_APP_API_BASE_URL ||
            `${window.location.origin}/consumer`) + '/auth'
        }
      >
        {applicationSchema.screens.map((screen: any) => {
          return (
            <DenimScreenV2
              id={screen.id}
              key={screen.id}
              paths={screen.paths || []}
              allowedRoles={
                screen.roles?.records?.map(({ id }: any) => id) || []
              }
            >
              <ScreenRenderer components={screen.schema} />
            </DenimScreenV2>
          );
        })}
      </DenimApplicationAuthenticationProvider>
    </DenimApplicationV2>
  );
}

export default App;
