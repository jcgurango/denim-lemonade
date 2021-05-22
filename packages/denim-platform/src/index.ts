import express from 'express';
import path from 'path';
import { DenimJsonDataSource, DenimColumnType } from 'denim';
import { DenimDataSourceV2Router } from 'denim-express';

const port = process.env.PORT || 3000;
const app = express();

const appSchemaSource = new DenimJsonDataSource('app-schema', {
  tables: [
    {
      id: 'roles',
      name: 'roles',
      label: 'Roles',
      nameField: 'name',
      columns: [
        {
          name: 'name',
          type: DenimColumnType.Text,
          label: 'Role Name',
          properties: {},
        },
      ],
    },
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
        {
          name: 'roles',
          type: DenimColumnType.ForeignKey,
          label: 'Allowed Roles',
          properties: {
            foreignTableId: 'roles',
            multiple: true,
          },
        },
      ],
    },
  ],
});

app.use('/app-schema', DenimDataSourceV2Router(appSchemaSource));

(async () => {
  await appSchemaSource.initialize();

  app.listen(port, () => {
    console.log(`DENIM platform running on port ${port}...`);
  });
})();
