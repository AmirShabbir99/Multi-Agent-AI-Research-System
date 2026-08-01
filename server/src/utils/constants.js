'use strict';

const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

const ALL_ROLES = Object.values(ROLES);

const DOCUMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  INDEXED: 'indexed',
  FAILED: 'failed',
  DELETED: 'deleted',
});

const UPLOAD_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

const CHAT_ROLE = Object.freeze({
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
});

const SESSION_STATUS = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

const AI_REQUEST_TYPE = Object.freeze({
  UPLOAD: 'upload',
  ASK: 'ask',
  CHAT: 'chat',
  SEARCH: 'search',
  SUMMARIZE: 'summarize',
  REBUILD_VECTOR_DB: 'rebuild_vector_db',
});

const AI_REQUEST_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILED: 'failed',
});

const HISTORY_ACTION = Object.freeze({
  UPLOAD: 'upload',
  ASK: 'ask',
  CHAT: 'chat',
  SEARCH: 'search',
  SUMMARIZE: 'summarize',
  DELETE_DOCUMENT: 'delete_document',
  REBUILD_VECTOR_DB: 'rebuild_vector_db',
  LOGIN: 'login',
  REGISTER: 'register',
});

module.exports = {
  ROLES,
  ALL_ROLES,
  DOCUMENT_STATUS,
  UPLOAD_STATUS,
  CHAT_ROLE,
  SESSION_STATUS,
  AI_REQUEST_TYPE,
  AI_REQUEST_STATUS,
  HISTORY_ACTION,
};
