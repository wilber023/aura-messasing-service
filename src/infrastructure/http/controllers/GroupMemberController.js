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

  syncAddMember = async (req, res, next) => {
  try {
    console.log('\n🔥🔥🔥 SYNC ADD MEMBER INICIADO 🔥🔥🔥');
    console.log('📍 req.params:', req.params);
    console.log('📍 req.body:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // 🔥 CORRECCIÓN: groupId es el externalId (ID de la comunidad)
    const communityId = req.params.groupId; // Este es el UUID de communities
    const { profileId, status = 'active' } = req.body;

    console.log(`📥 Agregando miembro: ${profileId} a comunidad: ${communityId}`);

    if (!communityId) {
      throw new AppError('communityId es requerido', 400, 'MISSING_COMMUNITY_ID');
    }

    // 🔥 BUSCAR EL GRUPO DE CHAT POR external_id
    console.log(`🔍 Buscando grupo de chat con external_id: ${communityId}`);
    const group = await this.groupRepository.findByExternalId(communityId);
    
    if (!group) {
      console.log(`❌ Grupo de chat NO encontrado para comunidad ${communityId}`);
      throw new AppError('Grupo de chat no encontrado', 404, 'GROUP_NOT_FOUND');
    }

    console.log(`✅ Grupo de chat encontrado: ${group.name}`);
    console.log(`📌 ID interno del grupo: ${group.id}`);

    // 🔥 USAR EL ID INTERNO DEL GRUPO DE CHAT
    const chatGroupId = group.id; // Este es el UUID de chat_groups

    // Verificar si ya es miembro
    const existingMembership = await this.groupMemberRepository.findMembership(
      chatGroupId, // 🔥 USAR chatGroupId, NO communityId
      profileId
    );
    
    if (existingMembership) {
      if (existingMembership.status === 'left') {
        console.log(`🔄 Reactivando miembro ${profileId}`);
        const reactivated = await this.groupMemberRepository.update(existingMembership.id, {
          status: 'active'
        });
        
        await this.groupRepository.incrementMemberCount(chatGroupId);
        
        return res.status(200).json({
          success: true,
          message: 'Usuario reactivado en el grupo',
          data: reactivated.toJSON()
        });
      }
      
      console.log(`ℹ️ Usuario ${profileId} ya es miembro activo`);
      return res.status(200).json({
        success: true,
        message: 'Usuario ya es miembro del grupo',
        data: existingMembership.toJSON()
      });
    }

    // 🔥 CREAR MIEMBRO CON EL ID INTERNO DEL GRUPO
    console.log(`➕ Creando miembro en group_members...`);
    const member = await this.groupMemberRepository.create({
      groupId: chatGroupId, // 🔥 USAR chatGroupId
      profileId,
      role: MEMBER_ROLES.MEMBER,
      status: status
    });

    await this.groupRepository.incrementMemberCount(chatGroupId);

    console.log(`✅✅✅ Usuario ${profileId} agregado exitosamente al grupo ${chatGroupId}`);
    console.log('🔥🔥🔥 SYNC ADD MEMBER COMPLETADO 🔥🔥🔥\n');

    res.status(201).json({
      success: true,
      message: 'Usuario agregado al grupo exitosamente',
      data: member.toJSON()
    });

  } catch (error) {
    console.error('❌ Error en syncAddMember:', error);
    next(error);
  }
};

syncRemoveMember = async (req, res, next) => {
  try {
    console.log('\n🚪🚪🚪 SYNC REMOVE MEMBER INICIADO 🚪🚪🚪');
    
    const communityId = req.params.groupId; // external_id
    const { profileId } = req.params;

    console.log(`📥 Removiendo miembro: ${profileId} de comunidad: ${communityId}`);

    // 🔥 BUSCAR GRUPO POR external_id
    const group = await this.groupRepository.findByExternalId(communityId);
    
    if (!group) {
      console.log(`❌ Grupo no encontrado para comunidad ${communityId}`);
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    const chatGroupId = group.id; // ID interno

    // Buscar la membresía usando el ID interno
    const membership = await this.groupMemberRepository.findMembership(
      chatGroupId, // 🔥 USAR chatGroupId
      profileId
    );

    if (!membership) {
      console.log(`⚠️ Miembro ${profileId} no encontrado en grupo ${chatGroupId}`);
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado en el grupo'
      });
    }

    await this.groupMemberRepository.update(membership.id, { 
      status: MEMBER_STATUS.LEFT 
    });

    await this.groupRepository.decrementMemberCount(chatGroupId);

    console.log(`✅ Usuario ${profileId} removido del grupo ${chatGroupId}`);
    console.log('🚪🚪🚪 SYNC REMOVE MEMBER COMPLETADO 🚪🚪🚪\n');

    res.status(200).json({
      success: true,
      message: 'Usuario removido del grupo exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en syncRemoveMember:', error);
    next(error);
  }
}; 

}

module.exports = new GroupMemberController();