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

const syncAddValidation = [
  param('groupId').isUUID(),
  body('profileId').notEmpty().isUUID(),
  body('status').optional().isIn(['active', 'muted'])
];

const syncRemoveValidation = [
  param('groupId').isUUID(),
  param('profileId').isUUID()
];

const idValidation = [param('id').isUUID()];
 
router.post('/:groupId/sync-add', syncAddValidation, GroupMemberController.syncAddMember);
router.delete('/:groupId/sync-remove/:profileId', syncRemoveValidation, GroupMemberController.syncRemoveMember);
 
router.use(authMiddleware);

router.get('/', GroupMemberController.getAll);
router.get('/:id', idValidation, GroupMemberController.getById);
router.post('/', createMemberValidation, GroupMemberController.create);
router.put('/:id', idValidation, GroupMemberController.update);
router.delete('/:id', idValidation, GroupMemberController.delete);

router.patch('/:id/promote', idValidation, GroupMemberController.promote);
router.patch('/:id/ban', idValidation, GroupMemberController.ban);

module.exports = router;