module.exports = {
  apps: [
    {
      name: 'admin',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_OPTIONS: '--no-deprecation',
      },
    },
    {
      name: 'updater',
      script: 'server.js',
      interpreter: 'bun',
    },
  ],
}