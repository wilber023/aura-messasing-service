/**
 * Routes: Users
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const UserController = require('../controllers/UserController');
const { authMiddleware } = require('../middlewares');

const createUserValidation = [
  body('profileId').notEmpty().isUUID(),
  body('username').notEmpty().isLength({ min: 3, max: 100 }),
  body('displayName').optional().isLength({ max: 150 }),
  body('avatarUrl').optional().isURL()
];

const idValidation = [param('id').isUUID()];
const profileIdValidation = [param('profileId').isUUID()];

// Ruta pública para sincronización
router.post('/', createUserValidation, UserController.create);

// Rutas protegidas
router.get('/', authMiddleware, UserController.getAll);
router.get('/profile/:profileId', authMiddleware, profileIdValidation, UserController.getByProfileId);
router.get('/:id', authMiddleware, idValidation, UserController.getById);
router.put('/:id', authMiddleware, idValidation, UserController.update);
router.delete('/:id', authMiddleware, idValidation, UserController.delete);

module.exports = router;