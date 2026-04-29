/**
 * Middleware to validate RMS API key from x-rms-api-key header
 * Used for external RMS system integration
 */
const validateRmsApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-rms-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API_KEY_MISSING',
      message: 'RMS API key is required',
    });
  }

  // Validate against environment variable
  const validApiKey = process.env.RMS_API_KEY;

  if (!validApiKey) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'RMS API key not configured on server',
    });
  }

  if (apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'API_KEY_INVALID',
      message: 'Invalid RMS API key',
    });
  }

  next();
};

module.exports = { validateRmsApiKey };
