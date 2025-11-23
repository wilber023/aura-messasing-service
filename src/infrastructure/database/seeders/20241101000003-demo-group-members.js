'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero obtenemos los IDs de los grupos creados
    const groups = await queryInterface.sequelize.query(
      'SELECT id, name, creator_profile_id FROM `groups`',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const groupMembers = [];

    for (const group of groups) {
      // Agregar al creador como owner
      groupMembers.push({
        id: uuidv4(),
        group_id: group.id,
        profile_id: group.creator_profile_id,
        role: 'owner',
        status: 'active',
        nickname: null,
        last_read_message_id: null,
        unread_count: 0,
        muted_until: null,
        joined_at: new Date(),
        updated_at: new Date()
      });

      // Agregar miembros adicionales según el grupo
      if (group.name === 'Apoyo Mutuo AURA') {
        groupMembers.push(
          {
            id: uuidv4(),
            group_id: group.id,
            profile_id: '11111111-1111-1111-1111-111111111111',
            role: 'member',
            status: 'active',
            nickname: null,
            unread_count: 0,
            joined_at: new Date(),
            updated_at: new Date()
          },
          {
            id: uuidv4(),
            group_id: group.id,
            profile_id: '22222222-2222-2222-2222-222222222222',
            role: 'moderator',
            status: 'active',
            nickname: null,
            unread_count: 0,
            joined_at: new Date(),
            updated_at: new Date()
          }
        );
      }

      if (group.name === 'Mindfulness y Meditación') {
        groupMembers.push({
          id: uuidv4(),
          group_id: group.id,
          profile_id: '33333333-3333-3333-3333-333333333333',
          role: 'member',
          status: 'active',
          nickname: null,
          unread_count: 0,
          joined_at: new Date(),
          updated_at: new Date()
        });
      }

      if (group.name === 'Caminata al Aire Libre') {
        groupMembers.push({
          id: uuidv4(),
          group_id: group.id,
          profile_id: '11111111-1111-1111-1111-111111111111',
          role: 'member',
          status: 'active',
          nickname: null,
          unread_count: 0,
          joined_at: new Date(),
          updated_at: new Date()
        });
      }

      if (group.name === 'Grupo de Terapia A') {
        groupMembers.push({
          id: uuidv4(),
          group_id: group.id,
          profile_id: '11111111-1111-1111-1111-111111111111',
          role: 'member',
          status: 'active',
          nickname: null,
          unread_count: 0,
          joined_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('group_members', groupMembers, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('group_members', null, {});
  }
};