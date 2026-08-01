'use strict';

const sessionRepository = require('../repositories/session.repository');
const chatRepository = require('../repositories/chat.repository');
const ApiError = require('../utils/ApiError');

class SessionService {
  async create(userId, { title, documentIds }) {
    return sessionRepository.create({
      user: userId,
      title: title || 'New conversation',
      documentIds: documentIds || [],
    });
  }

  async list(userId, query) {
    return sessionRepository.findAllForUser(userId, query);
  }

  async getOwned(sessionId, userId) {
    const session = await sessionRepository.findByIdForUser(sessionId, userId);
    if (!session) throw ApiError.notFound('Session not found.');
    return session;
  }

  async rename(sessionId, userId, title) {
    await this.getOwned(sessionId, userId);
    return sessionRepository.updateById(sessionId, { title });
  }

  async archive(sessionId, userId) {
    await this.getOwned(sessionId, userId);
    return sessionRepository.updateById(sessionId, { status: 'archived' });
  }

  async remove(sessionId, userId) {
    await this.getOwned(sessionId, userId);
    await chatRepository.deleteBySession(sessionId);
    await sessionRepository.deleteById(sessionId);
  }

  async getMessages(sessionId, userId, pagination) {
    await this.getOwned(sessionId, userId);
    return chatRepository.findBySession(sessionId, pagination);
  }
}

module.exports = new SessionService();
