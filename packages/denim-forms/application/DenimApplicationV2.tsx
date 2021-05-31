import React, {
  ComponentType,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { FunctionComponent } from 'react';
import { BrowserRouter, useHistory } from 'react-router-dom';
import {
  DenimQuery,
  DenimQueryOperator,
  DenimRecord,
  DenimRelatedRecord,
  DenimTable,
  DenimDataSourceV2,
} from 'denim';
import styled from 'styled-components';
import { useDenimUserV2 } from '../forms';
import DenimLookupDataProvider from '../forms/providers/DenimLookupDataProvider';
import DenimApplicationNotifications from './DenimApplicationNotifications';

const Container = styled.div`
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

export interface DenimApplicationV2Props {
  dataSource: DenimDataSourceV2;
  containerStyle?: any;
  ContainerComponent?: ComponentType<{
    style: React.CSSProperties;
  }>;
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
  navigate: (url: string) => void;
}

export const DenimApplicationContext =
  createContext<DenimApplicationContextProps>({
    roles: [],
    navigate: () => {},
  });
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
        denimQuery
      );

      return records.map(
        (record) =>
          ({
            type: 'record',
            id: String(record.id),
            name: String(record[nameField]),
            record,
          } as DenimRelatedRecord)
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

const RoutesWrapper: FunctionComponent<{}> = ({ children }) => {
  const application = useDenimApplication();
  const history = useHistory();

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        navigate: (url: string) => {
          if (url !== history.location.pathname) {
            history.push(url);
          }
        },
      }}
    >
      {children}
    </DenimApplicationContext.Provider>
  );
};

const DenimApplicationV2: FunctionComponent<DenimApplicationV2Props> = ({
  dataSource,
  children,
  containerStyle,
  ContainerComponent,
}) => {
  const PageContainer = ContainerComponent || Container;

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
        navigate: () => {},
      }}
    >
      <DenimApplicationNotifications>
        <DenimLookupDataProvider {...lookup}>
          <PageContainer style={containerStyle}>
            <BrowserRouter>
              <RoutesWrapper>{children}</RoutesWrapper>
            </BrowserRouter>
          </PageContainer>
        </DenimLookupDataProvider>
      </DenimApplicationNotifications>
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationV2;
