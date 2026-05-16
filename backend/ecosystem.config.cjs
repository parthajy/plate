// PM2 process definition. CommonJS so PM2 (CJS) can require it directly.
module.exports = {
  apps: [
    {
      name: 'plate-api',
      script: 'dist/server.js',
      cwd: __dirname,
      // Load secrets from .env via Node's built-in --env-file (no dotenv dep).
      // The .env file lives next to ecosystem.config.cjs (backend/.env).
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
