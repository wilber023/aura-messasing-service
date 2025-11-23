/**
 * Infrastructure Repository: GroupMemberRepository
 */

const { GroupMemberModel, UserModel, GroupModel } = require('../database/models');
const { GroupMember, MEMBER_STATUS } = require('../../domain/entities/GroupMember');
const { Op } = require('sequelize');

class GroupMemberRepository {

  async findById(id) {
    const member = await GroupMemberModel.findByPk(id, {
      include: [
        { model: UserModel, as: 'user', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: GroupModel, as: 'group', attributes: ['id', 'name', 'group_type', 'image_url'] }
      ]
    });
    return member ? this._toEntity(member) : null;
  }

  async findByGroupId(groupId, options = {}) {
    const { page = 1, limit = 50, status = 'active' } = options;
    const offset = (page - 1) * limit;

    const where = { group_id: groupId };
    if (status) where.status = status;

    const { rows, count } = await GroupMemberModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'user', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] }
      ],
      limit,
      offset,
      order: [['role', 'ASC'], ['joined_at', 'ASC']]
    });

    return {
      data: rows.map(member => this._toEntity(member)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findByProfileId(profileId, options = {}) {
    const { page = 1, limit = 20, status = 'active', groupType } = options;
    const offset = (page - 1) * limit;

    const where = { profile_id: profileId, status };

    const include = [
      { 
        model: GroupModel, 
        as: 'group', 
        attributes: ['id', 'name', 'group_type', 'image_url', 'member_count', 'last_message_at'],
        where: groupType ? { group_type: groupType } : {}
      }
    ];

    const { rows, count } = await GroupMemberModel.findAndCountAll({
      where,
      include,
      limit,
      offset,
      order: [[{ model: GroupModel, as: 'group' }, 'last_message_at', 'DESC']]
    });

    return {
      data: rows.map(member => this._toEntity(member)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findMembership(groupId, profileId) {
    const member = await GroupMemberModel.findOne({
      where: { group_id: groupId, profile_id: profileId },
      include: [
        { model: UserModel, as: 'user', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] },
        { model: GroupModel, as: 'group', attributes: ['id', 'name', 'group_type', 'image_url'] }
      ]
    });
    return member ? this._toEntity(member) : null;
  }

  async findAll(filters = {}) {
    const where = {};
    if (filters.groupId) where.group_id = filters.groupId;
    if (filters.profileId) where.profile_id = filters.profileId;
    if (filters.role) where.role = filters.role;
    if (filters.status) where.status = filters.status;

    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const { rows, count } = await GroupMemberModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'user', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] },
        { model: GroupModel, as: 'group', attributes: ['id', 'name', 'group_type'] }
      ],
      limit,
      offset,
      order: [['joined_at', 'DESC']]
    });

    return {
      data: rows.map(member => this._toEntity(member)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async create(memberData) {
    const member = await GroupMemberModel.create({
      group_id: memberData.groupId,
      profile_id: memberData.profileId,
      role: memberData.role || 'member',
      status: memberData.status || 'active',
      nickname: memberData.nickname
    });

    return this.findById(member.id);
  }

  async update(id, memberData) {
    const member = await GroupMemberModel.findByPk(id);
    if (!member) return null;

    const updateData = {};
    if (memberData.role !== undefined) updateData.role = memberData.role;
    if (memberData.status !== undefined) updateData.status = memberData.status;
    if (memberData.nickname !== undefined) updateData.nickname = memberData.nickname;
    if (memberData.lastReadMessageId !== undefined) updateData.last_read_message_id = memberData.lastReadMessageId;
    if (memberData.unreadCount !== undefined) updateData.unread_count = memberData.unreadCount;
    if (memberData.mutedUntil !== undefined) updateData.muted_until = memberData.mutedUntil;

    await member.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const member = await GroupMemberModel.findByPk(id);
    if (!member) return false;
    await member.destroy();
    return true;
  }

  async isMember(groupId, profileId) {
    const count = await GroupMemberModel.count({
      where: {
        group_id: groupId,
        profile_id: profileId,
        status: { [Op.in]: [MEMBER_STATUS.ACTIVE, MEMBER_STATUS.MUTED] }
      }
    });
    return count > 0;
  }

  async updateLastRead(groupId, profileId, messageId) {
    const member = await GroupMemberModel.findOne({
      where: { group_id: groupId, profile_id: profileId }
    });
    
    if (!member) return null;

    await member.update({
      last_read_message_id: messageId,
      unread_count: 0
    });

    return this.findById(member.id);
  }

  async incrementUnreadForAll(groupId, exceptProfileId) {
    await GroupMemberModel.increment('unread_count', {
      where: {
        group_id: groupId,
        profile_id: { [Op.ne]: exceptProfileId },
        status: MEMBER_STATUS.ACTIVE
      }
    });
  }

  _toEntity(model) {
    const data = model.toJSON();
    const member = GroupMember.fromDatabase(data);

    if (data.user) {
      member.user = {
        id: data.user.id,
        profileId: data.user.profile_id,
        username: data.user.username,
        displayName: data.user.display_name,
        avatarUrl: data.user.avatar_url,
        isOnline: data.user.is_online
      };
    }

    if (data.group) {
      member.group = {
        id: data.group.id,
        name: data.group.name,
        groupType: data.group.group_type,
        imageUrl: data.group.image_url,
        memberCount: data.group.member_count,
        lastMessageAt: data.group.last_message_at
      };
    }

    return member;
  }
}

module.exports = GroupMemberRepository;