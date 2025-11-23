/**
 * Controller: GroupMemberController
 */

const { GroupMemberRepository, GroupRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');
const { MEMBER_ROLES, MEMBER_STATUS } = require('../../../domain/entities');

class GroupMemberController {
  constructor() {
    this.groupMemberRepository = new GroupMemberRepository();
    this.groupRepository = new GroupRepository();
  }

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 50, groupId, profileId, role, status } = req.query;

      const result = await this.groupMemberRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        groupId,
        profileId,
        role,
        status
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const member = await this.groupMemberRepository.findById(id);

      if (!member) {
        throw new AppError('Membresía no encontrada', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      res.json({ success: true, data: member.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { groupId, profileId, role, nickname } = req.body;
      const adminProfileId = req.user.profileId;

      const group = await this.groupRepository.findById(groupId);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const adminMembership = await this.groupMemberRepository.findMembership(groupId, adminProfileId);
      if (!adminMembership || !adminMembership.canManageMembers()) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      const existingMembership = await this.groupMemberRepository.findMembership(groupId, profileId);
      if (existingMembership && existingMembership.status !== 'left') {
        throw new AppError('Ya es miembro', 400, 'ALREADY_MEMBER');
      }

      if (!group.canAcceptMoreMembers()) {
        throw new AppError('Grupo lleno', 400, 'GROUP_FULL');
      }

      const member = await this.groupMemberRepository.create({
        groupId,
        profileId,
        role: role || MEMBER_ROLES.MEMBER,
        nickname
      });

      await this.groupRepository.incrementMemberCount(groupId);
      res.status(201).json({ success: true, message: 'Miembro agregado', data: member.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role, nickname, status } = req.body;
      const adminProfileId = req.user.profileId;

      const memberToUpdate = await this.groupMemberRepository.findById(id);
      if (!memberToUpdate) {
        throw new AppError('Membresía no encontrada', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const adminMembership = await this.groupMemberRepository.findMembership(memberToUpdate.groupId, adminProfileId);
      const isSelf = memberToUpdate.profileId === adminProfileId;

      if (!isSelf && (!adminMembership || !adminMembership.canManageMembers())) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      const member = await this.groupMemberRepository.update(id, { role, nickname, status });
      res.json({ success: true, message: 'Membresía actualizada', data: member.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminProfileId = req.user.profileId;

      const memberToRemove = await this.groupMemberRepository.findById(id);
      if (!memberToRemove) {
        throw new AppError('Membresía no encontrada', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const adminMembership = await this.groupMemberRepository.findMembership(memberToRemove.groupId, adminProfileId);
      const isSelf = memberToRemove.profileId === adminProfileId;

      if (!isSelf && (!adminMembership || !adminMembership.canManageMembers())) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      if (memberToRemove.isOwner()) {
        throw new AppError('No se puede eliminar al propietario', 403, 'CANNOT_REMOVE_OWNER');
      }

      await this.groupMemberRepository.update(id, { status: MEMBER_STATUS.LEFT });
      await this.groupRepository.decrementMemberCount(memberToRemove.groupId);

      res.json({ success: true, message: isSelf ? 'Saliste del grupo' : 'Miembro eliminado' });
    } catch (error) {
      next(error);
    }
  };

  promote = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminProfileId = req.user.profileId;

      const memberToPromote = await this.groupMemberRepository.findById(id);
      if (!memberToPromote) {
        throw new AppError('Membresía no encontrada', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const adminMembership = await this.groupMemberRepository.findMembership(memberToPromote.groupId, adminProfileId);
      if (!adminMembership || !adminMembership.canManageMembers()) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      if (role === MEMBER_ROLES.ADMIN && !adminMembership.isOwner()) {
        throw new AppError('Solo el owner puede hacer admins', 403, 'ONLY_OWNER');
      }

      const member = await this.groupMemberRepository.update(id, {
        role: role || MEMBER_ROLES.MODERATOR
      });

      res.json({ success: true, message: 'Miembro promovido', data: member.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  ban = async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminProfileId = req.user.profileId;

      const memberToBan = await this.groupMemberRepository.findById(id);
      if (!memberToBan) {
        throw new AppError('Membresía no encontrada', 404, 'MEMBERSHIP_NOT_FOUND');
      }

      const adminMembership = await this.groupMemberRepository.findMembership(memberToBan.groupId, adminProfileId);
      if (!adminMembership || !adminMembership.isModerator()) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      await this.groupMemberRepository.update(id, { status: MEMBER_STATUS.BANNED });
      await this.groupRepository.decrementMemberCount(memberToBan.groupId);

      res.json({ success: true, message: 'Miembro baneado' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new GroupMemberController();