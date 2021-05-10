import React, { createContext, useContext } from 'react';
import { FunctionComponent } from 'react';
import { DenimRecord, DenimTable } from '../core';
import { DenimDataSourceV2 } from '../service';

export interface DenimApplicationV2Props {
  dataSource: DenimDataSourceV2;
};

export interface DenimApplicationContextProps {
  dataSource?: DenimDataSourceV2;
  tableSchema?: DenimTable;
  record?: DenimRecord;
}

export const DenimApplicationContext = createContext<DenimApplicationContextProps>({ });
export const useDenimApplication = () => useContext(DenimApplicationContext);

const DenimApplicationV2: FunctionComponent<DenimApplicationV2Props> = ({
  dataSource,
  children,
}) => {
  return (
    <DenimApplicationContext.Provider value={{ dataSource }}>
      {children}
    </DenimApplicationContext.Provider>
  );
};

export default DenimApplicationV2;
