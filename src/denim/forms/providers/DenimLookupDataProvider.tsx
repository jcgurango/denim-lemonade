import React, { createContext, FunctionComponent, useContext } from 'react';
import { DenimRelatedRecord } from '../../core';

interface DenimLookupDataProps {
  lookup: (relationship: string, query: string) => Promise<DenimRelatedRecord[]>;
}

const DenimLookupDataContext = createContext<DenimLookupDataProps>({
  lookup: async () => []
});

export const useDenimLookupData = () => useContext(DenimLookupDataContext);

const DenimLookupDataProvider: FunctionComponent<DenimLookupDataProps> = ({
  children,
  ...props
}) => {
  return (
    <DenimLookupDataContext.Provider value={props}>
      {children}
    </DenimLookupDataContext.Provider>
  );
};

export default DenimLookupDataProvider;
