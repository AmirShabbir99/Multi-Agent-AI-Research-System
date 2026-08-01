'use strict';

const User = require('../models/User.model');

class UserRepository {
  create(data) {
    return User.create(data);
  }

  findById(id) {
    return User.findById(id);
  }

  findByIdWithPassword(id) {
    return User.findById(id).select('+password');
  }

  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  async findAll({ page = 1, limit = 20, role, search } = {}) {
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  setLastLogin(id) {
    return User.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }

  deleteById(id) {
    return User.findByIdAndDelete(id);
  }

  countByRole(role) {
    return User.countDocuments({ role });
  }
}

module.exports = new UserRepository();
