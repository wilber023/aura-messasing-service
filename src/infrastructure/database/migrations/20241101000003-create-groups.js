'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      group_type: {
        type: Sequelize.ENUM('community', 'activity', 'private'),
        defaultValue: 'community'
      },
      creator_profile_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      external_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      max_members: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'archived'),
        defaultValue: 'active'
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: '{}'
      },
      member_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_message_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      location: {
        type: Sequelize.JSON,
        allowNull: true
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('chat_groups', ['group_type'], { name: 'idx_chat_groups_type' });
    await queryInterface.addIndex('chat_groups', ['creator_profile_id'], { name: 'idx_chat_groups_creator' });
    await queryInterface.addIndex('chat_groups', ['external_id'], { name: 'idx_chat_groups_external_id' });
    await queryInterface.addIndex('chat_groups', ['is_public'], { name: 'idx_chat_groups_is_public' });
    await queryInterface.addIndex('chat_groups', ['status'], { name: 'idx_chat_groups_status' });
    await queryInterface.addIndex('chat_groups', ['scheduled_at'], { name: 'idx_chat_groups_scheduled_at' });
    await queryInterface.addIndex('chat_groups', ['member_count'], { name: 'idx_chat_groups_member_count' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('chat_groups');
  }
};
