const Token = require('../modules/token/token.model');
const PipelineRecord = require('../modules/pipeline/pipeline.model');

/**
 * Middleware to validate pipeline token from x-pipeline-token header
 * Attaches resolved PipelineRecord to req.pipeline
 */
const validatePipelineToken = async (req, res, next) => {
  const tokenValue = req.headers['x-pipeline-token'];

  if (!tokenValue) {
    return res.status(401).json({
      error: 'TOKEN_INVALID',
      message: 'No pipeline token provided',
    });
  }

  try {
    // Find token
    const token = await Token.findOne({ value: tokenValue });

    if (!token) {
      return res.status(401).json({
        error: 'TOKEN_INVALID',
        message: 'Token not found',
      });
    }

    // Check if token is expired
    if (new Date() > token.expiresAt) {
      return res.status(401).json({
        error: 'TOKEN_INVALID',
        message: 'Token has expired',
      });
    }

    // Check if token is consumed (useCount >= maxUses)
    if (token.useCount >= token.maxUses) {
      return res.status(401).json({
        error: 'TOKEN_INVALID',
        message: 'Token has been fully consumed',
      });
    }

    // Find associated pipeline record
    const pipeline = await PipelineRecord.findOne({
      candidateId: token.candidateId,
      roleId: token.roleId,
    });

    if (!pipeline) {
      return res.status(404).json({
        error: 'PIPELINE_NOT_FOUND',
        message: 'No pipeline record found for this token',
      });
    }

    // Attach pipeline and token to request
    req.pipeline = pipeline;
    req.token = token;
    req.candidateId = token.candidateId;

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error validating pipeline token',
    });
  }
};

module.exports = { validatePipelineToken };
