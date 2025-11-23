/**
 * Routes: Messages
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const MessageController = require('../controllers/MessageController');
const { authMiddleware } = require('../middlewares');

const createMessageValidation = [
  body('conversationId').optional().isUUID(),
  body('groupId').optional().isUUID(),
  body('content').notEmpty().isLength({ max: 5000 }),
  body('messageType').optional().isIn(['text', 'image', 'video', 'audio', 'file', 'system']),
  body('mediaUrl').optional().isURL(),
  body('replyToId').optional().isUUID()
];

const idValidation = [param('id').isUUID()];
const conversationIdValidation = [param('conversationId').isUUID()];
const groupIdValidation = [param('groupId').isUUID()];

router.use(authMiddleware);

router.get('/', MessageController.getAll);
router.get('/:id', idValidation, MessageController.getById);
router.post('/', createMessageValidation, MessageController.create);
router.put('/:id', idValidation, MessageController.update);
router.delete('/:id', idValidation, MessageController.delete);

router.get('/conversation/:conversationId', conversationIdValidation, MessageController.getByConversation);
router.get('/group/:groupId', groupIdValidation, MessageController.getByGroup);

module.exports = router;