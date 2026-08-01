'use strict';

const mongoose = require('mongoose');
const { UPLOAD_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const uploadSchema = new Schema(
  {
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    storedFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(UPLOAD_STATUS),
      default: UPLOAD_STATUS.PENDING,
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

uploadSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Upload', uploadSchema);
