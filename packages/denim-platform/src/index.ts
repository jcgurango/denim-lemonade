import express from 'express';
import appSchemaSource from './data-sources/app-schema';
import consumerRouter, { refreshConsumerRouter } from './routes/consumer';
import appSchemaRouter, { refreshAppSchemaRouter } from './routes/app-schema';

const port = process.env.PORT || 4000;
const app = express();
const cors = require('cors');

app.use(cors());
app.use('/app-schema/consumer-schema', (req, res) => {
  res.redirect('/consumer/schema');
});
app.use('/app-schema', appSchemaRouter);
app.use('/consumer', consumerRouter);

(async () => {
  await appSchemaSource.initialize();
  await refreshConsumerRouter();
  await refreshAppSchemaRouter();

  app.listen(port, () => {
    console.log(`DENIM platform running on port ${port}...`);
  });
})();
