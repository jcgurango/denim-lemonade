import React, { createContext, FunctionComponent, useContext } from 'react';
import { DenimRelatedRecord } from '../../core';

interface DenimLookupDataProps {
  lookup: (relationship: string, query: string) => Promise<DenimRelatedRecord[]>;
  find: (relationship: string, id: string) => Promise<DenimRelatedRecord | null>;
}

const DenimLookupDataContext = createContext<DenimLookupDataProps>({
  lookup: async () => [],
  find: async () => null,
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
