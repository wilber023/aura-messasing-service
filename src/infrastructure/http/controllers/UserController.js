/**
 * Controller: UserController
 */

const { UserRepository } = require('../../repositories');
const { AppError } = require('../middlewares');
const { validationResult } = require('express-validator');

class UserController {
  constructor() {
    this.userRepository = new UserRepository();
  }

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search, isOnline, isActive } = req.query;
      
      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        isOnline: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };

      const result = await this.userRepository.findAll(filters);

      res.json({ success: true, message: 'Usuarios obtenidos', ...result });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      res.json({ success: true, data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  getByProfileId = async (req, res, next) => {
    try {
      const { profileId } = req.params;
      const user = await this.userRepository.findByProfileId(profileId);

      if (!user) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      res.json({ success: true, data: user.toJSON() });
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

      const { profileId, username, displayName, avatarUrl } = req.body;

      const existingUser = await this.userRepository.findByProfileId(profileId);
      if (existingUser) {
        throw new AppError('Ya existe un usuario con este profileId', 409, 'USER_EXISTS');
      }

      const user = await this.userRepository.create({ profileId, username, displayName, avatarUrl });

      res.status(201).json({ success: true, message: 'Usuario creado', data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { username, displayName, avatarUrl, isActive } = req.body;

      const user = await this.userRepository.update(id, { username, displayName, avatarUrl, isActive });

      if (!user) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      res.json({ success: true, message: 'Usuario actualizado', data: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await this.userRepository.delete(id);

      if (!deleted) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
      }

      res.json({ success: true, message: 'Usuario eliminado' });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new UserController();