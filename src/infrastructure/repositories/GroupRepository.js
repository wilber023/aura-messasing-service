 
const { GroupModel, UserModel } = require('../database/models');
const { Group, GROUP_TYPES } = require('../../domain/entities/Group');
const { Op } = require('sequelize');

class GroupRepository {

  async findById(id) {
    const group = await GroupModel.findByPk(id, {
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ]
    });
    return group ? this._toEntity(group) : null;
  }
  async findByExternalId(externalId) {
    const group = await GroupModel.findOne({
      where: { external_id: externalId },
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ]
    });
    return group ? this._toEntity(group) : null;
  }

  async findByType(groupType, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await GroupModel.findAndCountAll({
      where: { group_type: groupType, status: 'active' },
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['member_count', 'DESC']]
    });

    return {
      data: rows.map(group => this._toEntity(group)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findPublicGroups(options = {}) {
    const { page = 1, limit = 20, search, groupType } = options;
    const offset = (page - 1) * limit;

    const where = { is_public: true, status: 'active' };
    if (groupType) where.group_type = groupType;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { rows, count } = await GroupModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['member_count', 'DESC']]
    });

    return {
      data: rows.map(group => this._toEntity(group)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findActivities(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const where = {
      group_type: GROUP_TYPES.ACTIVITY,
      status: 'active',
      is_public: true
    };

    if (options.upcoming) {
      where.scheduled_at = { [Op.gte]: new Date() };
    }

    const { rows, count } = await GroupModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['scheduled_at', 'ASC']]
    });

    return {
      data: rows.map(group => this._toEntity(group)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.groupType) where.group_type = filters.groupType;
    if (filters.creatorProfileId) where.creator_profile_id = filters.creatorProfileId;
    if (filters.status) where.status = filters.status;
    if (filters.isPublic !== undefined) where.is_public = filters.isPublic;

    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { rows, count } = await GroupModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'creator', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: rows.map(group => this._toEntity(group)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async create(groupData) {
    const group = await GroupModel.create({
      name: groupData.name,
      description: groupData.description,
      image_url: groupData.imageUrl,
      group_type: groupData.groupType || GROUP_TYPES.COMMUNITY,
      creator_profile_id: groupData.creatorProfileId,
      external_id: groupData.externalId,
      max_members: groupData.maxMembers,
      is_public: groupData.isPublic !== false,
      settings: JSON.stringify(groupData.settings || {}),
      location: groupData.location,
      scheduled_at: groupData.scheduledAt
    });

    return this.findById(group.id);
  }

  async update(id, groupData) {
    const group = await GroupModel.findByPk(id);
    if (!group) return null;

    const updateData = {};
    if (groupData.name !== undefined) updateData.name = groupData.name;
    if (groupData.description !== undefined) updateData.description = groupData.description;
    if (groupData.imageUrl !== undefined) updateData.image_url = groupData.imageUrl;
    if (groupData.maxMembers !== undefined) updateData.max_members = groupData.maxMembers;
    if (groupData.isPublic !== undefined) updateData.is_public = groupData.isPublic;
    if (groupData.status !== undefined) updateData.status = groupData.status;
    if (groupData.memberCount !== undefined) updateData.member_count = groupData.memberCount;
    if (groupData.lastMessageAt !== undefined) updateData.last_message_at = groupData.lastMessageAt;
    if (groupData.location !== undefined) updateData.location = groupData.location;
    if (groupData.scheduledAt !== undefined) updateData.scheduled_at = groupData.scheduledAt;

    await group.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const group = await GroupModel.findByPk(id);
    if (!group) return false;
    await group.destroy();
    return true;
  }

  async incrementMemberCount(id) {
    const group = await GroupModel.findByPk(id);
    if (!group) return null;
    await group.increment('member_count');
    return this.findById(id);
  }

  async decrementMemberCount(id) {
    const group = await GroupModel.findByPk(id);
    if (!group) return null;
    await group.decrement('member_count');
    return this.findById(id);
  }

  _toEntity(model) {
    const data = model.toJSON();
    const group = Group.fromDatabase(data);

    if (data.creator) {
      group.creator = {
        id: data.creator.id,
        profileId: data.creator.profile_id,
        username: data.creator.username,
        displayName: data.creator.display_name,
        avatarUrl: data.creator.avatar_url
      };
    }

    return group;
  }
}

module.exports = GroupRepository;