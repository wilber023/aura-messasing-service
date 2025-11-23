/**
 * Controller: MessageController
 */

const { MessageRepository, ConversationRepository, GroupRepository, GroupMemberRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');

class MessageController {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.conversationRepository = new ConversationRepository();
    this.groupRepository = new GroupRepository();
    this.groupMemberRepository = new GroupMemberRepository();
  }

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 50, conversationId, groupId, senderProfileId } = req.query;

      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        conversationId,
        groupId,
        senderProfileId,
        isDeleted: false
      };

      const result = await this.messageRepository.findAll(filters);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const message = await this.messageRepository.findById(id);

      if (!message) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      res.json({ success: true, data: message.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  getByConversation = async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const profileId = req.user.profileId;

      const conversation = await this.conversationRepository.findById(conversationId);
      if (!conversation) {
        throw new AppError('Conversación no encontrada', 404, 'CONVERSATION_NOT_FOUND');
      }

      if (!conversation.isParticipant(profileId)) {
        throw new AppError('No tienes acceso', 403, 'ACCESS_DENIED');
      }

      const result = await this.messageRepository.findByConversationId(conversationId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getByGroup = async (req, res, next) => {
    try {
      const { groupId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const profileId = req.user.profileId;

      const isMember = await this.groupMemberRepository.isMember(groupId, profileId);
      if (!isMember) {
        throw new AppError('No eres miembro', 403, 'NOT_A_MEMBER');
      }

      const result = await this.messageRepository.findByGroupId(groupId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { conversationId, groupId, content, messageType, mediaUrl, replyToId } = req.body;
      const senderProfileId = req.user.profileId;

      if ((!conversationId && !groupId) || (conversationId && groupId)) {
        throw new AppError('Especifica conversationId o groupId', 400, 'INVALID_TARGET');
      }

      if (conversationId) {
        const conversation = await this.conversationRepository.findById(conversationId);
        if (!conversation || !conversation.isParticipant(senderProfileId)) {
          throw new AppError('Sin acceso a conversación', 403, 'ACCESS_DENIED');
        }
      }

      if (groupId) {
        const isMember = await this.groupMemberRepository.isMember(groupId, senderProfileId);
        if (!isMember) {
          throw new AppError('No eres miembro', 403, 'NOT_A_MEMBER');
        }
      }

      const message = await this.messageRepository.create({
        conversationId,
        groupId,
        senderProfileId,
        content,
        messageType: messageType || 'text',
        mediaUrl,
        replyToId
      });

      if (conversationId) {
        const conversation = await this.conversationRepository.findById(conversationId);
        const otherParticipant = conversation.getOtherParticipant(senderProfileId);
        
        await this.conversationRepository.update(conversationId, {
          lastMessageId: message.id,
          lastMessageAt: new Date()
        });
        await this.conversationRepository.incrementUnread(conversationId, otherParticipant);
      }

      if (groupId) {
        await this.groupRepository.update(groupId, { lastMessageAt: new Date() });
        await this.groupMemberRepository.incrementUnreadForAll(groupId, senderProfileId);
      }

      res.status(201).json({ success: true, message: 'Mensaje enviado', data: message.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const profileId = req.user.profileId;

      const existingMessage = await this.messageRepository.findById(id);
      if (!existingMessage) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      if (existingMessage.senderProfileId !== profileId) {
        throw new AppError('No puedes editar este mensaje', 403, 'NOT_AUTHOR');
      }

      const message = await this.messageRepository.update(id, { content });

      res.json({ success: true, message: 'Mensaje actualizado', data: message.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const existingMessage = await this.messageRepository.findById(id);
      if (!existingMessage) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      if (existingMessage.senderProfileId !== profileId) {
        throw new AppError('No puedes eliminar este mensaje', 403, 'NOT_AUTHORIZED');
      }

      await this.messageRepository.delete(id);

      res.json({ success: true, message: 'Mensaje eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new MessageController();