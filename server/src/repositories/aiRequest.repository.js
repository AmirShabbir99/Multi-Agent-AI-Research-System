'use strict';

const AIRequest = require('../models/AIRequest.model');

class AIRequestRepository {
  log(data) {
    return AIRequest.create(data);
  }

  async findAll({ page = 1, limit = 30, type, status } = {}) {
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      AIRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email'),
      AIRequest.countDocuments(query),
    ]);
    return { requests, total, page, pages: Math.ceil(total / limit) };
  }

  async getStats(sinceDate) {
    return AIRequest.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: { type: '$type', status: '$status' },
          count: { $sum: 1 },
          avgDurationMs: { $avg: '$durationMs' },
        },
      },
    ]);
  }
}

module.exports = new AIRequestRepository();
