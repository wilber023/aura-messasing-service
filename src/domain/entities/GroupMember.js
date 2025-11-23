/**
 * Entidad de Dominio: GroupMember
 */

const MEMBER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member'
};

const MEMBER_STATUS = {
  ACTIVE: 'active',
  MUTED: 'muted',
  BANNED: 'banned',
  LEFT: 'left',
  PENDING: 'pending'
};

class GroupMember {
  constructor({
    id,
    groupId,
    profileId,
    role = MEMBER_ROLES.MEMBER,
    status = MEMBER_STATUS.ACTIVE,
    nickname = null,
    lastReadMessageId = null,
    unreadCount = 0,
    mutedUntil = null,
    joinedAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.groupId = groupId;
    this.profileId = profileId;
    this.role = role;
    this.status = status;
    this.nickname = nickname;
    this.lastReadMessageId = lastReadMessageId;
    this.unreadCount = unreadCount;
    this.mutedUntil = mutedUntil;
    this.joinedAt = joinedAt;
    this.updatedAt = updatedAt;
  }

  isOwner() {
    return this.role === MEMBER_ROLES.OWNER;
  }

  isAdmin() {
    return this.role === MEMBER_ROLES.ADMIN || this.role === MEMBER_ROLES.OWNER;
  }

  isModerator() {
    return this.role === MEMBER_ROLES.MODERATOR || this.isAdmin();
  }

  canSendMessages() {
    return this.status === MEMBER_STATUS.ACTIVE;
  }

  canDeleteMessages() {
    return this.isModerator();
  }

  canManageMembers() {
    return this.isAdmin();
  }

  canEditGroup() {
    return this.isOwner();
  }

  toJSON() {
    return {
      id: this.id,
      groupId: this.groupId,
      profileId: this.profileId,
      role: this.role,
      status: this.status,
      nickname: this.nickname,
      lastReadMessageId: this.lastReadMessageId,
      unreadCount: this.unreadCount,
      mutedUntil: this.mutedUntil,
      joinedAt: this.joinedAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new GroupMember({
      id: data.id,
      groupId: data.group_id,
      profileId: data.profile_id,
      role: data.role,
      status: data.status,
      nickname: data.nickname,
      lastReadMessageId: data.last_read_message_id,
      unreadCount: data.unread_count,
      mutedUntil: data.muted_until,
      joinedAt: data.joined_at,
      updatedAt: data.updated_at
    });
  }
}

module.exports = { GroupMember, MEMBER_ROLES, MEMBER_STATUS };