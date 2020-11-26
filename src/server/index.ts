import express from 'express';
import Airtable from 'airtable';
import { AirTableDataSource } from '../denim/connectors/airtable';
import DenimDataSourceRouter from '../denim/express/DenimDataSourceRouter';
import AirTableSchemaSource from '../denim/connectors/airtable/AirTableSchemaSource';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyAhv3IWg6qeJRZb',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const cors = require('cors');
const schema = new AirTableSchemaSource<{}>(require('../schema/airtable-schema.json'));
schema.registerDefaultView('Test Record CRUD', 'Grid 2');
const data = new AirTableDataSource(schema, 'appDvEQrTWmwWIKlG');
app.use('/data', cors(), DenimDataSourceRouter(data));

app.listen(9090, () => console.log('Listening...'));
