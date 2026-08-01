'use strict';

const sessionRepository = require('../repositories/session.repository');
const chatRepository = require('../repositories/chat.repository');
const historyRepository = require('../repositories/history.repository');
const aiRequestRepository = require('../repositories/aiRequest.repository');
const fastapiClient = require('./fastapiClient');
const ApiError = require('../utils/ApiError');
const { CHAT_ROLE, AI_REQUEST_TYPE, AI_REQUEST_STATUS, HISTORY_ACTION } = require('../utils/constants');
const logger = require('../config/logger');

const MAX_HISTORY_TURNS = 12;

class ChatService {
  async sendMessage(userId, sessionId, { message, mode = 'quick', documentIds, allowWebSearch }) {
    const session = await sessionRepository.findByIdForUser(sessionId, userId);
    if (!session) throw ApiError.notFound('Session not found.');

    await chatRepository.create({ session: sessionId, user: userId, role: CHAT_ROLE.USER, content: message, mode });

    const effectiveDocumentIds = documentIds && documentIds.length ? documentIds : session.documentIds;

    const started = Date.now();
    let status = AI_REQUEST_STATUS.SUCCESS;
    let statusCode = 200;
    let errorMessage = null;
    let assistantDoc;

    try {
      if (mode === 'research') {
        const result = await fastapiClient.ask({
          query: message,
          sessionId,
          mode: 'research',
          documentIds: effectiveDocumentIds,
          allowWebSearch,
        });
        assistantDoc = {
          content: result.report,
          mode: 'research',
          researchData: {
            topic: result.topic,
            searchResults: result.search_results,
            scrapedContent: result.scraped_content,
            critique: result.critique,
          },
          sources: [],
          webSources: (result.web_sources || []).map((w) => ({ title: w.title, url: w.url, snippet: w.snippet })),
          toolsUsed: ['web_search', 'scrape_url'],
        };
      } else {
        const priorTurns = await chatRepository.findRecentForPrompt(sessionId, MAX_HISTORY_TURNS);
        const history = priorTurns
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({ role: m.role, content: m.content }));

        const result = await fastapiClient.chat({
          sessionId,
          message,
          history,
          documentIds: effectiveDocumentIds,
          allowWebSearch,
        });
        assistantDoc = {
          content: result.reply,
          mode: 'quick',
          sources: (result.sources || []).map((s) => ({
            documentId: s.document_id,
            documentName: s.document_name,
            chunkId: s.chunk_id,
            content: s.content,
            score: s.score,
          })),
          webSources: (result.web_sources || []).map((w) => ({ title: w.title, url: w.url, snippet: w.snippet })),
          toolsUsed: result.tools_used || [],
        };
      }
    } catch (error) {
      status = AI_REQUEST_STATUS.FAILED;
      statusCode = error.statusCode || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await aiRequestRepository.log({
        user: userId,
        type: mode === 'research' ? AI_REQUEST_TYPE.ASK : AI_REQUEST_TYPE.CHAT,
        endpoint: mode === 'research' ? '/ask' : '/chat',
        status,
        statusCode,
        durationMs: Date.now() - started,
        errorMessage,
      });
    }

    const assistantMessage = await chatRepository.create({
      session: sessionId,
      user: userId,
      role: CHAT_ROLE.ASSISTANT,
      ...assistantDoc,
    });

    await sessionRepository.touch(sessionId, { incrementMessages: 2 });

    // auto-title a fresh conversation from its first message
    if (session.messageCount === 0 && session.title === 'New conversation') {
      const autoTitle = message.length > 60 ? `${message.slice(0, 57)}...` : message;
      await sessionRepository.updateById(sessionId, { title: autoTitle });
    }

    await historyRepository.record({
      user: userId,
      action: mode === 'research' ? HISTORY_ACTION.ASK : HISTORY_ACTION.CHAT,
      description:
        mode === 'research'
          ? `Requested a research report: "${message.length > 80 ? `${message.slice(0, 77)}...` : message}"`
          : `Asked: "${message.length > 80 ? `${message.slice(0, 77)}...` : message}"`,
      session: sessionId,
    });

    logger.info('Chat message processed', { userId, sessionId, mode });

    return {
      sessionId,
      userMessage: message,
      assistantMessage: assistantMessage.toObject(),
    };
  }
}

module.exports = new ChatService();
