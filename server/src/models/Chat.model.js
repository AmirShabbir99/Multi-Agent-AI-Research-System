'use strict';

const mongoose = require('mongoose');
const { CHAT_ROLE } = require('../utils/constants');

const { Schema } = mongoose;

const sourceChunkSchema = new Schema(
  {
    documentId: String,
    documentName: String,
    chunkId: String,
    content: String,
    score: Number,
  },
  { _id: false }
);

const webSourceSchema = new Schema(
  {
    title: String,
    url: String,
    snippet: String,
  },
  { _id: false }
);

const chatSchema = new Schema(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(CHAT_ROLE),
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ['quick', 'research'],
      default: 'quick',
    },
    // Populated only for assistant messages produced in 'research' mode -
    // the full 4-agent pipeline output (search results, scraped content, critique).
    researchData: {
      topic: String,
      searchResults: String,
      scrapedContent: String,
      critique: String,
    },
    sources: [sourceChunkSchema],
    webSources: [webSourceSchema],
    toolsUsed: [String],
  },
  { timestamps: true }
);

chatSchema.index({ session: 1, createdAt: 1 });

module.exports = mongoose.model('Chat', chatSchema);
