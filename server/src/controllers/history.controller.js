'use strict';

const historyService = require('../services/history.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const list = asyncHandler(async (req, res) => {
  const result = await historyService.list(req.user._id, req.query);
  return new ApiResponse(200, 'History retrieved.', result.entries, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

module.exports = { list };
