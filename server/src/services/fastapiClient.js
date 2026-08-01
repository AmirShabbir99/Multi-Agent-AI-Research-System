'use strict';

const axios = require('axios');
const FormData = require('form-data');
const config = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const client = axios.create({
  baseURL: config.aiService.baseUrl,
  timeout: config.aiService.timeoutMs,
  headers: { 'X-Internal-Api-Key': config.aiService.apiKey },
});

/**
 * Normalizes any failure talking to the AI service into an ApiError with a
 * consistent shape, whether it's a validation error FastAPI returned, a
 * network failure, or a timeout.
 */
function normalizeError(error) {
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.message || 'The AI service returned an error.';
    const errorCode = data?.error_code || 'ai_service_error';
    logger.warn('AI service returned an error response', { status, errorCode, message });
    // Map the AI service's status code through, except 401 (internal misconfig) which
    // should never leak to the client as "you're unauthorized" - it's our fault, not theirs.
    const statusCode = status === 401 ? 502 : status;
    return new ApiError(statusCode, message, errorCode, data?.details || null);
  }
  if (error.code === 'ECONNABORTED') {
    logger.error('AI service request timed out', { message: error.message });
    return ApiError.badGateway('The AI service took too long to respond. Please try again.');
  }
  logger.error('AI service unreachable', { message: error.message });
  return ApiError.badGateway('The AI service is currently unreachable.');
}

class AIService {
  async uploadDocument({ buffer, filename, mimeType, uploadedBy }) {
    try {
      const form = new FormData();
      form.append('file', buffer, { filename, contentType: mimeType });
      if (uploadedBy) form.append('uploaded_by', uploadedBy);

      const { data } = await client.post('/upload', form, { headers: form.getHeaders() });
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async ask({ query, sessionId, documentIds, mode, topK, allowWebSearch }) {
    try {
      const { data } = await client.post('/ask', {
        query,
        session_id: sessionId,
        document_ids: documentIds || [],
        mode: mode || 'quick',
        top_k: topK || 5,
        allow_web_search: allowWebSearch !== false,
      });
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async chat({ sessionId, message, history, documentIds, allowWebSearch }) {
    try {
      const { data } = await client.post('/chat', {
        session_id: sessionId,
        message,
        history: history || [],
        document_ids: documentIds || [],
        allow_web_search: allowWebSearch !== false,
      });
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async search({ query, mode, documentIds, topK }) {
    try {
      const { data } = await client.post('/search', {
        query,
        mode: mode || 'documents',
        document_ids: documentIds || [],
        top_k: topK || 5,
      });
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async summarize({ documentId, text, length }) {
    try {
      const { data } = await client.post('/summarize', {
        document_id: documentId || undefined,
        text: text || undefined,
        length: length || 'medium',
      });
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async listDocuments() {
    try {
      const { data } = await client.get('/documents');
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteDocument(aiDocumentId) {
    try {
      const { data } = await client.delete(`/documents/${encodeURIComponent(aiDocumentId)}`);
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async rebuildVectorDb() {
    try {
      const { data } = await client.post('/rebuild-vector-db');
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async health() {
    try {
      const { data } = await client.get('/health');
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getHistory(sessionId) {
    try {
      const { data } = await client.get(`/history/${encodeURIComponent(sessionId)}`);
      return data.data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

module.exports = new AIService();
