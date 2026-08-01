'use strict';

const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../utils/constants');

const { Schema } = mongoose;

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
      trim: true,
      maxlength: 150,
    },
    documentIds: [
      {
        type: String, // FastAPI document_id (not a Mongo ObjectId - it belongs to the AI service's registry)
      },
    ],
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.ACTIVE,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ user: 1, lastMessageAt: -1 });
sessionSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
