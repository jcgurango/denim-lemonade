import { Router } from 'express';
import { DenimDataSourceV2Router } from 'denim-express';
import consumerDataSource from '../data-sources/consumer';
import appSchemaSource from '../data-sources/app-schema';

const consumerRouter = Router();

export const refreshConsumerRouter = async () => {
  console.log('Refreshing consumer router...');
  consumerRouter.stack.splice(0, consumerRouter.stack.length);
  const dataSource = await consumerDataSource(appSchemaSource);

  consumerRouter.use('/', DenimDataSourceV2Router(dataSource));
};

export default consumerRouter;
