import React, { createContext, useContext, useMemo } from 'react';
import { FunctionComponent } from 'react';
import { BrowserRouter } from 'react-router-dom';
import {
  DenimQuery,
  DenimQueryOperator,
  DenimRecord,
  DenimRelatedRecord,
  DenimTable,
} from '../core';
import { useDenimUserV2 } from '../forms';
import DenimLookupDataProvider from '../forms/providers/DenimLookupDataProvider';
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

export const getLookupProviderFor = (dataSource: DenimDataSourceV2) => {
  return {
    lookup: async (relationship: string, query: string) => {
      const otherTable = relationship;
      const otherTableSchema = dataSource.getTable(otherTable);

      const nameField = otherTableSchema.nameField;
      const denimQuery: DenimQuery =
        query === '**||**'
          ? {
              expand: [],
              retrieveAll: true,
            }
          : {
              conditions: {
                conditionType: 'single',
                field: nameField,
                operator: DenimQueryOperator.Contains,
                value: query,
              },
              expand: [],
              pageSize: 10,
              page: 1,
            };

      const records = await dataSource.retrieveRecords(
        otherTableSchema.name,
        denimQuery,
      );

      return records.map(
        (record) =>
          ({
            type: 'record',
            id: String(record.id),
            name: String(record[nameField]),
            record,
          } as DenimRelatedRecord),
      );
    },
    find: async (relationship: string, id: string) => {
      const otherTable = relationship;
      const otherTableSchema = dataSource.getTable(otherTable);

      const nameField = otherTableSchema.nameField;

      const record = await dataSource.retrieveRecord(otherTableSchema.name, id);

      if (record) {
        return {
          type: 'record',
          id: String(record.id),
          name: String(record[nameField]),
          record,
        } as DenimRelatedRecord;
      }

      return null;
    },
  };
};

const DenimApplicationV2: FunctionComponent<DenimApplicationV2Props> = ({
  dataSource,
  children,
}) => {
  const user = useDenimUserV2();
  const lookup = useMemo(() => {
    return getLookupProviderFor(dataSource);
  }, [dataSource]);

  return (
    <DenimApplicationContext.Provider
      value={{
        dataSource,
        user: user.user,
        roles: user.roles,
      }}
    >
      <DenimApplicationNotifications>
        <DenimLookupDataProvider {...lookup}>
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
        </DenimLookupDataProvider>
      </DenimApplicationNotifications>
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationV2;
