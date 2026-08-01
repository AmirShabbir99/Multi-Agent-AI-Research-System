'use strict';

const documentService = require('../services/document.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file was uploaded. Attach a file under the "file" field.');
  const document = await documentService.upload(req.user._id, req.file);
  return new ApiResponse(201, 'Document uploaded and indexed successfully.', document).send(res);
});

const list = asyncHandler(async (req, res) => {
  const result = await documentService.list(req.user._id, req.query);
  return new ApiResponse(200, 'Documents retrieved.', result.documents, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

const listAllForAdmin = asyncHandler(async (req, res) => {
  const result = await documentService.listForAdmin(req.query);
  return new ApiResponse(200, 'All documents retrieved.', result.documents, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await documentService.remove(req.params.id, req.user._id, req.user.role);
  return new ApiResponse(200, 'Document deleted.').send(res);
});

const rebuildVectorDb = asyncHandler(async (req, res) => {
  const result = await documentService.rebuildVectorDb(req.user._id);
  return new ApiResponse(200, 'Vector database rebuilt successfully.', result).send(res);
});

module.exports = { upload, list, listAllForAdmin, remove, rebuildVectorDb };
