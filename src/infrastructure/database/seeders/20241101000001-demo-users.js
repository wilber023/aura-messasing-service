'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const users = [
      {
        id: uuidv4(),
        profile_id: '11111111-1111-1111-1111-111111111111',
        username: 'usuario_aura_1',
        display_name: 'Usuario Demo 1',
        avatar_url: 'https://ui-avatars.com/api/?name=Usuario+Demo+1&background=6366f1&color=fff',
        is_online: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        profile_id: '22222222-2222-2222-2222-222222222222',
        username: 'usuario_aura_2',
        display_name: 'Usuario Demo 2',
        avatar_url: 'https://ui-avatars.com/api/?name=Usuario+Demo+2&background=8b5cf6&color=fff',
        is_online: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        profile_id: '33333333-3333-3333-3333-333333333333',
        username: 'usuario_aura_3',
        display_name: 'Usuario Demo 3',
        avatar_url: 'https://ui-avatars.com/api/?name=Usuario+Demo+3&background=ec4899&color=fff',
        is_online: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        profile_id: '44444444-4444-4444-4444-444444444444',
        username: 'admin_aura',
        display_name: 'Administrador AURA',
        avatar_url: 'https://ui-avatars.com/api/?name=Admin+AURA&background=10b981&color=fff',
        is_online: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        profile_id: '55555555-5555-5555-5555-555555555555',
        username: 'moderador_aura',
        display_name: 'Moderador AURA',
        avatar_url: 'https://ui-avatars.com/api/?name=Moderador+AURA&background=f59e0b&color=fff',
        is_online: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};