import React from 'react';
import { useState, useEffect } from 'react';
import { DenimRemoteDataSourceV2 } from 'denim';
import {
  DenimApplicationV2,
} from 'denim-forms';
import './App.css';
import Connections from './screens/Connections';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || '/app-schema';
const dataSource = new DenimRemoteDataSourceV2(apiBaseUrl);

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await dataSource.retrieveSchema();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <DenimApplicationV2 dataSource={dataSource}>
      <Connections />
    </DenimApplicationV2>
  );
}

export default App;
