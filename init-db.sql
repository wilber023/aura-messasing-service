-- ============================================
-- AURA Messaging Service - PostgreSQL Init Script
-- ============================================

-- Crear extensiones necesarias para PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurar la zona horaria
SET timezone = 'UTC';

-- Crear el usuario de la aplicación (si no existe)
-- Nota: El usuario principal ya se crea con POSTGRES_USER en docker-compose

-- Otorgar permisos completos sobre la base de datos
GRANT ALL PRIVILEGES ON DATABASE aura_messaging TO postgres;

-- Configurar el esquema público
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Log de inicialización
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL inicializado correctamente para AURA Messaging Service';
  RAISE NOTICE 'Base de datos: aura_messaging';
  RAISE NOTICE 'Extensiones: uuid-ossp, pg_trgm';
END $$;
