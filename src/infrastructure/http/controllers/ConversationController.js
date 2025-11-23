/**
 * Controller: ConversationController
 */

const { ConversationRepository, UserRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');

class ConversationController {
  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.userRepository = new UserRepository();
  }

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const profileId = req.user.profileId;

      const result = await this.conversationRepository.findByProfileId(profileId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      const enrichedData = result.data.map(conv => {
        const data = conv.toJSON();
        const isParticipant1 = conv.participant1ProfileId === profileId;
        data.otherParticipant = isParticipant1 ? conv.participant2 : conv.participant1;
        data.unreadCount = isParticipant1 ? conv.unreadCount1 : conv.unreadCount2;
        return data;
      });

      res.json({ success: true, data: enrichedData, total: result.total, page: result.page, totalPages: result.totalPages });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const conversation = await this.conversationRepository.findById(id);

      if (!conversation) {
        throw new AppError('Conversación no encontrada', 404, 'CONVERSATION_NOT_FOUND');
      }

      if (!conversation.isParticipant(profileId)) {
        throw new AppError('Sin acceso', 403, 'ACCESS_DENIED');
      }

      res.json({ success: true, data: conversation.toJSON() });
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

      const { participantProfileId } = req.body;
      const myProfileId = req.user.profileId;

      if (participantProfileId === myProfileId) {
        throw new AppError('No puedes crear conversación contigo mismo', 400, 'INVALID_PARTICIPANT');
      }

      const otherUser = await this.userRepository.findByProfileId(participantProfileId);
      if (!otherUser) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      let conversation = await this.conversationRepository.findByParticipants(myProfileId, participantProfileId);
      
      if (conversation) {
        return res.json({ success: true, data: conversation.toJSON(), isExisting: true });
      }

      conversation = await this.conversationRepository.create({
        participant1ProfileId: myProfileId,
        participant2ProfileId: participantProfileId
      });

      res.status(201).json({ success: true, message: 'Conversación creada', data: conversation.toJSON(), isExisting: false });
    } catch (error) {
      next(error);
    }
  };

  archive = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const conversation = await this.conversationRepository.findById(id);
      if (!conversation || !conversation.isParticipant(profileId)) {
        throw new AppError('Sin acceso', 403, 'ACCESS_DENIED');
      }

      const isParticipant1 = conversation.participant1ProfileId === profileId;
      const updateData = isParticipant1 
        ? { participant1Status: 'archived' }
        : { participant2Status: 'archived' };

      const updated = await this.conversationRepository.update(id, updateData);
      res.json({ success: true, message: 'Archivada', data: updated.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const conversation = await this.conversationRepository.findById(id);
      if (!conversation || !conversation.isParticipant(profileId)) {
        throw new AppError('Sin acceso', 403, 'ACCESS_DENIED');
      }

      const updated = await this.conversationRepository.resetUnread(id, profileId);
      res.json({ success: true, message: 'Marcada como leída', data: updated.toJSON() });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ConversationController();