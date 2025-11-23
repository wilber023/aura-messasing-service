'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const conversations = [
      {
        id: uuidv4(),
        participant1_profile_id: '11111111-1111-1111-1111-111111111111',
        participant2_profile_id: '22222222-2222-2222-2222-222222222222',
        last_message_id: null,
        last_message_at: new Date(),
        participant1_status: 'active',
        participant2_status: 'active',
        unread_count_1: 0,
        unread_count_2: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        participant1_profile_id: '11111111-1111-1111-1111-111111111111',
        participant2_profile_id: '44444444-4444-4444-4444-444444444444',
        last_message_id: null,
        last_message_at: new Date(),
        participant1_status: 'active',
        participant2_status: 'active',
        unread_count_1: 0,
        unread_count_2: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        participant1_profile_id: '22222222-2222-2222-2222-222222222222',
        participant2_profile_id: '33333333-3333-3333-3333-333333333333',
        last_message_id: null,
        last_message_at: new Date(),
        participant1_status: 'active',
        participant2_status: 'active',
        unread_count_1: 0,
        unread_count_2: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('conversations', conversations, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('conversations', null, {});
  }
};