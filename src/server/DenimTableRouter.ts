import { Request, Response, Router } from 'express';
import bodyParser from 'body-parser';
import { DenimDataContext, DenimQuery, DenimRecord } from '../denim/core';
import { DenimTableDataProvider } from '../denim/service';

const getDenimDataContextFromRequest = (request: any): DenimDataContext => {
  return {
    ...request.denimContext,
  };
};

const getExpansionFromQuery = (query: any) => {
  const { expand } = query;

  if (expand) {
    return expand.toString().split(',').filter(Boolean);
  }

  return null;
};

const DenimTableRouter = (dataProvider: DenimTableDataProvider) => {
  const router = Router();

  // Retrieve records.
  const queryHandler = async (req: Request, res: Response) => {
    const context = getDenimDataContextFromRequest(req);
    const query: DenimQuery = { expand: getExpansionFromQuery(req.query) };

    if (req.query.page) {
      if (!req.query.page_size) {
        req.query.page_size = '10';
      }

      query.page = Number(req.query.page);
      query.pageSize = Number(req.query.page_size);
    }

    if (req.body) {
      query.conditions = req.body;
    }

    try {
      const record = await dataProvider.retrieveRecords(context, query);
      return res.json(record);
    } catch (e) {
      return res.status(500).json({
        errors: [
          {
            message: e.message,
            path: '',
          }
        ],
      });
    }
  };

  router.get('/', queryHandler);
  router.post('/', bodyParser.json(), queryHandler);

  // Retrieve existing record.
  router.get('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const { id } = req.params;

    if (!id) {
      return res.status(400).send();
    }

    try {
      const record = await dataProvider.retrieveRecord(context, id.toString(), getExpansionFromQuery(req.query));
      return res.json(record);
    } catch (e) {
      return res.status(500).json({
        errors: [
          {
            message: e.message,
            path: '',
          }
        ],
      });
    }
  });

  // Create new record.
  router.put('/', bodyParser.json(), async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = <DenimRecord>(req.body);

    // Validate the new record.
    try {
      const record = await dataProvider.createRecord(context, updateData);

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
            }
          ],
        });
      }
    }
  });

  // Update existing record.
  router.put('/:id', bodyParser.json(), async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = <DenimRecord>(req.body);

    // Validate the updated record.
    try {
      const record = await dataProvider.updateRecord(context, req.params.id, updateData);
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
            }
          ],
        });
      }
    }
  });

  // Delete existing record.
  router.delete('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);

    if (!req.params.id) {
      return res.status(400).send();
    }

    try {
      await dataProvider.deleteRecord(context, req.params.id);
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
            }
          ],
        });
      }
    }
  });

  return router;
};

export default DenimTableRouter;
