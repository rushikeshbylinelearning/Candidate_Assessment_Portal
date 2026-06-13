/**
 * Portal SSO launch route — additive only.
 * GET /sso-login?token=xxxxx
 *
 * Pattern mirrors: asseement-system/backend/src/routes/ssoLogin.js
 * Does NOT modify POST /api/auth/login.
 */
const express = require('express');
const User = require('../modules/auth/user.model');
const { generateJWT } = require('../utils/generateToken');
const { verifyPortalLaunchToken } = require('../services/portalSsoTokenService');
const { buildLookupEmails } = require('../services/ssoEmailMap');
const { logSSOLoginSuccess, logSSOLoginFailed } = require('../services/ssoLoginAuditService');

const router = express.Router();

function getFrontendUrl() {
  const fromEnv = process.env.FRONTEND_URL || process.env.CLIENT_URL;
  if (!fromEnv) {
    return 'http://localhost:5176';
  }
  return fromEnv.split(',')[0].trim().replace(/\/$/, '');
}

function redirectToLogin(res, message) {
  const encoded = encodeURIComponent(message);
  return res.redirect(`${getFrontendUrl()}/login?error=sso_error&message=${encoded}`);
}

router.get('/sso-login', async (req, res) => {
  const token = req.query.token;

  if (!token) {
    await logSSOLoginFailed(req, {
      email: 'unknown',
      reason: 'Missing token query parameter',
    });
    return redirectToLogin(res, 'SSO token is required');
  }

  if (!process.env.SSO_SECRET) {
    await logSSOLoginFailed(req, {
      email: 'unknown',
      reason: 'SSO_SECRET is not configured on CAP backend',
    });
    return res.status(503).json({
      error: 'SSO authentication is not configured',
      code: 'SSO_NOT_CONFIGURED',
    });
  }

  // Step 1: Verify the portal-issued HS256 launch token
  let decoded;
  try {
    decoded = verifyPortalLaunchToken(token);
  } catch (verifyError) {
    await logSSOLoginFailed(req, {
      email: 'unknown',
      reason: verifyError.message,
    });
    return redirectToLogin(res, verifyError.message);
  }

  // Step 2: Resolve the user by email (appEmail preferred, fallback to email claim)
  const lookupEmails = buildLookupEmails(decoded);
  const primaryLookupEmail = lookupEmails[0] || String(decoded.email || '').toLowerCase();

  let user;
  try {
    user = await User.findOne({
      status: 'active',
      email: { $in: lookupEmails },
    });
  } catch (dbError) {
    await logSSOLoginFailed(req, {
      email: primaryLookupEmail,
      reason: `Database error: ${dbError.message}`,
    });
    return res.status(503).json({
      error: 'Unable to complete SSO login',
      code: 'DB_ERROR',
    });
  }

  if (!user) {
    await logSSOLoginFailed(req, {
      email: primaryLookupEmail,
      reason: 'No matching active Candidate Assessment Portal account',
    });
    return redirectToLogin(res, `No account found for ${decoded.email || primaryLookupEmail}`);
  }

  // Step 3: Reuse existing session creation logic (same as auth.controller.js login)
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const capToken = generateJWT(user._id);
  const userData = user.toJSON();

  // Step 4: Audit log success
  await logSSOLoginSuccess(req, {
    email: user.email,
    userId: user._id,
    userName: user.name,
  });

  console.log(`[CAP SSO] Login successful: ${user.email} (role: ${user.role})`);

  // Step 5: Redirect to frontend SSO callback with token + user data
  const callbackUrl = `${getFrontendUrl()}/auth/sso-callback?token=${encodeURIComponent(capToken)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
  return res.redirect(callbackUrl);
});

module.exports = router;
