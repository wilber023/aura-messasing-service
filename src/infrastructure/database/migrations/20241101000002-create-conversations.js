'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      participant1_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID del perfil del participante 1'
      },
      participant2_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID del perfil del participante 2'
      },
      last_message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      participant1_status: {
        type: Sequelize.ENUM('active', 'archived', 'blocked'),
        defaultValue: 'active'
      },
      participant2_status: {
        type: Sequelize.ENUM('active', 'archived', 'blocked'),
        defaultValue: 'active'
      },
      unread_count_1: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Mensajes no leídos para participante 1'
      },
      unread_count_2: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Mensajes no leídos para participante 2'
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
    await queryInterface.addIndex('conversations', ['participant1_profile_id'], { name: 'idx_conv_participant1' });
    await queryInterface.addIndex('conversations', ['participant2_profile_id'], { name: 'idx_conv_participant2' });
    await queryInterface.addIndex('conversations', ['last_message_at'], { name: 'idx_conv_last_message_at' });
    await queryInterface.addIndex('conversations', ['participant1_profile_id', 'participant2_profile_id'], {
      unique: true,
      name: 'idx_conv_unique_participants'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};