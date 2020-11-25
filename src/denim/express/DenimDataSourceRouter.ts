import { Router } from 'express';
import { DenimDataSource, DenimSchemaSource } from '../service';
import DenimTableRouter from './DenimTableRouter';
import dashify from 'dashify';
import { DenimDataContext } from '../core';

const DenimDataSourceRouter = <T extends DenimDataContext, S extends DenimSchemaSource<T>>(dataSource: DenimDataSource<T, S>) => {
  const router = Router();

  dataSource.schemaSource.schema.tables.forEach((table) => {
    router.use('/' + dashify(table.name), DenimTableRouter(dataSource.createDataProvider(table.id)));
  });

  router.get('/schema', (req, res) => {
    res.json({
      ...dataSource.schemaSource.schema,
      tables: dataSource.schemaSource.schema.tables.map((table) => ({
        ...table,
        endpoint: '/' + dashify(table.name),
      })),
    });
  });

  return router;
};

export default DenimDataSourceRouter;
