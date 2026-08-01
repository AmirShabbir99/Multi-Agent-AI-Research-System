'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const logSchema = new Schema(
  {
    level: {
      type: String,
      enum: ['error', 'warn'],
      default: 'error',
    },
    message: {
      type: String,
      required: true,
    },
    stack: {
      type: String,
      default: null,
    },
    path: {
      type: String,
      default: null,
    },
    method: {
      type: String,
      default: null,
    },
    statusCode: {
      type: Number,
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// auto-expire after 30 days so this collection never grows unbounded
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('Log', logSchema);
