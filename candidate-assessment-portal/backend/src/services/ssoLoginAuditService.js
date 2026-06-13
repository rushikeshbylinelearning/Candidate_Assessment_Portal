/**
 * SSO Audit logging service — appends structured entries to sso-audit.log.
 * Pattern mirrors: asseement-system/backend/src/services/ssoLoginAuditService.js
 */
const fs = require('fs').promises;
const path = require('path');

const logFilePath = path.join(__dirname, '..', '..', 'sso-audit.log');

function getRequestMeta(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.get('User-Agent') || null,
    path: req.originalUrl || req.path,
  };
}

async function logAction(actionData) {
  const timestamp = new Date().toISOString();
  const message = `ACTION: ${actionData.action} - User: ${actionData.userId} - Details: ${JSON.stringify(actionData.details)}`;

  try {
    await fs.appendFile(logFilePath, `${timestamp} - ${message}\n`);
  } catch (error) {
    console.error('[CAP SSO AUDIT] Failed to write audit log:', error);
    console.log(`[CAP SSO AUDIT] ${timestamp} - ${message}`);
  }
}

async function logSSOLoginSuccess(req, { email, userId, userName }) {
  return logAction({
    action: 'SSO_LOGIN_SUCCESS',
    userId: userId ? String(userId) : 'unknown',
    details: {
      email,
      userName: userName || null,
      ...getRequestMeta(req),
    },
  });
}

async function logSSOLoginFailed(req, { email, reason }) {
  return logAction({
    action: 'SSO_LOGIN_FAILURE',
    userId: 'unknown',
    details: {
      email: email || 'unknown',
      reason: reason || 'SSO authentication failed',
      ...getRequestMeta(req),
    },
  });
}

module.exports = { logSSOLoginSuccess, logSSOLoginFailed };
