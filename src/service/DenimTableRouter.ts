import { Router } from 'express';
import { ValidationError } from 'yup';
import { DenimDataContext, DenimTableDataProvider, DenimRecord } from '../core/types/data';

const getDenimDataContextFromRequest = (request: any): DenimDataContext => {
  return request.denimContext;
};

const DenimTableRouter = (dataProvider: DenimTableDataProvider) => {
  const router = Router();

  // Retrieve records.
  router.get('/', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const { id } = req.params;

    if (!id) {
      return res.send(400);
    }

    const record = await dataProvider.retrieveRecords(context);
    return res.json(record);
  });

  // Create new record.
  router.post('/', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = <DenimRecord>(req.body);

    const transaction = await dataProvider.beginTransaction();
    const record = await dataProvider.createRecord(context, transaction, updateData);

    // Validate the new record.
    try {
      if (await dataProvider.validate(context, record)) {
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
              path: [],
            }
          ],
        });
      }
    }

    return res.json(record);
  });

  // Retrieve existing record.
  router.post('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const { id } = req.params;

    if (!id) {
      return res.send(400);
    }

    const record = await dataProvider.retrieveRecord(context, id);
    return res.json(record);
  });

  // Update existing record.
  router.put('/:id', async (req, res) => {
    const context = getDenimDataContextFromRequest(req);
    const updateData = <DenimRecord>(req.body);

    const transaction = await dataProvider.beginTransaction();
    const record = await dataProvider.updateRecord(context, transaction, req.params.id, updateData);

    // Validate the updated record.
    try {
      if (await dataProvider.validate(context, record)) {
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
              path: [],
            }
          ],
        });
      }
    }

    return res.json(record);
  });

  return router;
};

export default DenimTableRouter;
