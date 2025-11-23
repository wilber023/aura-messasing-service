/**
 * Sequelize Model: User
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../connection');

const UserModel = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profile_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    comment: 'ID del perfil completo del usuario'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  display_name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_seen_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = UserModel;