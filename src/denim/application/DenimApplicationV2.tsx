import React, { createContext, useContext } from 'react';
import { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DenimRecord, DenimTable } from '../core';
import { useDenimUserV2 } from '../forms';
import { DenimDataSourceV2 } from '../service';
import DenimApplicationNotifications from './DenimApplicationNotifications';

export interface DenimApplicationV2Props {
  dataSource: DenimDataSourceV2;
}

export interface DenimApplicationContextProps {
  dataSource?: DenimDataSourceV2;
  tableSchema?: DenimTable;
  record?: DenimRecord;
  screenId?: string;
  route?: string;
  user?: DenimRecord;
  routeParameters?: {
    [key: string]: any;
  };
  roles: string[];
}

export const DenimApplicationContext = createContext<DenimApplicationContextProps>(
  {
    roles: [],
  },
);
export const useDenimApplication = () => useContext(DenimApplicationContext);

const DenimApplicationV2: FunctionComponent<DenimApplicationV2Props> = ({
  dataSource,
  children,
}) => {
  const user = useDenimUserV2();

  return (
    <DenimApplicationContext.Provider
      value={{
        dataSource,
        user: user.user,
        roles: user.roles,
      }}
    >
      <DenimApplicationNotifications>
        <main
          style={{
            padding: '16px',
            width: '100%',
            boxSizing: 'border-box',
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <BrowserRouter>{children}</BrowserRouter>
        </main>
      </DenimApplicationNotifications>
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationV2;
