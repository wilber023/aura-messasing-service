'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      conversation_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID de la conversación (para chats individuales)'
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'chat_groups', // 🔥 CAMBIO AQUÍ
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'ID del grupo/comunidad/actividad'
      },
      sender_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID del perfil que envía el mensaje'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      message_type: {
        type: Sequelize.ENUM('text', 'image', 'video', 'audio', 'file', 'system'),
        defaultValue: 'text'
      },
      status: {
        type: Sequelize.ENUM('sent', 'delivered', 'read', 'failed'),
        defaultValue: 'sent'
      },
      media_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      reply_to_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID del mensaje al que responde'
      },
      is_edited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('messages', ['conversation_id'], { name: 'idx_msg_conversation_id' });
    await queryInterface.addIndex('messages', ['group_id'], { name: 'idx_msg_group_id' });
    await queryInterface.addIndex('messages', ['sender_profile_id'], { name: 'idx_msg_sender' });
    await queryInterface.addIndex('messages', ['created_at'], { name: 'idx_msg_created_at' });
    await queryInterface.addIndex('messages', ['reply_to_id'], { name: 'idx_msg_reply_to' });
    await queryInterface.addIndex('messages', ['is_deleted'], { name: 'idx_msg_is_deleted' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};