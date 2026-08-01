'use strict';

const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.register(req.body);
  return new ApiResponse(201, 'Account created successfully.', { user, token }).send(res);
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  return new ApiResponse(200, 'Logged in successfully.', { user, token }).send(res);
});

// Single stateless JWT - there is no server-side session to revoke, so logout
// is purely a client-side action (discard the stored token). This endpoint
// exists for API symmetry and so a History entry can be recorded from the client.
const logout = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Logged out successfully.').send(res);
});

const me = asyncHandler(async (req, res) => {
  return new ApiResponse(200, 'Current user retrieved.', req.user.toSafeObject()).send(res);
});

module.exports = { register, login, logout, me };
