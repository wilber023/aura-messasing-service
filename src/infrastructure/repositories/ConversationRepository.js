/**
 * Infrastructure Repository: ConversationRepository
 */

const { ConversationModel, UserModel, MessageModel } = require('../database/models');
const { Conversation } = require('../../domain/entities/Conversation');
const { Op } = require('sequelize');

class ConversationRepository {

  async findById(id) {
    const conversation = await ConversationModel.findByPk(id, {
      include: [
        { model: UserModel, as: 'participant1', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: UserModel, as: 'participant2', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: MessageModel, as: 'lastMessage', attributes: ['id', 'content', 'message_type', 'created_at'] }
      ]
    });
    return conversation ? this._toEntity(conversation) : null;
  }

  async findByParticipants(profileId1, profileId2) {
    const conversation = await ConversationModel.findOne({
      where: {
        [Op.or]: [
          { participant1_profile_id: profileId1, participant2_profile_id: profileId2 },
          { participant1_profile_id: profileId2, participant2_profile_id: profileId1 }
        ]
      },
      include: [
        { model: UserModel, as: 'participant1', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: UserModel, as: 'participant2', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] }
      ]
    });
    return conversation ? this._toEntity(conversation) : null;
  }

  async findByProfileId(profileId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { rows, count } = await ConversationModel.findAndCountAll({
      where: {
        [Op.or]: [
          { participant1_profile_id: profileId },
          { participant2_profile_id: profileId }
        ]
      },
      include: [
        { model: UserModel, as: 'participant1', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: UserModel, as: 'participant2', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url', 'is_online'] },
        { model: MessageModel, as: 'lastMessage', attributes: ['id', 'content', 'message_type', 'created_at'] }
      ],
      limit,
      offset,
      order: [['last_message_at', 'DESC']]
    });

    return {
      data: rows.map(conv => this._toEntity(conv)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findAll(filters = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { rows, count } = await ConversationModel.findAndCountAll({
      include: [
        { model: UserModel, as: 'participant1', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] },
        { model: UserModel, as: 'participant2', attributes: ['id', 'profile_id', 'username', 'display_name', 'avatar_url'] }
      ],
      limit,
      offset,
      order: [['last_message_at', 'DESC']]
    });

    return {
      data: rows.map(conv => this._toEntity(conv)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async create(conversationData) {
    const [id1, id2] = [conversationData.participant1ProfileId, conversationData.participant2ProfileId].sort();
    
    const conversation = await ConversationModel.create({
      participant1_profile_id: id1,
      participant2_profile_id: id2
    });

    return this.findById(conversation.id);
  }

  async update(id, conversationData) {
    const conversation = await ConversationModel.findByPk(id);
    if (!conversation) return null;

    const updateData = {};
    if (conversationData.lastMessageId !== undefined) updateData.last_message_id = conversationData.lastMessageId;
    if (conversationData.lastMessageAt !== undefined) updateData.last_message_at = conversationData.lastMessageAt;
    if (conversationData.participant1Status !== undefined) updateData.participant1_status = conversationData.participant1Status;
    if (conversationData.participant2Status !== undefined) updateData.participant2_status = conversationData.participant2Status;
    if (conversationData.unreadCount1 !== undefined) updateData.unread_count_1 = conversationData.unreadCount1;
    if (conversationData.unreadCount2 !== undefined) updateData.unread_count_2 = conversationData.unreadCount2;

    await conversation.update(updateData);
    return this.findById(id);
  }

  async incrementUnread(conversationId, forProfileId) {
    const conversation = await ConversationModel.findByPk(conversationId);
    if (!conversation) return null;

    if (conversation.participant1_profile_id === forProfileId) {
      await conversation.increment('unread_count_1');
    } else {
      await conversation.increment('unread_count_2');
    }

    return this.findById(conversationId);
  }

  async resetUnread(conversationId, forProfileId) {
    const conversation = await ConversationModel.findByPk(conversationId);
    if (!conversation) return null;

    if (conversation.participant1_profile_id === forProfileId) {
      await conversation.update({ unread_count_1: 0 });
    } else {
      await conversation.update({ unread_count_2: 0 });
    }

    return this.findById(conversationId);
  }

  _toEntity(model) {
    const data = model.toJSON();
    const conversation = Conversation.fromDatabase(data);

    if (data.participant1) {
      conversation.participant1 = {
        id: data.participant1.id,
        profileId: data.participant1.profile_id,
        username: data.participant1.username,
        displayName: data.participant1.display_name,
        avatarUrl: data.participant1.avatar_url,
        isOnline: data.participant1.is_online
      };
    }

    if (data.participant2) {
      conversation.participant2 = {
        id: data.participant2.id,
        profileId: data.participant2.profile_id,
        username: data.participant2.username,
        displayName: data.participant2.display_name,
        avatarUrl: data.participant2.avatar_url,
        isOnline: data.participant2.is_online
      };
    }

    if (data.lastMessage) {
      conversation.lastMessage = {
        id: data.lastMessage.id,
        content: data.lastMessage.content,
        messageType: data.lastMessage.message_type,
        createdAt: data.lastMessage.created_at
      };
    }

    return conversation;
  }
}

module.exports = ConversationRepository;