/**
 * Maps portal login emails to local application accounts.
 * Env: SSO_APP_EMAIL_MAP=portal@x.com:app@x.com,other@portal.com:other@app.com
 */
function normalizeEmail(email) {
  return email?.trim().toLowerCase() || '';
}

function parseEmailMap(config) {
  const map = new Map();
  if (!config?.trim()) return map;

  for (const entry of config.split(',')) {
    const sep = entry.indexOf(':');
    if (sep === -1) continue;
    const from = entry.slice(0, sep).trim().toLowerCase();
    const to = entry.slice(sep + 1).trim().toLowerCase();
    if (from && to) map.set(from, to);
  }
  return map;
}

const cachedMap = () => parseEmailMap(process.env.SSO_APP_EMAIL_MAP);

function resolveMappedEmail(portalEmail) {
  const normalized = normalizeEmail(portalEmail);
  if (!normalized) return '';
  return cachedMap().get(normalized) || normalized;
}

/**
 * Build deduplicated list of emails to try when resolving an SSO user.
 * Priority: appEmail claim → SSO_APP_EMAIL_MAP → raw portal email.
 */
function buildLookupEmails(decoded) {
  const portalEmail = normalizeEmail(decoded?.email);
  const fromToken = decoded?.appEmail ? normalizeEmail(decoded.appEmail) : '';
  const fromMap = portalEmail ? resolveMappedEmail(portalEmail) : '';

  return [...new Set([fromToken, fromMap, portalEmail].filter(Boolean))];
}

module.exports = {
  normalizeEmail,
  resolveMappedEmail,
  buildLookupEmails,
};
