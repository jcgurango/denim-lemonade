const express = require('express');
const path = require('path');
const fs = require('fs');
const { AirTableSchemaRetriever } = require('denim-airtable');
const port = process.env.PORT || 5000;

const app = express();
let configCache = {
  airtableEmail: '',
  airtablePassword: '',
};

if (fs.existsSync(path.join(__dirname, '.cache.json'))) {
  configCache = require('./.cache.json');
}

const render = (errors = []) => `
<html>
  <head>
    <title>LemonadeHR Configuration</title>
    <style>
      html, body {
        font-family: Arial, Helvetica, sans-serif;
      }

      .container {
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;
        padding: 1em;
      }

      h1, h2, h3, h4, h5, h6 {
        margin: 0px;
        margin-bottom: 0.25em;
      }

      .form-control {
        width: 100%;
        display: block;
        box-sizing: border-box;
        padding: 0.5em;
        margin-bottom: 0.5em;
      }

      .error {
        color: red;
        margin-bottom: 0.5em;
      }
    </style>
  </head>
  <body>
      <form action="" method="POST" class="container">
        <h1>Lemonade Setup</h1>
        <div style="margin-bottom: 0.5em;">
        ${(!configCache.airtableEmail || !configCache.airtablePassword) ? `
          <p>
            To continue, enter your airtable username and password:
          </p>
          <input type="email" name="airtableEmail" class="form-control" />
          <input type="password" name="airtablePassword" class="form-control" />
        ` : null}
        </div>
        <div style="margin-bottom: 0.5em;">
          <button type="submit">
            Save
          </button>
        </div>
        ${errors.map((error) => `
          <div class="error">
            ${error}
          </div>
        `).join('')}
      </form>
  </body>
</html>
`;

const reprocess = async (commands) => {
  if (configCache.airtableEmail && configCache.airtablePassword && (!configCache.bases || configCache.bases === 'REFRESH')) {
    configCache.bases = await AirTableSchemaRetriever.retrieveSchema(configCache.airtableEmail, configCache.airtablePassword);
    configCache.lastUpdate = Date.now();
  }
};

app.get('/', async (req, res) => {
  res.send(render());
});

app.post('/', express.urlencoded({ extended: true }), async (req, res) => {
  configCache = {
    ...configCache,
    ...req.body,
  };

  const { commands } = configCache;
  delete configCache.commands;

  const errors = [];

  try {
    await reprocess(commands);
  } catch (e) {
    errors.push(e.message);
  }

  fs.writeFileSync(path.join(__dirname, '.cache.json'), JSON.stringify(configCache, null, '  '));
  res.send(render(errors));
});

app.listen(port, () => {
  console.log('Listening on ' + port + '...');
});
