/**
 * PM2 ecosystem — single instance for shared hosting / low-RAM VPS.
 * Do NOT use cluster mode on limited process-count hosts.
 */
module.exports = {
  apps: [
    {
      name: 'cap-portal',
      script: './backend/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: process.env.PM2_MAX_MEMORY || '400M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
        MONGODB_MAX_POOL_SIZE: 5,
        MAX_BACKGROUND_TASKS: 2,
        RATE_LIMIT_MAX: 300,
        TRUST_PROXY: 'true',
      },
      listen_timeout: 10000,
      kill_timeout: 10000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
