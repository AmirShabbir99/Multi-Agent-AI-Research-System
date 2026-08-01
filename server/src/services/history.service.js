'use strict';

const historyRepository = require('../repositories/history.repository');

class HistoryService {
  async list(userId, query) {
    return historyRepository.findForUser(userId, query);
  }
}

module.exports = new HistoryService();
