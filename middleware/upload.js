const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext}`);
  },
});

const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.zip'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) return cb(null, true);
  cb(new Error('File type not allowed'));
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
