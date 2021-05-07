import bodyParser from 'body-parser';
import dashify from 'dashify';
import { Request, Response, Router } from 'express';
import { DenimQuery, DenimRecord } from '../core';
import { DenimAuthenticatorV2 } from '../service';
import DenimDataSourceV2 from '../service/DenimDataSourceV2';

const getExpansionFromQuery = (query: any) => {
  const { expand } = query;

  if (expand) {
    return expand.toString().split(',').filter(Boolean);
  }

  return null;
};

export const DenimTableRouter = (
  table: string,
  dataSource: DenimDataSourceV2,
) => {
  const router = Router();

  // Retrieve records.
  const queryHandler = async (req: Request, res: Response) => {
    const query: DenimQuery = { expand: getExpansionFromQuery(req.query) };

    if (req.query.page || req.query.page_size) {
      if (!req.query.page_size) {
        req.query.page_size = '50';
      }

      if (!req.query.page) {
        req.query.page = '1';
      }

      query.page = Number(req.query.page);
      query.pageSize = Number(req.query.page_size);
    }

    if (req.query.view) {
      query.view = String(req.query.view);
    }

    if (req.query.all) {
      query.retrieveAll = Boolean(req.query.all);
    }

    if (req.body) {
      query.conditions = req.body;
    }

    if (req.query.sort) {
      query.sort = {
        column: String(req.query.sort),
        ascending: Boolean(req.query.ascending),
      };
    }

    try {
      const record = await dataSource.retrieveRecords(table, query);
      return res.json(record);
    } catch (e) {
      return res.status(500).json({
        errors: [
          {
            message: e.message,
            path: '',
          },
        ],
      });
    }
  };

  router.get('/', queryHandler);
  router.post('/', bodyParser.json(), queryHandler);

  // Retrieve existing record.
  router.get('/:id', async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send();
    }

    try {
      const record = await dataSource.retrieveRecord(
        table,
        id.toString(),
        getExpansionFromQuery(req.query),
      );

      if (!record) {
        return res.status(404).json(record);
      }

      return res.json(record);
    } catch (e) {
      return res.status(500).json({
        errors: [
          {
            message: e.message,
            path: '',
          },
        ],
      });
    }
  });

  // Create new record.
  router.put('/', bodyParser.json(), async (req, res) => {
    const updateData = req.body as DenimRecord;
    const authenticator: DenimAuthenticatorV2 = (req as any).authenticator;

    // Validate the new record.
    try {
      const record = await dataSource.createRecord(table, updateData);

      if (authenticator) {
        return res.json(
          authenticator.filterRecord(
            ((req as any).user as DenimRecord) || {},
            table,
            record,
            'readAction',
          ),
        );
      }

      return res.json(record);
    } catch (e) {
      if (e.inner && e.inner.length) {
        return res.status(500).json({
          errors: e.inner,
        });
      } else {
        console.error(e);

        return res.status(500).json({
          errors: [
            {
              message: 'Record validation failed.',
              path: '',
            },
          ],
        });
      }
    }
  });

  // Update existing record.
  router.put('/:id', bodyParser.json(), async (req, res) => {
    const updateData = req.body as DenimRecord;
    const authenticator: DenimAuthenticatorV2 = (req as any).authenticator;

    // Validate the updated record.
    try {
      const record = await dataSource.updateRecord(
        table,
        req.params.id,
        updateData,
      );

      if (authenticator) {
        return res.json(
          authenticator.filterRecord(
            ((req as any).user as DenimRecord) || {},
            table,
            record,
            'readAction',
          ),
        );
      }

      return res.json(record);
    } catch (e) {
      if (e.inner && e.inner.length) {
        return res.status(500).json({
          errors: e.inner,
        });
      } else {
        console.error(e);

        return res.status(500).json({
          errors: [
            {
              message: 'Record validation failed.',
              path: '',
            },
          ],
        });
      }
    }
  });

  // Delete existing record.
  router.delete('/:id', async (req, res) => {
    if (!req.params.id) {
      return res.status(400).send();
    }

    try {
      await dataSource.deleteRecord(table, req.params.id);
      return res.send();
    } catch (e) {
      if (e.inner && e.inner.length) {
        return res.status(500).json({
          errors: e.inner,
        });
      } else {
        console.error(e);

        return res.status(500).json({
          errors: [
            {
              message: e.message,
              path: '',
            },
          ],
        });
      }
    }
  });

  return router;
};

const DenimDataSourceV2Router = (dataSource: DenimDataSourceV2) => {
  const router = Router();
  const tables = dataSource.getTableNames();

  tables.forEach((table) => {
    router.use('/' + dashify(table), DenimTableRouter(table, dataSource));
  });

  router.use('/schema', (req, res) => {
    res.send(dataSource.schema);
  });

  return router;
};

export default DenimDataSourceV2Router;
