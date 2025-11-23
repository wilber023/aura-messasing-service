/**
 * Routes: Conversations
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const ConversationController = require('../controllers/ConversationController');
const { authMiddleware } = require('../middlewares');

const createConversationValidation = [
  body('participantProfileId').notEmpty().isUUID()
];

const idValidation = [param('id').isUUID()];

router.use(authMiddleware);

router.get('/', ConversationController.getAll);
router.get('/:id', idValidation, ConversationController.getById);
router.post('/', createConversationValidation, ConversationController.create);

router.patch('/:id/archive', idValidation, ConversationController.archive);
router.patch('/:id/read', idValidation, ConversationController.markAsRead);

module.exports = router;