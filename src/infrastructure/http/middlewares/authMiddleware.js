/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      profileId: decoded.profileId || decoded.profile_id,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = {
        id: decoded.id,
        profileId: decoded.profileId || decoded.profile_id,
        username: decoded.username
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };