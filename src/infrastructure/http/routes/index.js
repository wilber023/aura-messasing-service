/**
 * Routes Index
 */

const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const conversationRoutes = require('./conversationRoutes');
const groupRoutes = require('./groupRoutes');
const groupMemberRoutes = require('./groupMemberRoutes');

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AURA Messaging Service is running',
    timestamp: new Date().toISOString()
  });
});

// API Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AURA Messaging Service API',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/users',
      messages: '/api/v1/messages',
      conversations: '/api/v1/conversations',
      groups: '/api/v1/groups',
      groupMembers: '/api/v1/group-members'
    }
  });
});

router.use('/users', userRoutes);
router.use('/messages', messageRoutes);
router.use('/conversations', conversationRoutes);
router.use('/groups', groupRoutes);
router.use('/group-members', groupMemberRoutes);

module.exports = router;