import bodyParser from 'body-parser';
import dashify from 'dashify';
import { NextFunction, Request, Response, Router } from 'express';
import { DenimRecord } from '../core';
import { DenimAuthenticatorV2, DenimDataSourceV2 } from '../service';

export const getRolesFromRequest = (
  authenticator: DenimAuthenticatorV2,
  req: Request,
) => {
  const user = ((req as any).user as DenimRecord) || {};
  const roles = authenticator.getRolesFor(user);

  return roles;
};

export const DenimAuthenticatorTableMiddleware = (
  table: string,
  dataSource: DenimDataSourceV2,
  authenticator: DenimAuthenticatorV2,
) => {
  const router = Router();

  router.use((req, res, next) => {
    (req as any).authenticator = authenticator;
    (req as any).roles = getRolesFromRequest(authenticator, req);

    next();
  });

  const queryHandler = (req: Request, res: Response, next: NextFunction) => {
    const user = ((req as any).user as DenimRecord) || {};
    const roles = (req as any).roles;
    const action = authenticator.authorizeFromRoleNames(
      roles,
      'readAction',
      table,
    );

    try {
      req.body = authenticator.authorizeQuery(user, action, req.body);
    } catch (e) {
      return res.status(400).send({
        errors: [
          {
            message: e.message,
          },
        ],
      });
    }

    next();
  };

  router.get('/', queryHandler);
  router.post('/', bodyParser.json(), queryHandler);

  const updateHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const existingRecord = req.params.id
      ? await dataSource.retrieveRecord(table, req.params.id)
      : {};

    const filtered = authenticator.filterRecord(
      ((req as any).user as DenimRecord) || {},
      table,
      {
        ...existingRecord,
        ...req.body,
      },
      req.params.id ? 'updateAction' : 'createAction',
    );

    if (!filtered) {
      return res.status(400).json({
        errors: [
          {
            message: 'Unauthorized update.',
          },
        ],
      });
    }

    const newUpdate: DenimRecord = {};

    Object.keys(req.body).forEach((key) => {
      if (key in req.body && key in filtered) {
        newUpdate[key] = filtered[key];
      }
    });

    req.body = newUpdate;

    next();
  };

  router.put('/', bodyParser.json(), updateHandler);
  router.put('/:id', bodyParser.json(), updateHandler);

  router.delete('/:id', async (req, res, next) => {
    const user = ((req as any).user as DenimRecord) || {};
    const action = authenticator.authorize(user, 'deleteAction', table);

    if (action !== 'allow') {
      if (action === 'block') {
        return res.status(403).send({
          errors: [
            {
              message: 'Unauthorized query.',
            },
          ],
        });
      } else {
        const record = await dataSource.retrieveRecord(table, req.params.id);

        if (record) {
          const isAllowed = authenticator.filterRecord(
            user,
            table,
            record,
            'deleteAction',
          );

          if (!isAllowed) {
            return res.status(403).send({
              errors: [
                {
                  message: 'Unauthorized query.',
                },
              ],
            });
          }
        }
      }
    }

    next();
  });

  return router;
};

const DenimAuthenticatorMiddleware = (
  dataSource: DenimDataSourceV2,
  authenticator: DenimAuthenticatorV2,
) => {
  const router = Router();
  const tables = dataSource.getTableNames();

  tables.forEach((table) => {
    router.use(
      '/' + dashify(table),
      DenimAuthenticatorTableMiddleware(table, dataSource, authenticator),
    );
  });

  router.get('/roles', (req: Request, res: Response) => {
    const roles = getRolesFromRequest(authenticator, req);

    res.send(roles);
  });

  return router;
};

export default DenimAuthenticatorMiddleware;
