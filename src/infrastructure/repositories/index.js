/**
 * Repositories Index
 */

const UserRepository = require('./UserRepository');
const MessageRepository = require('./MessageRepository');
const ConversationRepository = require('./ConversationRepository');
const GroupRepository = require('./GroupRepository');
const GroupMemberRepository = require('./GroupMemberRepository');

module.exports = {
  UserRepository,
  MessageRepository,
  ConversationRepository,
  GroupRepository,
  GroupMemberRepository
};