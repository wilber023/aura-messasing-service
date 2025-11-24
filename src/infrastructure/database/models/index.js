/**
 * Models Index with Associations CORREGIDO
 */

const { sequelize } = require('../connection');
const UserModel = require('./UserModel');
const MessageModel = require('./MessageModel');
const ConversationModel = require('./ConversationModel');
const GroupModel = require('./GroupModel');
const GroupMemberModel = require('./GroupMemberModel');

// ==========================================
// ASOCIACIONES CORREGIDAS - Con targetKey/sourceKey
// ==========================================

// User -> Messages (CORREGIDO)
UserModel.hasMany(MessageModel, {
  foreignKey: 'sender_profile_id',
  sourceKey: 'profile_id',
  as: 'sentMessages'
});
MessageModel.belongsTo(UserModel, {
  foreignKey: 'sender_profile_id',
  targetKey: 'profile_id',
  as: 'sender'
});

// Conversation -> Messages
ConversationModel.hasMany(MessageModel, {
  foreignKey: 'conversation_id',
  as: 'messages'
});
MessageModel.belongsTo(ConversationModel, {
  foreignKey: 'conversation_id',
  as: 'conversation'
});

// Conversation -> Users (CORREGIDO con targetKey)
ConversationModel.belongsTo(UserModel, {
  foreignKey: 'participant1_profile_id',
  targetKey: 'profile_id',
  as: 'participant1'
});
ConversationModel.belongsTo(UserModel, {
  foreignKey: 'participant2_profile_id',
  targetKey: 'profile_id',
  as: 'participant2'
});

// Conversation -> Last Message
ConversationModel.belongsTo(MessageModel, {
  foreignKey: 'last_message_id',
  as: 'lastMessage'
});

// Group -> Messages
GroupModel.hasMany(MessageModel, {
  foreignKey: 'group_id',
  as: 'messages'
});
MessageModel.belongsTo(GroupModel, {
  foreignKey: 'group_id',
  as: 'group'
});

// Group -> GroupMembers
GroupModel.hasMany(GroupMemberModel, {
  foreignKey: 'group_id',
  as: 'members'
});
GroupMemberModel.belongsTo(GroupModel, {
  foreignKey: 'group_id',
  as: 'group'
});

// User -> GroupMembers (CORREGIDO)
UserModel.hasMany(GroupMemberModel, {
  foreignKey: 'profile_id',
  sourceKey: 'profile_id',
  as: 'memberships'
});
GroupMemberModel.belongsTo(UserModel, {
  foreignKey: 'profile_id',
  targetKey: 'profile_id',
  as: 'user'
});

// Group -> Creator (CORREGIDO)
GroupModel.belongsTo(UserModel, {
  foreignKey: 'creator_profile_id',
  targetKey: 'profile_id',
  as: 'creator'
});

// Message -> Reply
MessageModel.belongsTo(MessageModel, {
  foreignKey: 'reply_to_id',
  as: 'replyTo'
});

module.exports = {
  sequelize,
  UserModel,
  MessageModel,
  ConversationModel,
  GroupModel,
  GroupMemberModel
};