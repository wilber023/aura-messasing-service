/**
 * Infrastructure Repository: MessageRepository
 */

const { MessageModel, UserModel } = require('../database/models');
const { Message } = require('../../domain/entities/Message');
const { Op } = require('sequelize');

class MessageRepository {

  async findById(id) {
    const message = await MessageModel.findByPk(id, {
      include: [
        { model: UserModel, as: 'sender', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ]
    });
    return message ? this._toEntity(message) : null;
  }

  async findByConversationId(conversationId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;
    
    const { rows, count } = await MessageModel.findAndCountAll({
      where: { conversation_id: conversationId, is_deleted: false },
      include: [
        { model: UserModel, as: 'sender', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: rows.map(msg => this._toEntity(msg)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findByGroupId(groupId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;
    
    const { rows, count } = await MessageModel.findAndCountAll({
      where: { group_id: groupId, is_deleted: false },
      include: [
        { model: UserModel, as: 'sender', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: rows.map(msg => this._toEntity(msg)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findAll(filters = {}) {
    const where = {};
    
    if (filters.conversationId) where.conversation_id = filters.conversationId;
    if (filters.groupId) where.group_id = filters.groupId;
    if (filters.senderProfileId) where.sender_profile_id = filters.senderProfileId;
    if (filters.isDeleted !== undefined) where.is_deleted = filters.isDeleted;

    const { page = 1, limit = 50 } = filters;
    const offset = (page - 1) * limit;

    const { rows, count } = await MessageModel.findAndCountAll({
      where,
      include: [
        { model: UserModel, as: 'sender', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      data: rows.map(msg => this._toEntity(msg)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async create(messageData) {
    const message = await MessageModel.create({
      conversation_id: messageData.conversationId,
      group_id: messageData.groupId,
      sender_profile_id: messageData.senderProfileId,
      content: messageData.content,
      message_type: messageData.messageType || 'text',
      media_url: messageData.mediaUrl,
      reply_to_id: messageData.replyToId,
      metadata: messageData.metadata || {}
    });

    return this.findById(message.id);
  }

  async update(id, messageData) {
    const message = await MessageModel.findByPk(id);
    if (!message) return null;

    const updateData = {};
    if (messageData.content !== undefined) {
      updateData.content = messageData.content;
      updateData.is_edited = true;
    }
    if (messageData.status !== undefined) updateData.status = messageData.status;
    if (messageData.isDeleted !== undefined) updateData.is_deleted = messageData.isDeleted;

    await message.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const message = await MessageModel.findByPk(id);
    if (!message) return false;
    
    await message.update({
      is_deleted: true,
      content: 'Mensaje eliminado'
    });
    return true;
  }

  async markAsRead(ids, profileId) {
    await MessageModel.update(
      { status: 'read' },
      {
        where: {
          id: { [Op.in]: ids },
          sender_profile_id: { [Op.ne]: profileId }
        }
      }
    );
    return true;
  }

  _toEntity(model) {
    const data = model.toJSON();
    const message = Message.fromDatabase(data);
    
    if (data.sender) {
      message.sender = {
        id: data.sender.id,
        profileId: data.sender.profile_id,
        username: data.sender.username,
        displayName: data.sender.display_name,
        avatarUrl: data.sender.avatar_url
      };
    }

    return message;
  }
}

module.exports = MessageRepository;