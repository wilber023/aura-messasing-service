/**
 * WebSocket Server for Real-time Messaging
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { UserRepository, GroupMemberRepository } = require('../repositories');

class WebSocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.WS_CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });

    this.userRepository = new UserRepository();
    this.groupMemberRepository = new GroupMemberRepository();
    this.connectedUsers = new Map();

    this.initialize();
  }

  initialize() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Token requerido'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = {
          id: decoded.id,
          profileId: decoded.profileId || decoded.profile_id,
          username: decoded.username
        };

        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  handleConnection(socket) {
    const { profileId } = socket.user;
    console.log(`🔌 Usuario conectado: ${profileId}`);

    this.addConnection(profileId, socket.id);
    this.userRepository.setOnlineStatus(profileId, true);
    this.joinUserGroups(socket, profileId);

    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('join_group', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('typing_start', (data) => {
      const { conversationId, groupId } = data;
      const room = conversationId ? `conversation:${conversationId}` : `group:${groupId}`;
      socket.to(room).emit('user_typing', { profileId, isTyping: true });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId, groupId } = data;
      const room = conversationId ? `conversation:${conversationId}` : `group:${groupId}`;
      socket.to(room).emit('user_typing', { profileId, isTyping: false });
    });

    socket.on('disconnect', () => {
      this.removeConnection(profileId, socket.id);
      
      if (!this.connectedUsers.has(profileId) || this.connectedUsers.get(profileId).size === 0) {
        this.userRepository.setOnlineStatus(profileId, false);
        console.log(`❌ Usuario desconectado: ${profileId}`);
      }
    });
  }

  addConnection(profileId, socketId) {
    if (!this.connectedUsers.has(profileId)) {
      this.connectedUsers.set(profileId, new Set());
    }
    this.connectedUsers.get(profileId).add(socketId);
  }

  removeConnection(profileId, socketId) {
    if (this.connectedUsers.has(profileId)) {
      this.connectedUsers.get(profileId).delete(socketId);
      if (this.connectedUsers.get(profileId).size === 0) {
        this.connectedUsers.delete(profileId);
      }
    }
  }

  async joinUserGroups(socket, profileId) {
    try {
      const result = await this.groupMemberRepository.findByProfileId(profileId, {
        status: 'active',
        limit: 100
      });

      for (const membership of result.data) {
        socket.join(`group:${membership.groupId}`);
      }
    } catch (error) {
      console.error('Error al unir grupos:', error);
    }
  }

  emitNewConversationMessage(conversationId, message) {
    this.io.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  emitNewGroupMessage(groupId, message) {
    this.io.to(`group:${groupId}`).emit('new_message', message);
  }

  emitToUser(profileId, event, data) {
    const socketIds = this.connectedUsers.get(profileId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }
}

let wsServerInstance = null;

const initializeWebSocket = (httpServer) => {
  if (!wsServerInstance) {
    wsServerInstance = new WebSocketServer(httpServer); 
  }
  return wsServerInstance;
};

const getWebSocketServer = () => wsServerInstance;

module.exports = { WebSocketServer, initializeWebSocket, getWebSocketServer };