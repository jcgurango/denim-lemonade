import React from 'react';
import { ReactChild } from 'react';
import { FunctionComponent } from 'react';
import { View } from 'react-native';
import { DenimRecord } from 'denim';
import { DenimView } from '../../forms';
import {
  DenimApplicationContext,
  useDenimApplication,
} from '../DenimApplicationV2';
import DenimApplicationViewProvider, {
  DenimApplicationViewProviderProps,
} from './DenimApplicationViewProvider';

export interface DenimApplicationViewProps
  extends DenimApplicationViewProviderProps {
  id?: string;
  actions?: ReactChild;
}

const ActionsContainer: FunctionComponent<{
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

const DenimApplicationView: FunctionComponent<DenimApplicationViewProps> = ({
  id,
  actions,
  table,
  columns,
  ...props
}) => {
  return (
    <DenimApplicationViewProvider {...props} table={table} columns={columns}>
      <DenimView
        schema={{
          id: id || `denim-view-${table}`,
          columns,
        }}
        renderActions={
          actions
            ? (record) => (
                <ActionsContainer record={record}>{actions}</ActionsContainer>
              )
            : undefined
        }
      />
    </DenimApplicationViewProvider>
  );
};

export default DenimApplicationView;
