/**
 * Entidad de Dominio: User
 */

class User {
  constructor({
    id,
    profileId,
    username,
    displayName,
    avatarUrl,
    isOnline = false,
    lastSeenAt = null,
    isActive = true,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.profileId = profileId;
    this.username = username;
    this.displayName = displayName;
    this.avatarUrl = avatarUrl;
    this.isOnline = isOnline;
    this.lastSeenAt = lastSeenAt;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  setOnline() {
    this.isOnline = true;
    this.lastSeenAt = new Date();
  }

  setOffline() {
    this.isOnline = false;
    this.lastSeenAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      profileId: this.profileId,
      username: this.username,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      isOnline: this.isOnline,
      lastSeenAt: this.lastSeenAt,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new User({
      id: data.id,
      profileId: data.profile_id,
      username: data.username,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      isOnline: data.is_online,
      lastSeenAt: data.last_seen_at,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }
}

module.exports = User;