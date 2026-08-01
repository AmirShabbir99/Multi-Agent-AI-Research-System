'use strict';

const multer = require('multer');
const path = require('path');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.upload.allowedExtensions.includes(ext)) {
    return cb(
      ApiError.badRequest(`File type '${ext}' is not supported. Allowed types: ${config.upload.allowedExtensions.join(', ')}`)
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxSizeBytes, files: 1 },
});

module.exports = upload;
