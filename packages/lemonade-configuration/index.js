const express = require('express');
const path = require('path');
const fs = require('fs');
const { AirTableSchemaRetriever } = require('denim-airtable');
const { adminLogin } = require('lark-admin-simulator');
const tough = require('tough-cookie');
const CookieFileStore = require('tough-cookie-file-store').FileCookieStore;
const qrcodeTerminal = require('qrcode-terminal');
const port = process.env.PORT || 4500;
const cookieJar = new tough.CookieJar(new CookieFileStore(path.join(__dirname, '../denim-lemonade-server/.larkadmincookie')));
const { default: got } = require('got');
const { spawn } = require('child_process');

const app = express();
let configCache = {
  bases: { },
  airtableEmail: '',
  airtablePassword: '',
};

if (fs.existsSync(path.join(__dirname, '.cache.json'))) {
  configCache = require('./.cache.json');
}

const parseStatusResponse = (name, statusResponse) => {
  const [, id, namespace, version, mode, pid, uptime, restarts, status, cpu, mem, user, watching] = new RegExp('│ (.+?) +│ ' + name + ' +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│ (.+?) +│', 'g').exec(statusResponse) || [];

  return {
    id,
    name,
    namespace,
    version,
    mode,
    pid,
    uptime,
    restarts,
    status,
    cpu,
    mem,
    user,
    watching,
  };
};

const pm2Command = (...command) => new Promise((resolve, reject) => {
  const process = spawn('npx', ['pm2', ...command], {
    cwd: path.join(__dirname, '../../'),
  });
  let allData = '';

  process.stdout.on('data', (data) => {
    allData += data.toString();
  });

  process.stderr.on('data', (data) => {
    allData += data.toString();
  });

  process.on('exit', (code) => {
    if (code === 0) {
      resolve(allData);
    } else {
      reject(new Error(allData));
    }
  });
});

const getLogs = async (name) => pm2Command('logs', name, '--lines=2500', '--nostream');

const getStatus = async () => {
  const statusResponse = await pm2Command('status');
  console.log(statusResponse);

  return {
    config: parseStatusResponse('config', statusResponse),
    server: parseStatusResponse('server', statusResponse),
    frontend: parseStatusResponse('frontend', statusResponse),
    logs: {
      server: await getLogs('server'),
      frontend: await getLogs('frontend'),
    },
  };
};

const baseOptions = (name) => {
  const { bases } = configCache.bases;

  return Object.keys(bases).map((baseId) => `
    <option value="${baseId}"${configCache[name] === baseId ? ' selected' : ''}>${bases[baseId].category} - ${bases[baseId].name}</option>
  `).join('');
};

const validateConfig = async () => {
  // Check for configuration.
  if (
    !configCache.bases.apiKey
    || !configCache.larkTenantSubdomain
    || !configCache.larkAppId
    || !configCache.larkAppSecret
    ) {
      return false;
  }

  // Check for the AirTable schema.
  if (
    !fs.existsSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-schema.json'))
    || !fs.existsSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-movement-schema.json'))
    || !fs.existsSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-timekeeping-schema.json'))
  ) {
    return false;
  }

  // Check for Lark admin cookie.
  if (
    !fs.existsSync(path.join(__dirname, '../denim-lemonade-server/.larkadmincookie'))
  ) {
    return false;
  }

  if (!(await validAdminCookie())) {
    return false;
  }

  return true;
};

const validAdminCookie = async () => {
  if (!configCache.larkTenantSubdomain) {
    return false;
  }

  const adminResponse = await got(`https://${configCache.larkTenantSubdomain}.larksuite.com/admin/index`, {
    cookieJar,
  });

  if (adminResponse.url.indexOf('/suite/passport/page/login') !== -1) {
    return false;
  }

  return true;
};

const baseSelect = (name) => `
  <select name="${name}" class="form-control">
    <option value=""></option>
    ${baseOptions(name)}
  </select>
`;

const render = async (errors = []) => {
  const { server, frontend, logs: { server: serverLogs, frontend: frontendLogs } } = await getStatus();

  return `
  <html>
    <head>
      <title>LemonadeHR Configuration</title>
      <style>
        html, body {
          font-family: Arial, Helvetica, sans-serif;
        }
  
        .container {
          max-width: 1600px;
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
  
        .success {
          color: green;
        }
  
        label {
          display: block;
          font-weight: bold;
          margin-bottom: 0.25em;
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
          ` : `
            <p>Welcome to Lemonade! You can configure the application below.</p>
            <h2>AirTable Bases</h2>
            <label>Core Base (CORE_BASE_ID)</label>
            ${baseSelect('coreBaseId')}
            <label>Movement Base (MOVEMENT_BASE_ID)</label>
            ${baseSelect('movementBaseId')}
            <label>Timekeeping Base (TIMEKEEPING_BASE_ID)</label>
            ${baseSelect('timekeepingBaseId')}
            <label>Employee Form URL</label>
            <input type="text" name="employeeFormUrl" class="form-control" value="${configCache.employeeFormUrl || ''}" />
            <label>
              <input type="checkbox" name="bases" value="REFRESH" />
              Re-retrieve schema from AirTable.
            </label>
            <h2>Lark Setup</h2>
            <label>Lark Tenant Subdomain</label>
            <input type="text" name="larkTenantSubdomain" class="form-control" value="${configCache.larkTenantSubdomain || ''}" />
            <label>Lark App ID</label>
            <input type="text" name="larkAppId" class="form-control" value="${configCache.larkAppId || ''}" />
            <label>Lark App Secret</label>
            <input type="password" name="larkAppSecret" class="form-control" value="${configCache.larkAppSecret || ''}" />
            ${!(await validAdminCookie()) ? `
              <h3 style="color: orange;">Lark admin connection has not been configured.</h3>
              <div id="qrCodeContainer">
                <button type="button" onclick="configureNow();">Configure Now</button>
              </div>
              <script>
                async function configureNow() {
                  qrCodeContainer.innerHTML = 'Loading...';
                  const response = await fetch('lark-admin-code');
                  const { code } = await response.json();
  
                  qrCodeContainer.innerHTML = '<div>Please scan this QR code while logged into the appropriate account:</div><pre>' + code + '</pre>';
  
                  const codeResponse = await fetch('lark-code-exists');
                  const responseText = await codeResponse.text();
                  
                  if (responseText === 'OK') {
                    window.location.href = window.location.href;
                  } else {
                    qrCodeContainer.innerHTML = 'Error: ' + responseText;
                  }
                }
              </script>
            ` : ''}
          `}
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
          ${await validateConfig() ? `
            <p class="success">
              Application is fully set up!
            </p>
          ` : `
            <p class="error">
              Application is <b>NOT</b> fully set up.
            </p>
          `}
          <h1>Status</h1>
          <button type="button" onclick="window.location.href = window.location.href;">Refresh</button>
          <h2>Backend (${server.status || 'not started'})</h2>
          <h3>Logs</h3>
          <textarea class="form-control logs" style="height: 450px;">${serverLogs}</textarea>
          <h2>Frontend (${frontend.status || 'not started'})</h2>
          <h3>Logs</h3>
          <textarea class="form-control logs" style="height: 450px;">${frontendLogs}</textarea>
          <script>
            document.querySelectorAll('.logs').forEach(function (item) {
              item.scrollTop = item.scrollHeight;
            });
          </script>
        </form>
    </body>
  </html>
  `;
};

const reprocess = async (commands) => {
  if (configCache.airtableEmail && configCache.airtablePassword && (!configCache.bases || configCache.bases === 'REFRESH')) {
    configCache.bases = await AirTableSchemaRetriever.retrieveSchema(configCache.airtableEmail, configCache.airtablePassword);
    configCache.lastUpdate = Date.now();
  }

  if (configCache.coreBaseId) {
    const { tables } = configCache.bases.bases[configCache.coreBaseId];
    fs.writeFileSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-schema.json'), JSON.stringify(tables, null, '  '));
  }

  if (configCache.movementBaseId) {
    const { tables } = configCache.bases.bases[configCache.movementBaseId];
    fs.writeFileSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-movement-schema.json'), JSON.stringify(tables, null, '  '));
  }

  if (configCache.timekeepingBaseId) {
    const { tables } = configCache.bases.bases[configCache.timekeepingBaseId];
    fs.writeFileSync(path.join(__dirname, '../denim-lemonade/src/schema/airtable-timekeeping-schema.json'), JSON.stringify(tables, null, '  '));
  }

  if (await validateConfig()) {
    const { frontend, server } = await getStatus();

    await pm2Command('startOrReload', 'ecosystem.config.js', '--only=frontend,server');
  }
};

app.get('/', async (req, res) => {
  res.send(await render());
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
  res.send(await render(errors));
});

let currentLarkAdminPromise = Promise.resolve();

app.get('/lark-admin-code', async (req, res) => {
  currentLarkAdminPromise = adminLogin(
    cookieJar,
    (code) => {
      qrcodeTerminal.generate(code, { small: true }, (code) => {
        res.json({
          code,
        });
      });
    }
  );
});

app.get('/lark-code-exists', async (req, res) => {
  try {
    await currentLarkAdminPromise;
    res.send('OK');
  } catch (e) {
    res.send(e.message);
  }
});

app.listen(port, () => {
  console.log('Listening on ' + port + '...');
});
