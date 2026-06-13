require('./polyfills');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const requestTiming = require('./src/middleware/requestTiming');
const monitor = require('./src/utils/monitor');
const appLogger = require('./src/utils/appLogger');
const { getQueueStats } = require('./src/utils/taskQueue');
const cacheService = require('./src/services/cache.service');

const isProd = process.env.NODE_ENV === 'production';

// Route imports
const authRoutes = require('./src/modules/auth/auth.routes');
const roleRoutes = require('./src/modules/roles/role.routes');
const assessmentRoutes = require('./src/modules/assessment/assessment.routes');
const questionRoutes = require('./src/modules/question/question.routes');
const candidateRoutes = require('./src/modules/candidate/candidate.routes');
const responseRoutes = require('./src/modules/response/response.routes');
const notesRoutes = require('./src/modules/notes/notes.routes');
const analyticsRoutes = require('./src/modules/analytics/analytics.routes');
const tokenRoutes = require('./src/modules/token/token.routes');
const pipelineRoutes = require('./src/modules/pipeline/pipeline.routes');
const resumeRoutes = require('./src/modules/resume/resume.routes');
const assessmentImportRoutes = require('./src/modules/assessmentImport/assessmentImport.routes');
const workflowRoutes = require('./src/modules/workflow/workflow.routes');
const rmsSyncRoutes = require('./src/modules/rmsSync/rmsSync.routes');
const rmsWebhookRoutes = require('./src/modules/rmsSync/rmsWebhookReceiver');
const ssoLoginRoutes = require('./src/routes/ssoLogin');

connectDB();

const app = express();

// Trust reverse proxy (Passenger, nginx, LiteSpeed)
if (process.env.TRUST_PROXY === 'true' || isProd) {
  app.set('trust proxy', 1);
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://assessment-portal.legatolxp.online',
  'https://assessment-portal.legatolxp.online',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(compression({ threshold: 1024, level: 6 }));
app.use(requestTiming);

if (!isProd) {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

app.use(express.json({
  limit: process.env.JSON_BODY_LIMIT || '2mb',
}));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
  message: { message: 'Too many login attempts, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.use(ssoLoginRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(dbState === 1 ? 200 : 503).json({
    ...monitor.getHealth(dbState),
    backgroundTasks: getQueueStats(),
    cache: cacheService.getStats(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/assessment-import', assessmentImportRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/rms-sync', rmsSyncRoutes);
app.use('/api/rms-webhook', rmsWebhookRoutes);

if (isProd) {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  appLogger.info(`Server listening on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '10000', 10);

function gracefulShutdown(signal) {
  appLogger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    cacheService.clearAll();
    mongoose.connection.close(false).then(() => {
      appLogger.info('HTTP server and MongoDB connection closed');
      process.exit(0);
    }).catch(() => process.exit(1));
  });
  setTimeout(() => {
    appLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  appLogger.error('Unhandled rejection', String(reason));
});
process.on('uncaughtException', (err) => {
  appLogger.error('Uncaught exception', err.message);
  gracefulShutdown('uncaughtException');
});
