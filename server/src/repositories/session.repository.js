'use strict';

const Session = require('../models/Session.model');

class SessionRepository {
  create(data) {
    return Session.create(data);
  }

  findById(id) {
    return Session.findById(id);
  }

  findByIdForUser(id, userId) {
    return Session.findOne({ _id: id, user: userId });
  }

  async findAllForUser(userId, { page = 1, limit = 20, status } = {}) {
    const query = { user: userId };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      Session.find(query).sort({ lastMessageAt: -1 }).skip(skip).limit(limit),
      Session.countDocuments(query),
    ]);

    return { sessions, total, page, pages: Math.ceil(total / limit) };
  }

  updateById(id, update) {
    return Session.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  touch(id, { incrementMessages = 0 } = {}) {
    return Session.findByIdAndUpdate(id, {
      $set: { lastMessageAt: new Date() },
      $inc: { messageCount: incrementMessages },
    });
  }

  deleteById(id) {
    return Session.findByIdAndDelete(id);
  }

  countForUser(userId) {
    return Session.countDocuments({ user: userId });
  }
}

module.exports = new SessionRepository();
