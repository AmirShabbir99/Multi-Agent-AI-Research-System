'use strict';

const Chat = require('../models/Chat.model');

class ChatRepository {
  create(data) {
    return Chat.create(data);
  }

  createMany(docs) {
    return Chat.insertMany(docs);
  }

  async findBySession(sessionId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      Chat.find({ session: sessionId }).sort({ createdAt: 1 }).skip(skip).limit(limit),
      Chat.countDocuments({ session: sessionId }),
    ]);
    return { messages, total, page, pages: Math.ceil(total / limit) };
  }

  /** Most-recent-last, capped - used to build the `history` array forwarded to FastAPI. */
  async findRecentForPrompt(sessionId, maxTurns = 12) {
    const messages = await Chat.find({ session: sessionId, role: { $in: ['user', 'assistant'] } })
      .sort({ createdAt: -1 })
      .limit(maxTurns)
      .lean();
    return messages.reverse();
  }

  deleteBySession(sessionId) {
    return Chat.deleteMany({ session: sessionId });
  }
}

module.exports = new ChatRepository();
