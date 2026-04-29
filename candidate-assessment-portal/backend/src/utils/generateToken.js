const jwt = require('jsonwebtoken');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 48);

const generateJWT = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateAssessmentToken = () => nanoid();

/**
 * Generate a unique 6-digit access code for candidates
 * @returns {string} 6-digit numeric code
 */
const generateAccessCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { generateJWT, generateAssessmentToken, generateAccessCode };
