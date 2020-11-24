import express from 'express';
import Airtable from 'airtable';
import DenimTableRouter from './DenimTableRouter';
import { AirTableDataSource } from '../denim/connectors/airtable';
import { EmptyValidator } from '../denim/core';

Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyAhv3IWg6qeJRZb',
  apiVersion: undefined,
  noRetryIfRateLimited: undefined,
});

const app = express();
const data = new AirTableDataSource(require('../schema/airtable-schema.json'), 'appDvEQrTWmwWIKlG');

app.use('/test', DenimTableRouter(data.createDataProvider('Test Record CRUD')));

app.listen(6000, () => console.log('Listening...'));
