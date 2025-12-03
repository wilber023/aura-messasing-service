'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('group_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      group_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'chat_groups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID del perfil del usuario'
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'moderator', 'member'),
        defaultValue: 'member'
      },
      status: {
        type: Sequelize.ENUM('active', 'muted', 'banned', 'left', 'pending'),
        defaultValue: 'active'
      },
      nickname: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Apodo dentro del grupo'
      },
      last_read_message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      unread_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      muted_until: {
        type: Sequelize.DATE,
        allowNull: true
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('group_members', ['group_id'], { name: 'idx_gm_group_id' });
    await queryInterface.addIndex('group_members', ['profile_id'], { name: 'idx_gm_profile_id' });
    await queryInterface.addIndex('group_members', ['role'], { name: 'idx_gm_role' });
    await queryInterface.addIndex('group_members', ['status'], { name: 'idx_gm_status' });
    await queryInterface.addIndex('group_members', ['group_id', 'profile_id'], {
      unique: true,
      name: 'idx_gm_unique_membership'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('group_members');
  }
};