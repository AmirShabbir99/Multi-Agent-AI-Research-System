'use strict';

const userRepository = require('../repositories/user.repository');
const ApiError = require('../utils/ApiError');

class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');
    return user.toSafeObject();
  }

  async updateProfile(userId, { name, avatarUrl }) {
    const update = {};
    if (name !== undefined) update.name = name;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const user = await userRepository.updateById(userId, update);
    if (!user) throw ApiError.notFound('User not found.');
    return user.toSafeObject();
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found.');

    const matches = await user.comparePassword(currentPassword);
    if (!matches) throw ApiError.badRequest('Current password is incorrect.');

    user.password = newPassword;
    await user.save();
  }

  // ── Admin-only ───────────────────────────────────────────────
  async listUsers(query) {
    const result = await userRepository.findAll(query);
    return { ...result, users: result.users.map((u) => u.toSafeObject()) };
  }

  async setRole(userId, role) {
    const user = await userRepository.updateById(userId, { role });
    if (!user) throw ApiError.notFound('User not found.');
    return user.toSafeObject();
  }

  async setActiveStatus(userId, isActive) {
    const user = await userRepository.updateById(userId, { isActive });
    if (!user) throw ApiError.notFound('User not found.');
    return user.toSafeObject();
  }
}

module.exports = new UserService();
