/**
 * Sequelize Model: Conversation
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const ConversationModel = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participant1_profile_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  participant2_profile_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  last_message_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  participant1_status: {
    type: DataTypes.ENUM('active', 'archived', 'blocked'),
    defaultValue: 'active'
  },
  participant2_status: {
    type: DataTypes.ENUM('active', 'archived', 'blocked'),
    defaultValue: 'active'
  },
  unread_count_1: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unread_count_2: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'conversations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ConversationModel;