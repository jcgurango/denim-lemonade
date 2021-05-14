import React, { createContext, FunctionComponent, useContext } from 'react';
import { DenimRecord, DenimSortExpression, DenimTable } from '../../core';

export interface DenimViewDataContextProps {
  schema: DenimTable;
  records: DenimRecord[];
  hasMore: boolean;
  retrieving: boolean;
  retrieveMore: () => Promise<void>;
  sort?: DenimSortExpression;
  setSort: (sort?: DenimSortExpression) => void;
  refresh: () => void,
}

const DenimViewDataContext = createContext<DenimViewDataContextProps>({
  schema: {
    id: '',
    name: '',
    nameField: '',
    label: '',
    columns: [],
  },
  records: [],
  hasMore: false,
  retrieving: false,
  retrieveMore: async () => {},
  setSort: () => {},
  refresh: () => {},
});

export const useDenimViewData = () => useContext(DenimViewDataContext);

const DenimViewDataProvider: FunctionComponent<
  Partial<DenimViewDataContextProps>
> = ({ children, ...contextProps }) => {
  const parentContext = useDenimViewData();

  return (
    <DenimViewDataContext.Provider
      value={{ ...parentContext, ...contextProps }}
    >
      {children}
    </DenimViewDataContext.Provider>
  );
};

export default DenimViewDataProvider;
