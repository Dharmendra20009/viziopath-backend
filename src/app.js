const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet'); // ✅ security headers
const routes = require('./routes');
const ApiError = require('./utils/ApiError');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// Parse JSON & cookies
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Handle invalid JSON payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next();
});

// CORS: allow frontend dev + production domain
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://viziopath.info',
  'http://viziopath.info'
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow server-to-server or curl
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // ✅ allow all common methods
  })
);

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'viziopath-backend' })
);

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res, next) => next(new ApiError(404, 'Route not found')));

// Error handler
app.use(errorHandler);

module.exports = app;
