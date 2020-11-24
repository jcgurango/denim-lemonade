import { Router } from 'express';
import { DenimDataContext, DenimTableValidator } from '../core/types/data';
import DenimTableDataProvider from './DenimTableDataProvider';

const getDenimDataContextFromRequest = (request: any): DenimDataContext => {
  return request.denimContext || { };
};

const getExpansionFromQuery = (query: any) => {
  const { expand } = query;

  if (expand) {
    return expand.toString().split(',');
  }

  return null;
};

const DenimTableRouter = (dataProvider: DenimTableDataProvider, validator: DenimTableValidator) => {
  const router = Router();

  // Retrieve records.
  router.get('/', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);

    try {
      const record = await dataProvider.retrieveRecords(context, { expand: getExpansionFromQuery(req.query) });
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

  /*
  // Retrieve existing record.
  router.get('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const { id } = req.query;

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
  router.post('/', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = <DenimRecord>(req.body);

    const record = await dataProvider.createRecord(context, updateData);

    // Validate the new record.
    try {
      if (await validator.validate(context, transaction, record)) {
        await transaction.commit();
      } else {
        throw new Error('Validation error.');
      }
    } catch (e) {
      await transaction.rollback();

      if (e.inner) {
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

    return res.json(record);
  });

  // Update existing record.
  router.put('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = new JSONDenimRecord(req.body, req.params.id);

    const record = await dataProvider.updateRecord(context, req.params.id, updateData);

    // Validate the updated record.
    try {
      if (await validator.validate(context, transaction, record)) {
        await transaction.commit();
      } else {
        throw new Error('Validation error.');
      }
    } catch (e) {
      await transaction.rollback();

      if (e.inner) {
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

    return res.json(record);
  });
  */

  return router;
};

export default DenimTableRouter;
