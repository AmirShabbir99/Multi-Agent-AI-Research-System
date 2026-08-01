'use strict';

const mongoose = require('mongoose');
const { HISTORY_ACTION } = require('../utils/constants');

const { Schema } = mongoose;

const historySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: Object.values(HISTORY_ACTION),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    document: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

historySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('History', historySchema);
