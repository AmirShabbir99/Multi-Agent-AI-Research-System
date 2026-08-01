'use strict';

const History = require('../models/History.model');

class HistoryRepository {
  record(data) {
    return History.create(data);
  }

  async findForUser(userId, { page = 1, limit = 30, action } = {}) {
    const query = { user: userId };
    if (action) query.action = action;

    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      History.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      History.countDocuments(query),
    ]);

    return { entries, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new HistoryRepository();
