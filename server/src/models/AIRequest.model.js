'use strict';

const mongoose = require('mongoose');
const { AI_REQUEST_TYPE, AI_REQUEST_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const aiRequestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(AI_REQUEST_TYPE),
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AI_REQUEST_STATUS),
      required: true,
    },
    durationMs: {
      type: Number,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    requestId: {
      type: String,
      default: null, // the AI service's own request_id, for cross-service log correlation
    },
  },
  { timestamps: true }
);

aiRequestSchema.index({ createdAt: -1 });
aiRequestSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('AIRequest', aiRequestSchema);
