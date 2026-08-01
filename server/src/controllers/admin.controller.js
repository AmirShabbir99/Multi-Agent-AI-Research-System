'use strict';

const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await adminService.getOverview();
  return new ApiResponse(200, 'Overview retrieved.', overview).send(res);
});

const listAiRequests = asyncHandler(async (req, res) => {
  const result = await adminService.listAiRequests(req.query);
  return new ApiResponse(200, 'AI requests retrieved.', result.requests, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

const listErrorLogs = asyncHandler(async (req, res) => {
  const result = await adminService.listErrorLogs(req.query);
  return new ApiResponse(200, 'Error logs retrieved.', result.logs, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

module.exports = { getOverview, listAiRequests, listErrorLogs };
