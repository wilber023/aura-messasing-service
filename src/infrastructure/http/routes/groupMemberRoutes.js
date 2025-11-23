/**
 * Routes: GroupMembers
 */

const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const GroupMemberController = require('../controllers/GroupMemberController');
const { authMiddleware } = require('../middlewares');

const createMemberValidation = [
  body('groupId').notEmpty().isUUID(),
  body('profileId').notEmpty().isUUID(),
  body('role').optional().isIn(['admin', 'moderator', 'member']),
  body('nickname').optional().isLength({ max: 100 })
];

const idValidation = [param('id').isUUID()];

router.use(authMiddleware);

router.get('/', GroupMemberController.getAll);
router.get('/:id', idValidation, GroupMemberController.getById);
router.post('/', createMemberValidation, GroupMemberController.create);
router.put('/:id', idValidation, GroupMemberController.update);
router.delete('/:id', idValidation, GroupMemberController.delete);

router.patch('/:id/promote', idValidation, GroupMemberController.promote);
router.patch('/:id/ban', idValidation, GroupMemberController.ban);

module.exports = router;