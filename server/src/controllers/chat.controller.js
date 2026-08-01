'use strict';

const chatService = require('../services/chat.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage(req.user._id, req.params.id, req.body);
  return new ApiResponse(200, 'Message sent.', result).send(res);
});

module.exports = { sendMessage };
