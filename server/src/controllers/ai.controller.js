'use strict';

const aiService = require('../services/ai.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const ask = asyncHandler(async (req, res) => {
  const result = await aiService.ask(req.user._id, req.body);
  return new ApiResponse(200, 'Answer generated.', result).send(res);
});

const search = asyncHandler(async (req, res) => {
  const result = await aiService.search(req.user._id, req.body);
  return new ApiResponse(200, 'Search completed.', result).send(res);
});

const summarize = asyncHandler(async (req, res) => {
  const result = await aiService.summarize(req.user._id, req.body);
  return new ApiResponse(200, 'Summary generated.', result).send(res);
});

module.exports = { ask, search, summarize };
