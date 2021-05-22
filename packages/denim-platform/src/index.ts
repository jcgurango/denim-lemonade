import express from 'express';
import path from 'path';
import { DenimJsonDataSource, DenimColumnType } from 'denim';
import { DenimDataSourceV2Router } from 'denim-express';

const port = process.env.PORT || 3000;
const app = express();

const appSchemaSource = new DenimJsonDataSource(
  'app-schema',
  {
    tables: [
      {
        id: 'screens',
        name: 'screens',
        label: 'Screens',
        nameField: 'name',
        columns: [
          {
            name: 'name',
            type: DenimColumnType.Text,
            label: 'Screen Name',
            properties: {},
          },
        ],
      },
    ],
  }
);

app.use('/app-schema', DenimDataSourceV2Router(appSchemaSource));

(async () => {
  await appSchemaSource.initialize();

  app.listen(port, () => {
    console.log(`DENIM platform running on port ${port}...`);
  });  
})();
