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

// 🔒 Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// 📝 Rutas de mensajes individuales
router.get('/:id', idValidation, MessageController.getById);
router.post('/', createMessageValidation, MessageController.create);
router.put('/:id', idValidation, MessageController.update);
router.delete('/:id', idValidation, MessageController.delete);

// 💬 Rutas específicas de conversación y grupo
router.get('/conversation/:conversationId', conversationIdValidation, MessageController.getByConversation);
router.get('/group/:groupId', groupIdValidation, MessageController.getByGroup);

// ✅ Marcar como leído
router.post('/mark-as-read', MessageController.markAsRead);

// 😊 Reaccionar a mensaje
router.post('/:id/react', idValidation, MessageController.react);

module.exports = router;