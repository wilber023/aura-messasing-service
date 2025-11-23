'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener conversaciones
    const conversations = await queryInterface.sequelize.query(
      'SELECT id, participant1_profile_id, participant2_profile_id FROM conversations',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Obtener grupos
    const groups = await queryInterface.sequelize.query(
      'SELECT id, name, creator_profile_id FROM `groups`',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const messages = [];
    const now = new Date();

    // Mensajes en conversaciones
    if (conversations.length > 0) {
      const conv1 = conversations[0];
      
      messages.push(
        {
          id: uuidv4(),
          conversation_id: conv1.id,
          group_id: null,
          sender_profile_id: conv1.participant1_profile_id,
          content: '¡Hola! ¿Cómo estás hoy?',
          message_type: 'text',
          status: 'read',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 3600000),
          updated_at: new Date(now.getTime() - 3600000)
        },
        {
          id: uuidv4(),
          conversation_id: conv1.id,
          group_id: null,
          sender_profile_id: conv1.participant2_profile_id,
          content: '¡Hola! Estoy bien, gracias por preguntar. ¿Y tú?',
          message_type: 'text',
          status: 'read',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 3000000),
          updated_at: new Date(now.getTime() - 3000000)
        },
        {
          id: uuidv4(),
          conversation_id: conv1.id,
          group_id: null,
          sender_profile_id: conv1.participant1_profile_id,
          content: 'Bien también. Hoy practiqué meditación por primera vez.',
          message_type: 'text',
          status: 'delivered',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 1800000),
          updated_at: new Date(now.getTime() - 1800000)
        }
      );
    }

    // Mensajes en grupos
    const apoyoGroup = groups.find(g => g.name === 'Apoyo Mutuo AURA');
    if (apoyoGroup) {
      messages.push(
        {
          id: uuidv4(),
          conversation_id: null,
          group_id: apoyoGroup.id,
          sender_profile_id: apoyoGroup.creator_profile_id,
          content: '¡Bienvenidos a la comunidad de Apoyo Mutuo! Este es un espacio seguro para compartir.',
          message_type: 'system',
          status: 'sent',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 86400000),
          updated_at: new Date(now.getTime() - 86400000)
        },
        {
          id: uuidv4(),
          conversation_id: null,
          group_id: apoyoGroup.id,
          sender_profile_id: '11111111-1111-1111-1111-111111111111',
          content: '¡Gracias por crear este espacio! Me siento muy agradecido.',
          message_type: 'text',
          status: 'sent',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 82800000),
          updated_at: new Date(now.getTime() - 82800000)
        },
        {
          id: uuidv4(),
          conversation_id: null,
          group_id: apoyoGroup.id,
          sender_profile_id: '22222222-2222-2222-2222-222222222222',
          content: 'Hola a todos. Espero que tengan un excelente día.',
          message_type: 'text',
          status: 'sent',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 7200000),
          updated_at: new Date(now.getTime() - 7200000)
        }
      );
    }

    const caminataGroup = groups.find(g => g.name === 'Caminata al Aire Libre');
    if (caminataGroup) {
      messages.push(
        {
          id: uuidv4(),
          conversation_id: null,
          group_id: caminataGroup.id,
          sender_profile_id: caminataGroup.creator_profile_id,
          content: '¡La caminata será el próximo sábado a las 9am! No olviden traer agua.',
          message_type: 'text',
          status: 'sent',
          media_url: null,
          reply_to_id: null,
          is_edited: false,
          is_deleted: false,
          metadata: JSON.stringify({}),
          created_at: new Date(now.getTime() - 43200000),
          updated_at: new Date(now.getTime() - 43200000)
        }
      );
    }

    await queryInterface.bulkInsert('messages', messages, {});

    // Actualizar last_message_id en conversaciones
    if (conversations.length > 0) {
      const lastMessage = await queryInterface.sequelize.query(
        `SELECT id FROM messages WHERE conversation_id = '${conversations[0].id}' ORDER BY created_at DESC LIMIT 1`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (lastMessage.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE conversations SET last_message_id = '${lastMessage[0].id}' WHERE id = '${conversations[0].id}'`
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('messages', null, {});
  }
};