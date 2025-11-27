 
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const GroupController = require('../controllers/GroupController');
const { authMiddleware, optionalAuth } = require('../middlewares');

const createGroupValidation = [
  body('name').notEmpty().isLength({ min: 2, max: 200 }),
  body('description').optional().isLength({ max: 2000 }),
  body('imageUrl').optional().isURL(),
  body('groupType').optional().isIn(['community', 'activity', 'private']),
  body('externalId').optional().isUUID(),
  body('maxMembers').optional().isInt({ min: 2 }),
  body('isPublic').optional().isBoolean(),
  body('scheduledAt').optional().isISO8601()
];

const idValidation = [param('id').isUUID()];

// 🔥 RUTA DE SINCRONIZACIÓN SIN AUTENTICACIÓN (debe ir primero)
router.post('/sync', createGroupValidation, GroupController.syncGroup);

// Rutas públicas
router.get('/', optionalAuth, GroupController.getAll);
router.get('/discover', optionalAuth, GroupController.discoverCommunities);
router.get('/activities', optionalAuth, GroupController.getActivities);
router.get('/:id', optionalAuth, idValidation, GroupController.getById);
router.get('/:id/members', optionalAuth, idValidation, GroupController.getMembers);

// 🔒 Rutas protegidas (requieren autenticación)
router.use(authMiddleware);

router.get('/my/communities', GroupController.getMyCommunities);
router.get('/my/activities', GroupController.getMyActivities);

router.post('/', createGroupValidation, GroupController.create);
router.put('/:id', idValidation, GroupController.update);
router.delete('/:id', idValidation, GroupController.delete);

router.post('/:id/join', idValidation, GroupController.join);
router.post('/:id/leave', idValidation, GroupController.leave);

module.exports = router;