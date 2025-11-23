/**
 * Infrastructure Repository: UserRepository
 */

const { UserModel } = require('../database/models');
const User = require('../../domain/entities/User');
const { Op } = require('sequelize');

class UserRepository {
  
  async findById(id) {
    const user = await UserModel.findByPk(id);
    return user ? User.fromDatabase(user.toJSON()) : null;
  }

  async findByProfileId(profileId) {
    const user = await UserModel.findOne({
      where: { profile_id: profileId }
    });
    return user ? User.fromDatabase(user.toJSON()) : null;
  }

  async findAll(filters = {}) {
    const where = {};
    
    if (filters.isOnline !== undefined) where.is_online = filters.isOnline;
    if (filters.isActive !== undefined) where.is_active = filters.isActive;
    if (filters.search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${filters.search}%` } },
        { display_name: { [Op.like]: `%${filters.search}%` } }
      ];
    }

    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: rows.map(user => User.fromDatabase(user.toJSON())),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async create(userData) {
    const user = await UserModel.create({
      profile_id: userData.profileId,
      username: userData.username,
      display_name: userData.displayName,
      avatar_url: userData.avatarUrl,
      is_online: userData.isOnline || false,
      is_active: userData.isActive !== false
    });
    return User.fromDatabase(user.toJSON());
  }

  async update(id, userData) {
    const user = await UserModel.findByPk(id);
    if (!user) return null;

    const updateData = {};
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.displayName !== undefined) updateData.display_name = userData.displayName;
    if (userData.avatarUrl !== undefined) updateData.avatar_url = userData.avatarUrl;
    if (userData.isOnline !== undefined) updateData.is_online = userData.isOnline;
    if (userData.isActive !== undefined) updateData.is_active = userData.isActive;

    await user.update(updateData);
    return User.fromDatabase(user.toJSON());
  }

  async delete(id) {
    const user = await UserModel.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  async setOnlineStatus(profileId, isOnline) {
    const user = await UserModel.findOne({
      where: { profile_id: profileId }
    });
    if (!user) return null;

    await user.update({
      is_online: isOnline,
      last_seen_at: new Date()
    });
    return User.fromDatabase(user.toJSON());
  }
}

module.exports = UserRepository;