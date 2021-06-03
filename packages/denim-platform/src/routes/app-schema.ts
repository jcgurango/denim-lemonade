import { Router } from 'express';
import { DenimDataSourceV2Router } from 'denim-express';
import { DenimCombinedDataSourceV2 } from 'denim';
import bcrypt from 'bcrypt';
import consumerDataSource from '../data-sources/consumer';
import appSchemaSource from '../data-sources/app-schema';

const appSchemaRouter = Router();

export const registerUserHooks = (usersTableName: string | undefined, passwordColumn: string | undefined, combinedSource: DenimCombinedDataSourceV2) => {
  if (usersTableName && passwordColumn) {
    combinedSource.registerHook({
      type: 'post-retrieve-record',
      table: usersTableName,
      callback: async (table, id, expansion, record) => {
        return [
          id,
          expansion,
          {
            ...record,
            [passwordColumn]: undefined,
          },
        ];
      },
    });

    combinedSource.registerHook({
      type: 'post-retrieve-records',
      table: usersTableName,
      callback: async (table, query, records) => {
        return [
          query,
          records.map((record) => ({
            ...record,
            [passwordColumn]: undefined,
          })),
        ];
      },
    });

    combinedSource.registerHook({
      type: 'pre-create',
      table: usersTableName,
      callback: async (table, record) => {
        const password = record[passwordColumn];

        if (typeof (password) === 'string') {
          const hashedPassword = await bcrypt.hash(password, 10);
          record[passwordColumn] = hashedPassword;
        }

        return [record];
      },
    });

    combinedSource.registerHook({
      type: 'pre-update',
      table: usersTableName,
      callback: async (table, id, record) => {
        const password = record[passwordColumn];

        if (typeof (password) === 'string') {
          const hashedPassword = await bcrypt.hash(password, 10);
          record[passwordColumn] = hashedPassword;
        }

        return [id, record];
      },
    });
  }
};

export const refreshAppSchemaRouter = async () => {
  console.log('Refreshing app router...');
  appSchemaRouter.stack.splice(0, appSchemaRouter.stack.length);
  const { dataSource, usersTableName, passwordColumn } =
    await consumerDataSource(appSchemaSource);
  const combinedSource = new DenimCombinedDataSourceV2(
    dataSource,
    appSchemaSource
  );

  registerUserHooks(usersTableName, passwordColumn, combinedSource);

  appSchemaRouter.use('/', DenimDataSourceV2Router(combinedSource));
};

export default appSchemaRouter;
