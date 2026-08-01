'use strict';

const fastapiClient = require('./fastapiClient');
const documentRepository = require('../repositories/document.repository');
const historyRepository = require('../repositories/history.repository');
const aiRequestRepository = require('../repositories/aiRequest.repository');
const ApiError = require('../utils/ApiError');
const { AI_REQUEST_TYPE, AI_REQUEST_STATUS, HISTORY_ACTION } = require('../utils/constants');

class AIOperationsService {
  async _withLogging({ userId, type, endpoint, historyAction, historyDescription, fn }) {
    const started = Date.now();
    let status = AI_REQUEST_STATUS.SUCCESS;
    let statusCode = 200;
    let errorMessage = null;
    let result;

    try {
      result = await fn();
      return result;
    } catch (error) {
      status = AI_REQUEST_STATUS.FAILED;
      statusCode = error.statusCode || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await aiRequestRepository.log({ user: userId, type, endpoint, status, statusCode, durationMs: Date.now() - started, errorMessage });
      if (status === AI_REQUEST_STATUS.SUCCESS && historyAction) {
        await historyRepository.record({ user: userId, action: historyAction, description: historyDescription });
      }
    }
  }

  async ask(userId, { query, sessionId, documentIds, mode, topK, allowWebSearch }) {
    return this._withLogging({
      userId,
      type: AI_REQUEST_TYPE.ASK,
      endpoint: '/ask',
      historyAction: HISTORY_ACTION.ASK,
      historyDescription: `Asked (${mode || 'quick'}): "${query.length > 80 ? `${query.slice(0, 77)}...` : query}"`,
      fn: () => fastapiClient.ask({ query, sessionId, documentIds, mode, topK, allowWebSearch }),
    });
  }

  async search(userId, { query, mode, documentIds, topK }) {
    return this._withLogging({
      userId,
      type: AI_REQUEST_TYPE.SEARCH,
      endpoint: '/search',
      historyAction: HISTORY_ACTION.SEARCH,
      historyDescription: `Searched (${mode || 'documents'}): "${query}"`,
      fn: () => fastapiClient.search({ query, mode, documentIds, topK }),
    });
  }

  async summarize(userId, { documentId, text, length }) {
    if (documentId) {
      const document = await documentRepository.findDocumentById(documentId);
      if (!document) throw ApiError.notFound('Document not found.');
      if (document.owner.toString() !== userId.toString()) {
        throw ApiError.forbidden('You do not have permission to summarize this document.');
      }

      const result = await this._withLogging({
        userId,
        type: AI_REQUEST_TYPE.SUMMARIZE,
        endpoint: '/summarize',
        historyAction: HISTORY_ACTION.SUMMARIZE,
        historyDescription: `Summarized "${document.displayName}"`,
        fn: () => fastapiClient.summarize({ documentId: document.aiDocumentId, length }),
      });

      await documentRepository.updateDocument(documentId, { cachedSummary: result.summary });
      return result;
    }

    return this._withLogging({
      userId,
      type: AI_REQUEST_TYPE.SUMMARIZE,
      endpoint: '/summarize',
      historyAction: HISTORY_ACTION.SUMMARIZE,
      historyDescription: 'Summarized pasted text',
      fn: () => fastapiClient.summarize({ text, length }),
    });
  }
}

module.exports = new AIOperationsService();
