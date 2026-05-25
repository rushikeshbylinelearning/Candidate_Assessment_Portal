/**
 * PDF text extraction for Node.js (no browser DOM APIs).
 * Uses pdf-parse v1 — avoids pdf.js / DOMMatrix requirements on shared hosting.
 */

let pdfParseFn = null;

function getPdfParse() {
  if (!pdfParseFn) {
    pdfParseFn = require('pdf-parse');
  }
  return pdfParseFn;
}

/**
 * @param {Buffer|Uint8Array} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromPdfBuffer(buffer) {
  const pdfParse = getPdfParse();
  const data = await pdfParse(buffer);
  return (data.text || '').trim();
}

module.exports = { extractTextFromPdfBuffer };
