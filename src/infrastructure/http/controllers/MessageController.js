/**
 * Controller: MessageController
 */

const { MessageRepository, GroupMemberRepository, GroupRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');

class MessageController {
  constructor() {
    this.messageRepository = new MessageRepository();
    this.groupMemberRepository = new GroupMemberRepository();
    this.groupRepository = new GroupRepository();
  }

  // Obtener mensajes de una conversación 1-a-1
  getByConversation = async (req, res, next) => {
    try {
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const profileId = req.user.profileId;

      console.log(`📥 Obteniendo mensajes de conversación: ${conversationId}`);

      // Verificar que el usuario sea parte de la conversación
      // (esto debería hacerse en ConversationRepository)

      const result = await this.messageRepository.findByConversation(conversationId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      next(error);
    }
  };

  // Obtener mensajes de un grupo
  getByGroup = async (req, res, next) => {
    try {
      console.log('\n📥 GET MESSAGES BY GROUP');
      
      const { groupId } = req.params; // Este es el externalId (communityId)
      const { page = 1, limit = 50 } = req.query;
      const profileId = req.user.profileId;

      console.log(`📍 Group ID (external): ${groupId}`);
      console.log(`👤 Profile ID: ${profileId}`);

      // 🔥 BUSCAR EL GRUPO POR EXTERNAL_ID
      console.log('🔍 Buscando grupo por external_id...');
      const group = await this.groupRepository.findByExternalId(groupId);
      
      if (!group) {
        console.log('❌ Grupo no encontrado');
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const internalGroupId = group.id; // Este es el ID interno
      console.log(`✅ Grupo encontrado: ${group.name}`);
      console.log(`📌 ID interno: ${internalGroupId}`);

      // Verificar membresía usando el ID interno
      console.log('🔍 Verificando membresía...');
      const isMember = await this.groupMemberRepository.isMember(internalGroupId, profileId);
      
      if (!isMember) {
        console.log('❌ Usuario no es miembro del grupo');
        throw new AppError('No eres miembro', 403, 'NOT_A_MEMBER');
      }

      console.log('✅ Usuario es miembro, obteniendo mensajes...');

      // Obtener mensajes usando el ID interno
      const result = await this.messageRepository.findByGroup(internalGroupId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      console.log(`✅ ${result.data.length} mensajes obtenidos`);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('❌ Error en getByGroup:', error);
      next(error);
    }
  };

  // Obtener un mensaje por ID
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const message = await this.messageRepository.findById(id);

      if (!message) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      // Verificar permisos (si es parte de la conversación o grupo)
      // TODO: Implementar verificación de permisos

      res.json({
        success: true,
        data: message.toJSON()
      });

    } catch (error) {
      next(error);
    }
  };

  // Crear un nuevo mensaje
  create = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { conversationId, groupId, content, messageType, mediaUrl, replyToId } = req.body;
      const senderProfileId = req.user.profileId;

      console.log(`📤 Creando mensaje de: ${senderProfileId}`);

      // Validar que tenga conversationId O groupId (no ambos)
      if (conversationId && groupId) {
        throw new AppError('Solo puede especificar conversationId O groupId', 400, 'INVALID_TARGET');
      }

      if (!conversationId && !groupId) {
        throw new AppError('Debe especificar conversationId o groupId', 400, 'MISSING_TARGET');
      }

      // Si es mensaje de grupo, verificar membresía con external_id
      if (groupId) {
        console.log('🔍 Verificando membresía en grupo...');
        
        // 🔥 BUSCAR GRUPO POR EXTERNAL_ID
        const group = await this.groupRepository.findByExternalId(groupId);
        
        if (!group) {
          throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
        }

        const internalGroupId = group.id;
        console.log(`✅ Grupo encontrado: ${group.name} (ID interno: ${internalGroupId})`);

        const isMember = await this.groupMemberRepository.isMember(internalGroupId, senderProfileId);
        
        if (!isMember) {
          throw new AppError('No eres miembro del grupo', 403, 'NOT_A_MEMBER');
        }

        // Crear mensaje con el ID interno
        const message = await this.messageRepository.create({
          groupId: internalGroupId, // 🔥 USAR ID INTERNO
          senderProfileId,
          content,
          messageType: messageType || 'text',
          mediaUrl,
          replyToId
        });

        // Incrementar contadores de no leídos
        await this.groupMemberRepository.incrementUnreadForAll(internalGroupId, senderProfileId);

        console.log('✅ Mensaje de grupo creado');

        res.status(201).json({
          success: true,
          message: 'Mensaje enviado',
          data: message.toJSON()
        });

      } else {
        // Mensaje de conversación 1-a-1
        // TODO: Verificar que el usuario sea parte de la conversación

        const message = await this.messageRepository.create({
          conversationId,
          senderProfileId,
          content,
          messageType: messageType || 'text',
          mediaUrl,
          replyToId
        });

        console.log('✅ Mensaje de conversación creado');

        res.status(201).json({
          success: true,
          message: 'Mensaje enviado',
          data: message.toJSON()
        });
      }

    } catch (error) {
      next(error);
    }
  };

  // Actualizar un mensaje (editar)
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const profileId = req.user.profileId;

      const message = await this.messageRepository.findById(id);

      if (!message) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      // Solo el autor puede editar
      if (message.senderProfileId !== profileId) {
        throw new AppError('Solo puedes editar tus propios mensajes', 403, 'NOT_AUTHORIZED');
      }

      // No se puede editar mensajes de más de 24 horas
      const hoursSinceCreation = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        throw new AppError('No puedes editar mensajes de más de 24 horas', 403, 'TOO_OLD');
      }

      const updatedMessage = await this.messageRepository.update(id, {
        content,
        isEdited: true
      });

      res.json({
        success: true,
        message: 'Mensaje actualizado',
        data: updatedMessage.toJSON()
      });

    } catch (error) {
      next(error);
    }
  };

  // Eliminar un mensaje (soft delete)
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const message = await this.messageRepository.findById(id);

      if (!message) {
        throw new AppError('Mensaje no encontrado', 404, 'MESSAGE_NOT_FOUND');
      }

      // Solo el autor puede eliminar, o moderadores del grupo
      let canDelete = message.senderProfileId === profileId;

      if (!canDelete && message.groupId) {
        const membership = await this.groupMemberRepository.findMembership(message.groupId, profileId);
        canDelete = membership && membership.canDeleteMessages();
      }

      if (!canDelete) {
        throw new AppError('No tienes permisos para eliminar este mensaje', 403, 'NOT_AUTHORIZED');
      }

      await this.messageRepository.softDelete(id);

      res.json({
        success: true,
        message: 'Mensaje eliminado'
      });

    } catch (error) {
      next(error);
    }
  };

  // Marcar mensajes como leídos
  markAsRead = async (req, res, next) => {
    try {
      const { conversationId, groupId } = req.body;
      const profileId = req.user.profileId;

      if (conversationId) {
        // Marcar como leídos en conversación
        await this.messageRepository.markConversationAsRead(conversationId, profileId);
      } else if (groupId) {
        // 🔥 BUSCAR GRUPO POR EXTERNAL_ID
        const group = await this.groupRepository.findByExternalId(groupId);
        
        if (!group) {
          throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
        }

        const internalGroupId = group.id;

        const membership = await this.groupMemberRepository.findMembership(internalGroupId, profileId);
        
        if (!membership) {
          throw new AppError('No eres miembro del grupo', 403, 'NOT_A_MEMBER');
        }

        // Obtener último mensaje del grupo
        const lastMessage = await this.messageRepository.getLastMessage(internalGroupId);

        if (lastMessage) {
          await this.groupMemberRepository.updateLastRead(internalGroupId, profileId, lastMessage.id);
        }
      } else {
        throw new AppError('Debe especificar conversationId o groupId', 400, 'MISSING_TARGET');
      }

      res.json({
        success: true,
        message: 'Mensajes marcados como leídos'
      });

    } catch (error) {
      next(error);
    }
  };

  // Reaccionar a un mensaje
  react = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { reaction } = req.body;
      const profileId = req.user.profileId;

      // TODO: Implementar sistema de reacciones
      // Esto requeriría una tabla adicional: message_reactions

      res.json({
        success: true,
        message: 'Funcionalidad en desarrollo'
      });

    } catch (error) {
      next(error);
    }
  };
}

module.exports = new MessageController();