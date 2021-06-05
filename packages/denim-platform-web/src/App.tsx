import React, { FunctionComponent } from 'react';
import { useState, useEffect } from 'react';
import {
  DenimApplicationAuthenticationProvider,
  DenimApplicationV2,
  DenimScreenV2,
  useDenimApplication,
} from 'denim-forms';
import './App.css';
import numeral from 'numeral';
import { applicationSchema } from './schema';
import ScreenRenderer from './components/ScreenRenderer';
import { dataSource } from './Data';

(window as any).formatNumber = (number: any, format: string) => {
  return numeral(number).format(format);
};

const HeadersUpdater: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const [reload, setReload] = useState(false);

  useEffect(() => {
    if (application.token) {
      dataSource.headers = {
        Authorization: `Bearer ${application.token}`,
      };
    } else {
      dataSource.headers = {};
    }

    setReload(true);
  }, [application.token]);

  useEffect(() => {
    if (reload) {
      setReload(false);
    }
  }, [reload]);

  if (reload) {
    return null;
  }

  return <>{children}</>;
};

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

  const content = (
    <>
      {applicationSchema.screens.map((screen: any) => {
        return (
          <DenimScreenV2
            id={screen.id}
            key={screen.id}
            paths={screen.paths || []}
            allowedRoles={screen.roles?.records?.map(({ id }: any) => id) || []}
          >
            <ScreenRenderer components={screen.schema} />
          </DenimScreenV2>
        );
      })}
    </>
  );

  return (
    <DenimApplicationV2 dataSource={dataSource}>
      {applicationSchema.hasAuthentication ? (
        <DenimApplicationAuthenticationProvider
          authUrl={
            (process.env.REACT_APP_API_BASE_URL ||
              `${window.location.origin}/consumer`) + '/auth'
          }
        >
          <HeadersUpdater />
          {content}
        </DenimApplicationAuthenticationProvider>
      ) : (
        content
      )}
    </DenimApplicationV2>
  );
}

export default App;
