const appLogger = require('../utils/appLogger');
const monitor = require('../utils/monitor');

const requestTiming = (req, res, next) => {
  const start = process.hrtime.bigint();
  monitor.incrementRequests();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (res.statusCode >= 500) monitor.incrementErrors();
    if (!req.path.startsWith('/api/health')) {
      appLogger.request(req.method, req.originalUrl, Math.round(ms), res.statusCode);
    }
  });

  next();
};

module.exports = requestTiming;
