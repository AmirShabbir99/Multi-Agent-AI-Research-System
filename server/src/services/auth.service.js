'use strict';

const userRepository = require('../repositories/user.repository');
const historyRepository = require('../repositories/history.repository');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/tokens');
const { HISTORY_ACTION } = require('../utils/constants');
const logger = require('../config/logger');

class AuthService {
  async register({ name, email, password }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists.');
    }

    const user = await userRepository.create({ name, email, password });
    const token = signToken(user);

    await historyRepository.record({
      user: user._id,
      action: HISTORY_ACTION.REGISTER,
      description: 'Account created',
    });

    logger.info('New user registered', { userId: user._id.toString(), email: user.email });
    return { user: user.toSafeObject(), token };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmailWithPassword(email);
    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password.');
    }
    if (!user.isActive) {
      throw ApiError.forbidden('This account has been deactivated. Contact an administrator.');
    }

    const token = signToken(user);
    await userRepository.setLastLogin(user._id);

    await historyRepository.record({
      user: user._id,
      action: HISTORY_ACTION.LOGIN,
      description: 'Signed in',
    });

    logger.info('User logged in', { userId: user._id.toString() });
    return { user: user.toSafeObject(), token };
  }
}

module.exports = new AuthService();
