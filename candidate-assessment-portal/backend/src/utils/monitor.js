/**
 * Lightweight process monitoring for health checks and ops.
 */

const os = require('os');

let requestCount = 0;
let errorCount = 0;
const startedAt = Date.now();

const monitor = {
  incrementRequests() {
    requestCount += 1;
  },
  incrementErrors() {
    errorCount += 1;
  },
  getStats() {
    const mem = process.memoryUsage();
    return {
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      requests: requestCount,
      errors: errorCount,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        externalMb: Math.round(mem.external / 1024 / 1024),
      },
      cpuCount: os.cpus().length,
      nodeVersion: process.version,
      pid: process.pid,
    };
  },
  getHealth(dbState) {
    const stats = monitor.getStats();
    const healthy = dbState === 1;
    return {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: healthy ? 'connected' : 'disconnected',
      ...stats,
    };
  },
};

module.exports = monitor;
