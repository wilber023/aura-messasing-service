/**
 * Entidad de Dominio: Conversation
 */

const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  BLOCKED: 'blocked'
};

class Conversation {
  constructor({
    id,
    participant1ProfileId,
    participant2ProfileId,
    lastMessageId = null,
    lastMessageAt = null,
    participant1Status = CONVERSATION_STATUS.ACTIVE,
    participant2Status = CONVERSATION_STATUS.ACTIVE,
    unreadCount1 = 0,
    unreadCount2 = 0,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.participant1ProfileId = participant1ProfileId;
    this.participant2ProfileId = participant2ProfileId;
    this.lastMessageId = lastMessageId;
    this.lastMessageAt = lastMessageAt;
    this.participant1Status = participant1Status;
    this.participant2Status = participant2Status;
    this.unreadCount1 = unreadCount1;
    this.unreadCount2 = unreadCount2;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getOtherParticipant(profileId) {
    return profileId === this.participant1ProfileId 
      ? this.participant2ProfileId 
      : this.participant1ProfileId;
  }

  isParticipant(profileId) {
    return this.participant1ProfileId === profileId || 
           this.participant2ProfileId === profileId;
  }

  toJSON() {
    return {
      id: this.id,
      participant1ProfileId: this.participant1ProfileId,
      participant2ProfileId: this.participant2ProfileId,
      lastMessageId: this.lastMessageId,
      lastMessageAt: this.lastMessageAt,
      participant1Status: this.participant1Status,
      participant2Status: this.participant2Status,
      unreadCount1: this.unreadCount1,
      unreadCount2: this.unreadCount2,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new Conversation({
      id: data.id,
      participant1ProfileId: data.participant1_profile_id,
      participant2ProfileId: data.participant2_profile_id,
      lastMessageId: data.last_message_id,
      lastMessageAt: data.last_message_at,
      participant1Status: data.participant1_status,
      participant2Status: data.participant2_status,
      unreadCount1: data.unread_count_1,
      unreadCount2: data.unread_count_2,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }
}

module.exports = { Conversation, CONVERSATION_STATUS };