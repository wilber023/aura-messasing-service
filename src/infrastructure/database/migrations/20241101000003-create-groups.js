'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('groups', {
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
        defaultValue: 'community',
        comment: 'community=Comunidades, activity=Actividades cerca de ti, private=Grupos privados'
      },
      creator_profile_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'ID del perfil que creó el grupo'
      },
      external_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'ID de la comunidad/actividad en otro microservicio'
      },
      max_members: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'null = sin límite'
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
        allowNull: true,
        comment: 'Para actividades: { lat, lng, address }'
      },
      scheduled_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha programada para actividades'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('groups', ['group_type'], { name: 'idx_groups_type' });
    await queryInterface.addIndex('groups', ['creator_profile_id'], { name: 'idx_groups_creator' });
    await queryInterface.addIndex('groups', ['external_id'], { name: 'idx_groups_external_id' });
    await queryInterface.addIndex('groups', ['is_public'], { name: 'idx_groups_is_public' });
    await queryInterface.addIndex('groups', ['status'], { name: 'idx_groups_status' });
    await queryInterface.addIndex('groups', ['scheduled_at'], { name: 'idx_groups_scheduled_at' });
    await queryInterface.addIndex('groups', ['member_count'], { name: 'idx_groups_member_count' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('groups');
  }
};