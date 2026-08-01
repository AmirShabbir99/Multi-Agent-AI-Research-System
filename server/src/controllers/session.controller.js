'use strict';

const sessionService = require('../services/session.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const create = asyncHandler(async (req, res) => {
  const session = await sessionService.create(req.user._id, req.body);
  return new ApiResponse(201, 'Session created.', session).send(res);
});

const list = asyncHandler(async (req, res) => {
  const result = await sessionService.list(req.user._id, req.query);
  return new ApiResponse(200, 'Sessions retrieved.', result.sessions, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

const getOne = asyncHandler(async (req, res) => {
  const session = await sessionService.getOwned(req.params.id, req.user._id);
  return new ApiResponse(200, 'Session retrieved.', session).send(res);
});

const rename = asyncHandler(async (req, res) => {
  const session = await sessionService.rename(req.params.id, req.user._id, req.body.title);
  return new ApiResponse(200, 'Session renamed.', session).send(res);
});

const archive = asyncHandler(async (req, res) => {
  const session = await sessionService.archive(req.params.id, req.user._id);
  return new ApiResponse(200, 'Session archived.', session).send(res);
});

const remove = asyncHandler(async (req, res) => {
  await sessionService.remove(req.params.id, req.user._id);
  return new ApiResponse(200, 'Session deleted.').send(res);
});

const getMessages = asyncHandler(async (req, res) => {
  const result = await sessionService.getMessages(req.params.id, req.user._id, req.query);
  return new ApiResponse(200, 'Messages retrieved.', result.messages, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

module.exports = { create, list, getOne, rename, archive, remove, getMessages };
