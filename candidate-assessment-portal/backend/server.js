require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
// const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

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


connectDB();

const app = express();

// Security & middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://assessment-portal.legatolxp.online',
  'https://assessment-portal.legatolxp.online',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded resumes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting - DISABLED
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
// app.use('/api', limiter);

// Routes
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
app.use('/api/rms-sync', rmsSyncRoutes);          // manual pull
app.use('/api/rms-webhook', rmsWebhookRoutes);    // real-time push

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  // All non-API routes serve the React app
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
