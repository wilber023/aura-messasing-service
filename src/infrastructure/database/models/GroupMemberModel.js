/**
 * Sequelize Model: GroupMember
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const GroupMemberModel = sequelize.define('GroupMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  profile_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'moderator', 'member'),
    defaultValue: 'member'
  },
  status: {
    type: DataTypes.ENUM('active', 'muted', 'banned', 'left', 'pending'),
    defaultValue: 'active'
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_read_message_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  unread_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  muted_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'group_members',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = GroupMemberModel;