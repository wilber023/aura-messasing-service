/**
 * Controller: GroupController
 */

const { GroupRepository, GroupMemberRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');
const { GROUP_TYPES, MEMBER_ROLES } = require('../../../domain/entities');

class GroupController {
  constructor() {
    this.groupRepository = new GroupRepository();
    this.groupMemberRepository = new GroupMemberRepository();
  }

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, groupType, search } = req.query;

      if (search) {
        const result = await this.groupRepository.findPublicGroups({
          page: parseInt(page),
          limit: parseInt(limit),
          search,
          groupType
        });
        return res.json({ success: true, ...result });
      }

      const result = await this.groupRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        groupType,
        status: 'active'
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getMyCommunities = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const profileId = req.user.profileId;

      const result = await this.groupMemberRepository.findByProfileId(profileId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status: 'active',
        groupType: GROUP_TYPES.COMMUNITY
      });

      const groups = result.data.map(membership => ({
        ...membership.group,
        myRole: membership.role,
        unreadCount: membership.unreadCount
      }));

      res.json({ success: true, data: groups, total: result.total, page: result.page, totalPages: result.totalPages });
    } catch (error) {
      next(error);
    }
  };

  discoverCommunities = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const result = await this.groupRepository.findPublicGroups({
        page: parseInt(page),
        limit: parseInt(limit),
        groupType: GROUP_TYPES.COMMUNITY,
        search
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getActivities = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, upcoming } = req.query;

      const result = await this.groupRepository.findActivities({
        page: parseInt(page),
        limit: parseInt(limit),
        upcoming: upcoming === 'true'
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getMyActivities = async (req, res, next) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const profileId = req.user.profileId;

      const result = await this.groupMemberRepository.findByProfileId(profileId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status: 'active',
        groupType: GROUP_TYPES.ACTIVITY
      });

      const activities = result.data.map(membership => ({
        ...membership.group,
        myRole: membership.role,
        unreadCount: membership.unreadCount
      }));

      res.json({ success: true, data: activities, total: result.total, page: result.page, totalPages: result.totalPages });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user?.profileId;

      const group = await this.groupRepository.findById(id);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const data = group.toJSON();

      if (profileId) {
        const membership = await this.groupMemberRepository.findMembership(id, profileId);
        data.isMember = !!membership;
        data.myRole = membership?.role;
      }

      res.json({ success: true, data });
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

      const { name, description, imageUrl, groupType, externalId, maxMembers, isPublic, location, scheduledAt } = req.body;
      const creatorProfileId = req.user.profileId;

      const group = await this.groupRepository.create({
        name,
        description,
        imageUrl,
        groupType: groupType || GROUP_TYPES.COMMUNITY,
        creatorProfileId,
        externalId,
        maxMembers,
        isPublic: isPublic !== false,
        location,
        scheduledAt
      });

      await this.groupMemberRepository.create({
        groupId: group.id,
        profileId: creatorProfileId,
        role: MEMBER_ROLES.OWNER
      });

      await this.groupRepository.update(group.id, { memberCount: 1 });

      const updatedGroup = await this.groupRepository.findById(group.id);
      res.status(201).json({ success: true, message: 'Grupo creado', data: updatedGroup.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;
      const { name, description, imageUrl, maxMembers, isPublic, location, scheduledAt } = req.body;

      const group = await this.groupRepository.findById(id);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const membership = await this.groupMemberRepository.findMembership(id, profileId);
      if (!membership || !membership.canEditGroup()) {
        throw new AppError('Sin permisos', 403, 'NOT_AUTHORIZED');
      }

      const updated = await this.groupRepository.update(id, {
        name, description, imageUrl, maxMembers, isPublic, location, scheduledAt
      });

      res.json({ success: true, message: 'Grupo actualizado', data: updated.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const group = await this.groupRepository.findById(id);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const membership = await this.groupMemberRepository.findMembership(id, profileId);
      if (!membership || !membership.isOwner()) {
        throw new AppError('Solo el creador puede eliminar', 403, 'NOT_OWNER');
      }

      await this.groupRepository.delete(id);
      res.json({ success: true, message: 'Grupo eliminado' });
    } catch (error) {
      next(error);
    }
  };

  join = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const group = await this.groupRepository.findById(id);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const existingMembership = await this.groupMemberRepository.findMembership(id, profileId);
      if (existingMembership && existingMembership.status !== 'left') {
        throw new AppError('Ya eres miembro', 400, 'ALREADY_MEMBER');
      }

      if (!group.canAcceptMoreMembers()) {
        throw new AppError('Grupo lleno', 400, 'GROUP_FULL');
      }

      if (!group.isPublic) {
        throw new AppError('Grupo privado', 403, 'PRIVATE_GROUP');
      }

      let membership;
      if (existingMembership) {
        membership = await this.groupMemberRepository.update(existingMembership.id, {
          status: 'active',
          role: MEMBER_ROLES.MEMBER
        });
      } else {
        membership = await this.groupMemberRepository.create({
          groupId: id,
          profileId,
          role: MEMBER_ROLES.MEMBER
        });
      }

      await this.groupRepository.incrementMemberCount(id);
      res.json({ success: true, message: 'Te uniste al grupo', data: membership.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  leave = async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileId = req.user.profileId;

      const membership = await this.groupMemberRepository.findMembership(id, profileId);
      if (!membership) {
        throw new AppError('No eres miembro', 400, 'NOT_A_MEMBER');
      }

      if (membership.isOwner()) {
        throw new AppError('El creador no puede salir', 400, 'OWNER_CANNOT_LEAVE');
      }

      await this.groupMemberRepository.update(membership.id, { status: 'left' });
      await this.groupRepository.decrementMemberCount(id);

      res.json({ success: true, message: 'Saliste del grupo' });
    } catch (error) {
      next(error);
    }
  };
getMembers = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const group = await this.groupRepository.findById(id);
      if (!group) {
        throw new AppError('Grupo no encontrado', 404, 'GROUP_NOT_FOUND');
      }

      const result = await this.groupMemberRepository.findByGroupId(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status: 'active'
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

 syncGroup = async (req, res, next) => {
  try {
    console.log('\n🔥🔥🔥 SYNC GROUP ENDPOINT LLAMADO 🔥🔥🔥');
    console.log('📦 Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('📋 Headers:', req.headers);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      externalId,
      name,
      description,
      imageUrl,
      groupType = 'community',
      maxMembers = 500,
      isPublic = true,
      creatorProfileId
    } = req.body;

    console.log(`📥 Sincronizando grupo: ${name} (externalId: ${externalId})`);
    console.log(`👤 Creador: ${creatorProfileId}`);

    // Verificar si ya existe
    console.log(`🔍 Buscando grupo existente con externalId: ${externalId}`);
    const existingGroup = await this.groupRepository.findByExternalId(externalId);
    
    if (existingGroup) {
      console.log(`ℹ️ Grupo ${externalId} ya existe en BD`);
      console.log(`📌 ID interno: ${existingGroup.id}`);
      return res.status(200).json({
        success: true,
        message: 'Grupo ya existe',
        data: existingGroup.toJSON()
      });
    }

    // Crear el grupo
    console.log(`➕ Creando nuevo grupo en BD...`);
    const group = await this.groupRepository.create({
      name,
      description,
      imageUrl,
      groupType,
      externalId,
      maxMembers,
      isPublic,
      creatorProfileId
    });

    console.log(`✅ Grupo creado en BD: ${group.id}`);

    // Agregar al creador como owner
    if (creatorProfileId) {
      console.log(`➕ Agregando creador como owner...`);
      await this.groupMemberRepository.create({
        groupId: group.id,
        profileId: creatorProfileId,
        role: 'owner',
        status: 'active'
      });
      await this.groupRepository.incrementMemberCount(group.id);
      console.log(`✅ Creador agregado como owner`);
    }

    console.log(`✅✅✅ SYNC GROUP COMPLETADO EXITOSAMENTE ✅✅✅\n`);

    res.status(201).json({
      success: true,
      message: 'Grupo sincronizado exitosamente',
      data: group.toJSON()
    });

  } catch (error) {
    console.error('❌❌❌ ERROR EN SYNC GROUP ❌❌❌');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    next(error);
  }
};
}

module.exports = new GroupController();
