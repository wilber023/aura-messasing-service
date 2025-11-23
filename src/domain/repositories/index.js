/**
 * Domain Repository Interfaces (Ports)
 */

class IUserRepository {
  async findById(id) { throw new Error('Method not implemented'); }
  async findByProfileId(profileId) { throw new Error('Method not implemented'); }
  async findAll(filters = {}) { throw new Error('Method not implemented'); }
  async create(userData) { throw new Error('Method not implemented'); }
  async update(id, userData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
}

class IMessageRepository {
  async findById(id) { throw new Error('Method not implemented'); }
  async findByConversationId(conversationId, options = {}) { throw new Error('Method not implemented'); }
  async findByGroupId(groupId, options = {}) { throw new Error('Method not implemented'); }
  async create(messageData) { throw new Error('Method not implemented'); }
  async update(id, messageData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
}

class IConversationRepository {
  async findById(id) { throw new Error('Method not implemented'); }
  async findByParticipants(profileId1, profileId2) { throw new Error('Method not implemented'); }
  async findByProfileId(profileId, options = {}) { throw new Error('Method not implemented'); }
  async create(conversationData) { throw new Error('Method not implemented'); }
  async update(id, conversationData) { throw new Error('Method not implemented'); }
}

class IGroupRepository {
  async findById(id) { throw new Error('Method not implemented'); }
  async findByType(groupType, options = {}) { throw new Error('Method not implemented'); }
  async create(groupData) { throw new Error('Method not implemented'); }
  async update(id, groupData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
}

class IGroupMemberRepository {
  async findById(id) { throw new Error('Method not implemented'); }
  async findByGroupId(groupId, options = {}) { throw new Error('Method not implemented'); }
  async findMembership(groupId, profileId) { throw new Error('Method not implemented'); }
  async create(memberData) { throw new Error('Method not implemented'); }
  async update(id, memberData) { throw new Error('Method not implemented'); }
  async delete(id) { throw new Error('Method not implemented'); }
}

module.exports = {
  IUserRepository,
  IMessageRepository,
  IConversationRepository,
  IGroupRepository,
  IGroupMemberRepository
};