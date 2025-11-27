'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // FK: conversations.participant1_profile_id -> users.profile_id
    await queryInterface.addConstraint('conversations', {
      fields: ['participant1_profile_id'],
      type: 'foreign key',
      name: 'fk_conv_participant1_profile',
      references: {
        table: 'users',
        field: 'profile_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // FK: conversations.participant2_profile_id -> users.profile_id
    await queryInterface.addConstraint('conversations', {
      fields: ['participant2_profile_id'],
      type: 'foreign key',
      name: 'fk_conv_participant2_profile',
      references: {
        table: 'users',
        field: 'profile_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // FK: conversations.last_message_id -> messages.id
    await queryInterface.addConstraint('conversations', {
      fields: ['last_message_id'],
      type: 'foreign key',
      name: 'fk_conv_last_message',
      references: {
        table: 'messages',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // FK: chat_groups.creator_profile_id -> users.profile_id
    await queryInterface.addConstraint('chat_groups', {
      fields: ['creator_profile_id'],
      type: 'foreign key',
      name: 'fk_chat_groups_creator_profile',
      references: {
        table: 'users',
        field: 'profile_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // FK: group_members.profile_id -> users.profile_id
    await queryInterface.addConstraint('group_members', {
      fields: ['profile_id'],
      type: 'foreign key',
      name: 'fk_gm_profile',
      references: {
        table: 'users',
        field: 'profile_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // FK: group_members.last_read_message_id -> messages.id
    await queryInterface.addConstraint('group_members', {
      fields: ['last_read_message_id'],
      type: 'foreign key',
      name: 'fk_gm_last_read_message',
      references: {
        table: 'messages',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // FK: messages.sender_profile_id -> users.profile_id
    await queryInterface.addConstraint('messages', {
      fields: ['sender_profile_id'],
      type: 'foreign key',
      name: 'fk_msg_sender_profile',
      references: {
        table: 'users',
        field: 'profile_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // FK: messages.reply_to_id -> messages.id
    await queryInterface.addConstraint('messages', {
      fields: ['reply_to_id'],
      type: 'foreign key',
      name: 'fk_msg_reply_to',
      references: {
        table: 'messages',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('messages', 'fk_msg_reply_to');
    await queryInterface.removeConstraint('messages', 'fk_msg_sender_profile');
    await queryInterface.removeConstraint('group_members', 'fk_gm_last_read_message');
    await queryInterface.removeConstraint('group_members', 'fk_gm_profile');
    await queryInterface.removeConstraint('chat_groups', 'fk_chat_groups_creator_profile');
    await queryInterface.removeConstraint('conversations', 'fk_conv_last_message');
    await queryInterface.removeConstraint('conversations', 'fk_conv_participant2_profile');
    await queryInterface.removeConstraint('conversations', 'fk_conv_participant1_profile');
  }
};
