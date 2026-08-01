'use strict';

const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  return new ApiResponse(200, 'Profile retrieved.', user).send(res);
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return new ApiResponse(200, 'Profile updated.', user).send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  return new ApiResponse(200, 'Password changed successfully.').send(res);
});

// ── Admin-only ───────────────────────────────────────────────
const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return new ApiResponse(200, 'Users retrieved.', result.users, {
    total: result.total,
    page: result.page,
    pages: result.pages,
  }).send(res);
});

const setRole = asyncHandler(async (req, res) => {
  const user = await userService.setRole(req.params.id, req.body.role);
  return new ApiResponse(200, 'User role updated.', user).send(res);
});

const setActiveStatus = asyncHandler(async (req, res) => {
  const user = await userService.setActiveStatus(req.params.id, req.body.isActive);
  return new ApiResponse(200, 'User status updated.', user).send(res);
});

module.exports = { getProfile, updateProfile, changePassword, listUsers, setRole, setActiveStatus };
