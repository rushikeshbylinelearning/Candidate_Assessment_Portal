/**
 * Lightweight production-safe logger.
 * - development: info + error
 * - production: errors only (no verbose debug spam)
 */

const isProd = process.env.NODE_ENV === 'production';
const isDev = !isProd;

const format = (level, msg, meta) => {
  const ts = new Date().toISOString();
  const extra = meta ? ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}` : '';
  return `[${ts}] ${level.toUpperCase()} ${msg}${extra}`;
};

const appLogger = {
  info(msg, meta) {
    if (isDev) console.log(format('info', msg, meta));
  },
  warn(msg, meta) {
    if (isDev) console.warn(format('warn', msg, meta));
  },
  error(msg, meta) {
    console.error(format('error', msg, meta));
  },
  /** HTTP request timing (production: slow requests only) */
  request(method, url, ms, status) {
    const slow = ms > 1000;
    if (isProd && !slow && status < 400) return;
    if (isProd && status < 400 && ms < 500) return;
    const line = `${method} ${url} ${status} ${ms}ms`;
    if (status >= 500 || slow) appLogger.error(line);
    else if (isDev) appLogger.info(line);
  },
};

module.exports = appLogger;
