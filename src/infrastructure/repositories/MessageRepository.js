/**
 * Repository: MessageRepository
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

  async findByConversation(conversationId, options = {}) {
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
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // 🔥 MÉTODO PRINCIPAL PARA OBTENER MENSAJES DE GRUPO
  async findByGroup(groupId, options = {}) {
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
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Alias para compatibilidad
  async findByGroupId(groupId, options = {}) {
    return this.findByGroup(groupId, options);
  }

  async findByConversationId(conversationId, options = {}) {
    return this.findByConversation(conversationId, options);
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
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
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

  async softDelete(id) {
    const message = await MessageModel.findByPk(id);
    if (!message) return false;
    
    await message.update({
      is_deleted: true,
      content: 'Mensaje eliminado'
    });
    return true;
  }

  async delete(id) {
    return this.softDelete(id);
  }

  async markConversationAsRead(conversationId, profileId) {
    await MessageModel.update(
      { status: 'read' },
      {
        where: {
          conversation_id: conversationId,
          sender_profile_id: { [Op.ne]: profileId },
          status: { [Op.ne]: 'read' }
        }
      }
    );
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

  async getLastMessage(groupId) {
    const message = await MessageModel.findOne({
      where: { group_id: groupId, is_deleted: false },
      order: [['created_at', 'DESC']]
    });
    return message ? this._toEntity(message) : null;
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