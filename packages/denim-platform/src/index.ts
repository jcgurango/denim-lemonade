import express from 'express';
import { DenimDataSourceV2Router } from 'denim-express';
import appSchemaSource from './data-sources/app-schema';
import consumerRouter, { refreshConsumerRouter } from './routes/consumer';

const port = process.env.PORT || 3000;
const app = express();
const cors = require('cors');

app.use(cors());
app.use('/app-schema', DenimDataSourceV2Router(appSchemaSource));
app.use('/consumer', consumerRouter);

(async () => {
  await appSchemaSource.initialize();
  await refreshConsumerRouter();

  app.listen(port, () => {
    console.log(`DENIM platform running on port ${port}...`);
  });
})();
