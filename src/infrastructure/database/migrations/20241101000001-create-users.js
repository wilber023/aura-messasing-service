'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        comment: 'ID del perfil completo del usuario (microservicio de usuarios)'
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      display_name: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_online: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.addIndex('users', ['profile_id'], { name: 'idx_users_profile_id' });
    await queryInterface.addIndex('users', ['username'], { name: 'idx_users_username' });
    await queryInterface.addIndex('users', ['is_online'], { name: 'idx_users_is_online' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'idx_users_is_active' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};