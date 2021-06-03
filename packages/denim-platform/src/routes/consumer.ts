import { Router } from 'express';
import {
  DenimAuthenticationRouter,
  DenimAuthenticationRouterProvider,
  DenimAuthenticatorMiddleware,
  DenimDataSourceV2Router,
  DenimDbAuthProvider,
} from 'denim-express';
import { DenimCombinedDataSourceV2 } from 'denim';
import randomString from 'random-string';
import consumerDataSource from '../data-sources/consumer';
import appSchemaSource from '../data-sources/app-schema';
import { registerUserHooks } from './app-schema';

const consumerRouter = Router();

export const refreshConsumerRouter = async () => {
  console.log('Refreshing consumer router...');
  consumerRouter.stack.splice(0, consumerRouter.stack.length);
  const {
    dataSource,
    authenticator,
    usersTableName,
    usernameColumn,
    passwordColumn,
  } = await consumerDataSource(appSchemaSource);

  const frontendDataSource = new DenimCombinedDataSourceV2(dataSource);
  registerUserHooks(usersTableName, passwordColumn, frontendDataSource);

  if (usersTableName && authenticator) {
    const authProviders: DenimAuthenticationRouterProvider[] = [];

    if (usersTableName && usernameColumn && passwordColumn) {
      authProviders.push(
        new DenimDbAuthProvider(
          dataSource,
          usersTableName,
          usernameColumn,
          passwordColumn
        )
      );
    }

    const { router, middleware } = DenimAuthenticationRouter(
      {
        tokenSecret: randomString({ length: 32 }),
      },
      usersTableName,
      dataSource,
      authenticator,
      ...authProviders
    );

    consumerRouter.use('/auth', router);
    consumerRouter.use(
      middleware,
      DenimAuthenticatorMiddleware(frontendDataSource, authenticator)
    );
  }

  consumerRouter.use(DenimDataSourceV2Router(frontendDataSource));
};

export default consumerRouter;
