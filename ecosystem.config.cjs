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
    {
      name: 'onchain-worker',
      script: 'services/workers/onchain-worker.ts',
      interpreter: 'bun',
    },
  ],
}
