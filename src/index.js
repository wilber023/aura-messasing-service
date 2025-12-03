/**
 * AURA Messaging Service
 * Main Entry Point
 */

require('dotenv').config();

const http = require('http');
const createServer = require('./infrastructure/http/server');
const { testConnection, syncDatabase } = require('./infrastructure/database/connection');
const { initializeWebSocket } = require('./infrastructure/websocket/socketServer');

// Cargar modelos con asociaciones
require('./infrastructure/database/models');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  console.log('🚀 Iniciando AURA Messaging Service...');
  console.log('─'.repeat(50));

  // Probar conexión a base de datos
  console.log('📦 Conectando a base de datos PostgreSQL...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ No se pudo conectar a la base de datos. Abortando...');
    process.exit(1);
  }

  // Sincronizar modelos (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Sincronizando modelos de base de datos...');
    await syncDatabase(false);
  }

  // Crear servidor Express
  const app = createServer();
  const httpServer = http.createServer(app);

  // Inicializar WebSocket
  console.log('🔌 Inicializando servidor WebSocket...');
  initializeWebSocket(httpServer);

  // Iniciar servidor
  httpServer.listen(PORT, () => {
    console.log('─'.repeat(50));
    console.log(`✅ AURA Messaging Service corriendo en puerto ${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/v1`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log('─'.repeat(50));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Cerrando servidor...');
    httpServer.close(() => {
      console.log('✅ Servidor cerrado');
      process.exit(0);
    });
  });
};

startServer();