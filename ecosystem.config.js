module.exports = {
  apps: [
    {
      name: 'server',
      cwd: 'packages/denim-lemonade-server/',
      script: 'yarn',
      args: 'server'
    },
    {
      name: 'frontend',
      cwd: 'packages/denim-lemonade/',
      script: 'yarn',
      args: 'serve'
    },
    {
      name: 'config',
      cwd: 'packages/lemonade-configuration/',
      script: 'yarn',
      args: 'start'
    }
  ],
};
