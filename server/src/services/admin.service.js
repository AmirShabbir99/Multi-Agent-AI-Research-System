'use strict';

const User = require('../models/User.model');
const Document = require('../models/Document.model');
const Session = require('../models/Session.model');
const Log = require('../models/Log.model');
const aiRequestRepository = require('../repositories/aiRequest.repository');
const fastapiClient = require('./fastapiClient');
const { ROLES } = require('../utils/constants');

class AdminService {
  async getOverview() {
    const sinceLast7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalAdmins, totalDocuments, totalSessions, aiStats, recentLogs, aiServiceHealth] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.ADMIN }),
      Document.countDocuments({ isDeleted: false }),
      Session.countDocuments(),
      aiRequestRepository.getStats(sinceLast7Days),
      Log.find().sort({ createdAt: -1 }).limit(10),
      fastapiClient.health().catch((err) => ({ status: 'down', detail: err.message })),
    ]);

    return {
      totals: { users: totalUsers, admins: totalAdmins, documents: totalDocuments, sessions: totalSessions },
      aiRequestStats: aiStats,
      recentErrorLogs: recentLogs,
      aiServiceHealth,
    };
  }

  async listAiRequests(query) {
    return aiRequestRepository.findAll(query);
  }

  async listErrorLogs({ page = 1, limit = 30 } = {}) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      Log.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Log.countDocuments(),
    ]);
    return { logs, total, page, pages: Math.ceil(total / limit) };
  }
}

module.exports = new AdminService();
