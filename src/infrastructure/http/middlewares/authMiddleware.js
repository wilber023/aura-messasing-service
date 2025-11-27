const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 AUTH MIDDLEWARE - Nueva petición');
    console.log('📍 URL:', req.method, req.originalUrl);
    console.log('📋 Authorization header:', authHeader ? 'PRESENTE' : 'AUSENTE');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ NO HAY TOKEN o formato incorrecto');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token recibido (primeros 50 chars):', token.substring(0, 50) + '...');
    console.log('🔐 JWT_SECRET usado:', process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ TOKEN VÁLIDO!');
    console.log('👤 Usuario decodificado:', JSON.stringify(decoded, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    req.user = {
      id: decoded.id,
      profileId: decoded.profileId || decoded.profile_id || decoded.id,
      username: decoded.username,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.log('❌ ERROR AL VALIDAR TOKEN');
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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