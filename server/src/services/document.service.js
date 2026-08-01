'use strict';

const path = require('path');
const documentRepository = require('../repositories/document.repository');
const historyRepository = require('../repositories/history.repository');
const aiRequestRepository = require('../repositories/aiRequest.repository');
const fastapiClient = require('./fastapiClient');
const ApiError = require('../utils/ApiError');
const { UPLOAD_STATUS, DOCUMENT_STATUS, AI_REQUEST_TYPE, AI_REQUEST_STATUS, HISTORY_ACTION, ROLES } = require('../utils/constants');
const logger = require('../config/logger');

class DocumentService {
  async upload(userId, file) {
    const upload = await documentRepository.createUpload({
      uploadedBy: userId,
      originalName: file.originalname,
      storedFileName: `${Date.now()}-${file.originalname}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      storagePath: 'in-memory', // multer memoryStorage - the buffer is streamed straight to FastAPI, never written to disk on this server
      status: UPLOAD_STATUS.PENDING,
    });

    const started = Date.now();
    let status = AI_REQUEST_STATUS.SUCCESS;
    let statusCode = 201;
    let errorMessage = null;
    let aiResult;

    try {
      aiResult = await fastapiClient.uploadDocument({
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        uploadedBy: userId.toString(),
      });
    } catch (error) {
      status = AI_REQUEST_STATUS.FAILED;
      statusCode = error.statusCode || 500;
      errorMessage = error.message;
      await documentRepository.updateUpload(upload._id, { status: UPLOAD_STATUS.FAILED, errorMessage: error.message });
      throw error;
    } finally {
      await aiRequestRepository.log({
        user: userId,
        type: AI_REQUEST_TYPE.UPLOAD,
        endpoint: '/upload',
        status,
        statusCode,
        durationMs: Date.now() - started,
        errorMessage,
      });
    }

    await documentRepository.updateUpload(upload._id, { status: UPLOAD_STATUS.COMPLETED });

    const document = await documentRepository.createDocument({
      upload: upload._id,
      owner: userId,
      aiDocumentId: aiResult.document_id,
      displayName: file.originalname,
      chunkCount: aiResult.chunk_count,
      vectorDbProvider: aiResult.vector_db_provider,
      status: DOCUMENT_STATUS.INDEXED,
      indexedAt: aiResult.indexed_at,
    });

    await historyRepository.record({
      user: userId,
      action: HISTORY_ACTION.UPLOAD,
      description: `Uploaded "${file.originalname}"`,
      document: document._id,
      metadata: { chunkCount: aiResult.chunk_count },
    });

    logger.info('Document uploaded and indexed', { userId, documentId: document._id.toString(), chunks: aiResult.chunk_count });
    return document;
  }

  async list(userId, query) {
    return documentRepository.findAllForUser(userId, query);
  }

  async listForAdmin(query) {
    return documentRepository.findAllForAdmin(query);
  }

  async remove(documentId, userId, userRole) {
    const document = await documentRepository.findDocumentById(documentId);
    if (!document) throw ApiError.notFound('Document not found.');

    const isOwner = document.owner.toString() === userId.toString();
    if (!isOwner && userRole !== ROLES.ADMIN) {
      throw ApiError.forbidden('You do not have permission to delete this document.');
    }

    await fastapiClient.deleteDocument(document.aiDocumentId);
    await documentRepository.softDelete(documentId);

    await historyRepository.record({
      user: userId,
      action: HISTORY_ACTION.DELETE_DOCUMENT,
      description: `Deleted "${document.displayName}"`,
    });

    logger.info('Document deleted', { documentId, userId });
  }

  /** Admin-only: rebuilds the AI service's entire vector index from scratch. */
  async rebuildVectorDb(userId) {
    const started = Date.now();
    let status = AI_REQUEST_STATUS.SUCCESS;
    let statusCode = 200;
    let errorMessage = null;
    let result;

    try {
      result = await fastapiClient.rebuildVectorDb();
    } catch (error) {
      status = AI_REQUEST_STATUS.FAILED;
      statusCode = error.statusCode || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await aiRequestRepository.log({
        user: userId,
        type: AI_REQUEST_TYPE.REBUILD_VECTOR_DB,
        endpoint: '/rebuild-vector-db',
        status,
        statusCode,
        durationMs: Date.now() - started,
        errorMessage,
      });
    }

    await historyRepository.record({
      user: userId,
      action: HISTORY_ACTION.REBUILD_VECTOR_DB,
      description: `Rebuilt vector index (${result.documents_processed} documents, ${result.total_chunks} chunks)`,
    });

    return result;
  }

  validateFile(file) {
    const config = require('../config/env');
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.upload.allowedExtensions.includes(ext)) {
      throw ApiError.badRequest(
        `File type '${ext}' is not supported. Allowed types: ${config.upload.allowedExtensions.join(', ')}`
      );
    }
    if (file.size > config.upload.maxSizeBytes) {
      throw ApiError.badRequest(`File exceeds the ${config.upload.maxSizeBytes / (1024 * 1024)}MB upload limit.`);
    }
  }
}

module.exports = new DocumentService();
