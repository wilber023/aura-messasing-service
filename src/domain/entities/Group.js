    /**
 * Entidad de Dominio: Group
 */

const GROUP_TYPES = {
  COMMUNITY: 'community',
  ACTIVITY: 'activity',
  PRIVATE: 'private'
};

const GROUP_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived'
};

class Group {
  constructor({
    id,
    name,
    description = '',
    imageUrl = null,
    groupType = GROUP_TYPES.COMMUNITY,
    creatorProfileId,
    externalId = null,
    maxMembers = null,
    isPublic = true,
    status = GROUP_STATUS.ACTIVE,
    settings = {},
    memberCount = 0,
    lastMessageAt = null,
    location = null,
    scheduledAt = null,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
    this.groupType = groupType;
    this.creatorProfileId = creatorProfileId;
    this.externalId = externalId;
    this.maxMembers = maxMembers;
    this.isPublic = isPublic;
    this.status = status;
    this.settings = settings;
    this.memberCount = memberCount;
    this.lastMessageAt = lastMessageAt;
    this.location = location;
    this.scheduledAt = scheduledAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isCommunity() {
    return this.groupType === GROUP_TYPES.COMMUNITY;
  }

  isActivity() {
    return this.groupType === GROUP_TYPES.ACTIVITY;
  }

  canAcceptMoreMembers() {
    if (this.maxMembers === null) return true;
    return this.memberCount < this.maxMembers;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      groupType: this.groupType,
      creatorProfileId: this.creatorProfileId,
      externalId: this.externalId,
      maxMembers: this.maxMembers,
      isPublic: this.isPublic,
      status: this.status,
      settings: this.settings,
      memberCount: this.memberCount,
      lastMessageAt: this.lastMessageAt,
      location: this.location,
      scheduledAt: this.scheduledAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new Group({
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      groupType: data.group_type,
      creatorProfileId: data.creator_profile_id,
      externalId: data.external_id,
      maxMembers: data.max_members,
      isPublic: data.is_public,
      status: data.status,
      settings: data.settings ? JSON.parse(data.settings) : {},
      memberCount: data.member_count,
      lastMessageAt: data.last_message_at,
      location: data.location ? JSON.parse(data.location) : null,
      scheduledAt: data.scheduled_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }
}

module.exports = { Group, GROUP_TYPES, GROUP_STATUS };