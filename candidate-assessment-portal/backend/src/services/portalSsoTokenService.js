/**
 * Validates short-lived HS256 launch tokens from the Portal Identity Provider.
 * Pattern mirrors: asseement-system/backend/src/services/portalSsoTokenService.js
 */
const jwt = require('jsonwebtoken');

const EXPECTED_APPLICATION = process.env.SSO_APPLICATION_CODE || 'ASSESSMENT';
const MAX_IAT_FUTURE_SECONDS = 60;

function getSsoSecret() {
  const secret = process.env.SSO_SECRET;
  if (!secret) {
    throw new Error('SSO_SECRET is not configured');
  }
  return secret;
}

function validateTemporalClaims(decoded) {
  const now = Math.floor(Date.now() / 1000);

  if (typeof decoded.exp !== 'number') {
    throw new Error('Token missing exp claim');
  }

  if (typeof decoded.iat === 'number' && decoded.iat > now + MAX_IAT_FUTURE_SECONDS) {
    throw new Error('Token iat is in the future');
  }
}

function validateIssuer(decoded) {
  const expectedIssuer = process.env.SSO_ISSUER;
  if (!expectedIssuer || !decoded.iss) {
    return;
  }
  if (decoded.iss !== expectedIssuer) {
    throw new Error(`Invalid token issuer: expected "${expectedIssuer}", got "${decoded.iss}"`);
  }
}

function validateRequiredClaims(decoded) {
  if (!decoded.userId) {
    throw new Error('Token missing userId claim');
  }
  if (!decoded.email) {
    throw new Error('Token missing email claim');
  }
  if (!decoded.application) {
    throw new Error('Token missing application claim');
  }
  if (decoded.application !== EXPECTED_APPLICATION) {
    throw new Error(
      `Token application "${decoded.application}" does not match "${EXPECTED_APPLICATION}"`,
    );
  }
}

function verifyPortalLaunchToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getSsoSecret(), {
      algorithms: ['HS256'],
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error(`Invalid token signature: ${err.message}`);
    }
    throw err;
  }

  validateTemporalClaims(decoded);
  validateIssuer(decoded);
  validateRequiredClaims(decoded);

  return decoded;
}

module.exports = { verifyPortalLaunchToken, EXPECTED_APPLICATION };
