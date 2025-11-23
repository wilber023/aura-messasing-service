/**
 * Sequelize Model: Group
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const GroupModel = sequelize.define('Group', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  group_type: {
    type: DataTypes.ENUM('community', 'activity', 'private'),
    defaultValue: 'community'
  },
  creator_profile_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  external_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  max_members: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'archived'),
    defaultValue: 'active'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  member_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_message_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'chat_groups',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = GroupModel;