const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('./assessmentImport.controller');
const { protect, authorize } = require('../../middleware/auth');

// Temp upload directory for assessment PDFs
const tmpDir = path.join(__dirname, '../../../uploads/assessment-imports');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `import-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only PDF and Word documents are supported'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

router.use(protect);
router.use(authorize('admin', 'hr'));

// Parse PDF → preview questions (no DB writes)
router.post('/parse', upload.single('file'), ctrl.parseFile);

// Save questions + create assessment
router.post('/create', ctrl.createFromImport);

module.exports = router;
