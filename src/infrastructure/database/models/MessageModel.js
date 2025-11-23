/**
 * Sequelize Model: Message
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const MessageModel = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  conversation_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  sender_profile_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'system'),
    defaultValue: 'text'
  },
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
    defaultValue: 'sent'
  },
  media_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  reply_to_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = MessageModel;