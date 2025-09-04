module.exports = {
  apps: [
    {
      name: 'viziopath-backend',
      script: 'server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health check
      health_check_grace_period: 3000,
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Monitoring
      pmx: true,
      // Restart policy
      min_uptime: '10s',
      max_restarts: 10,
      // Environment specific settings
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        MONGODB_URI: process.env.MONGODB_URI_PROD,
        JWT_SECRET: process.env.JWT_SECRET,
        FRONTEND_URL: 'https://viziopath.info'
      }
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/viziopath/viziopath-backend.git',
      path: '/var/www/viziopath-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};


