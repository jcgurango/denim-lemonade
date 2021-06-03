import React from 'react';
import { createContext, useContext, useState, useEffect, FunctionComponent } from 'react';
import { DenimSchema } from 'denim';
import { getSchema } from '../App';

const ConsumerSchemaContext = createContext<DenimSchema>({
  tables: [],
});

export const useConsumerSchema = () => useContext(ConsumerSchemaContext);

const ConsumerSchemaProvider: FunctionComponent<{}> = ({
  children,
}) => {
  const [schema, setSchema] = useState<DenimSchema>({
    tables: [],
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const schema = await getSchema();

      if (!cancelled) {
        setSchema(schema);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
  
  return (
    <ConsumerSchemaContext.Provider value={schema}>
      {children}
    </ConsumerSchemaContext.Provider>
  );
};

export default ConsumerSchemaProvider;
