/**
 * Entidad de Dominio: Message
 */

const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system'
};

const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed'
};

class Message {
  constructor({
    id,
    conversationId = null,
    groupId = null,
    senderProfileId,
    content,
    messageType = MESSAGE_TYPES.TEXT,
    status = MESSAGE_STATUS.SENT,
    mediaUrl = null,
    replyToId = null,
    isEdited = false,
    isDeleted = false,
    metadata = {},
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.conversationId = conversationId;
    this.groupId = groupId;
    this.senderProfileId = senderProfileId;
    this.content = content;
    this.messageType = messageType;
    this.status = status;
    this.mediaUrl = mediaUrl;
    this.replyToId = replyToId;
    this.isEdited = isEdited;
    this.isDeleted = isDeleted;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  markAsRead() {
    this.status = MESSAGE_STATUS.READ;
    this.updatedAt = new Date();
  }

  edit(newContent) {
    this.content = newContent;
    this.isEdited = true;
    this.updatedAt = new Date();
  }

  softDelete() {
    this.isDeleted = true;
    this.content = 'Mensaje eliminado';
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      groupId: this.groupId,
      senderProfileId: this.senderProfileId,
      content: this.content,
      messageType: this.messageType,
      status: this.status,
      mediaUrl: this.mediaUrl,
      replyToId: this.replyToId,
      isEdited: this.isEdited,
      isDeleted: this.isDeleted,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static fromDatabase(data) {
    return new Message({
      id: data.id,
      conversationId: data.conversation_id,
      groupId: data.group_id,
      senderProfileId: data.sender_profile_id,
      content: data.content,
      messageType: data.message_type,
      status: data.status,
      mediaUrl: data.media_url,
      replyToId: data.reply_to_id,
      isEdited: data.is_edited,
      isDeleted: data.is_deleted,
metadata: data.metadata ? (typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata) : {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    });
  }
}

module.exports = { Message, MESSAGE_TYPES, MESSAGE_STATUS };