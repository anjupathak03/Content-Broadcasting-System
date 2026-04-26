const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const mime = require('mime-types');
const config = require('../config/env');
const { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIME_TYPES } = require('../utils/constants');
const { badRequest } = require('../utils/errors');

if (config.storageDriver === 'local') {
  fs.mkdirSync(config.uploadAbsoluteDir, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadAbsoluteDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${extension}`;
    cb(null, safeName);
  },
});

const storage = config.storageDriver === 's3' ? multer.memoryStorage() : localStorage;

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const mimeType = file.mimetype || mime.lookup(file.originalname || '');

  const validExtension = ALLOWED_IMAGE_EXTENSIONS.includes(extension);
  const validMime = ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);

  if (!validExtension || !validMime) {
    cb(badRequest('Only JPG, PNG, and GIF files are allowed'));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
  },
  fileFilter,
});

function handleContentUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      next(error);
      return;
    }

    if (!req.file) {
      next(badRequest('File is required'));
      return;
    }

    next();
  });
}

module.exports = {
  handleContentUpload,
};
