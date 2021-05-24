import React from 'react';
import { FunctionComponent } from 'react';
import { View } from 'react-native';
import { DenimRecord } from 'denim';
import { useDenimViewData } from '../../forms';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';
import DenimApplicationViewProvider, {
  DenimApplicationViewProviderProps,
} from './DenimApplicationViewProvider';

const ItemContainer: FunctionComponent<{
  record: DenimRecord;
}> = ({ record, children }) => {
  const application = useDenimApplication();

  return (
    <DenimApplicationContext.Provider
      value={{
        ...application,
        record,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {children}
      </View>
    </DenimApplicationContext.Provider>
  );
};

const ItemsContainer: FunctionComponent<{}> = ({ children }) => {
  const view = useDenimViewData();

  return (
    <>
      {view.records.map((record) => (
        <ItemContainer record={record} key={record.id || ''}>
          {children}
        </ItemContainer>
      ))}
    </>
  );
};

const DenimApplicationRepeater: FunctionComponent<DenimApplicationViewProviderProps> =
  ({ table, columns, children, ...props }) => {
    return (
      <DenimApplicationViewProvider {...props} table={table} columns={columns}>
        <ItemsContainer>{children}</ItemsContainer>
      </DenimApplicationViewProvider>
    );
  };

export default DenimApplicationRepeater;
