const fs = require('fs');
const config = fs.existsSync('./packages/lemonade-configuration/.cache.json') ? require('./packages/lemonade-configuration/.cache.json') : {
  bases: { },
};
const env = {
  AIRTABLE_API_KEY: config.bases.apiKey,
  CORE_BASE_ID: config.coreBaseId,
  MOVEMENT_BASE_ID: config.movementBaseId,
  TIMEKEEPING_BASE_ID: config.timekeepingBaseId,
  LARK_TENANT_SUBDOMAIN: config.larkTenantSubdomain,
  LARK_APP_ID: config.larkAppId,
  LARK_APP_SECRET: config.larkAppSecret,
  REACT_APP_EMPLOYEE_FORM_URL: config.employeeFormUrl,
  ENABLE_SYNC: '1',
};

module.exports = {
  apps: [
    {
      name: 'server',
      cwd: 'packages/denim-lemonade-server/',
      script: 'yarn',
      args: 'server',
      interpreter: 'none',
      env,
    },
    {
      name: 'frontend',
      cwd: 'packages/denim-lemonade/',
      script: 'yarn',
      args: 'serve',
      interpreter: 'none',
      env,
    },
    {
      name: 'config',
      cwd: 'packages/lemonade-configuration/',
      script: '.'
    },
  ],
};
