'use strict';

const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const documentSchema = new Schema(
  {
    upload: {
      type: Schema.Types.ObjectId,
      ref: 'Upload',
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // The AI service's own document_id (SQLite registry PK) - the join key for every FastAPI call.
    aiDocumentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    vectorDbProvider: {
      type: String,
      default: 'faiss',
    },
    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.PENDING,
    },
    cachedSummary: {
      type: String,
      default: null,
    },
    indexedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

documentSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
documentSchema.index({ status: 1 });

module.exports = mongoose.model('Document', documentSchema);
