# 🚀 AURA Messaging Service

**Microservicio de mensajería en tiempo real para la plataforma AURA - Reconexión Humana**

[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/wilber023/aura-messasing-service)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![Node](https://img.shields.io/badge/node-20-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](docker-compose.yml)

---

## 📋 Índice

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Inicio Rápido](#-inicio-rápido)
- [Despliegue](#-despliegue)
- [Arquitectura](#-arquitectura)
- [API](#-api)
- [Documentación](#-documentación)

---

## ✨ Características

### Mensajería
- ✅ Conversaciones 1 a 1 en tiempo real
- ✅ Grupos y comunidades ilimitados
- ✅ Soporte multimedia (imágenes, videos, audio, archivos)
- ✅ Estado de mensajes (enviado, entregado, leído)
- ✅ Indicadores de "escribiendo..."
- ✅ Respuestas a mensajes (replies)
- ✅ Edición y eliminación de mensajes

### Grupos
- ✅ Comunidades públicas y privadas
- ✅ Actividades con ubicación geográfica
- ✅ Roles y permisos (owner, admin, moderator, member)
- ✅ Límite configurable de miembros
- ✅ Gestión de membresías (ban, promote, kick)

### Técnicas
- ✅ WebSocket (Socket.IO) para tiempo real
- ✅ API RESTful completa
- ✅ Autenticación JWT
- ✅ Paginación eficiente
- ✅ Rate limiting
- ✅ Dockerizado 100%
- ✅ PostgreSQL con Sequelize ORM
- ✅ Despliegue automatizado

---

## 🛠 Stack Tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| **Runtime** | Node.js | 20 |
| **Framework** | Express.js | 4.18 |
| **Base de datos** | PostgreSQL | 16 |
| **ORM** | Sequelize | 6.35 |
| **WebSocket** | Socket.IO | 4.7 |
| **Autenticación** | JWT | 9.0 |
| **Seguridad** | Helmet + CORS | Latest |
| **Containerización** | Docker + Docker Compose | Latest |
| **Cloud** | AWS EC2 | - |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Docker** 20.10+
- **Docker Compose** 2.0+

### Instalación (5 minutos)

```bash
# 1. Clonar el repositorio
git clone https://github.com/wilber023/aura-messasing-service.git
cd aura-messaging-service

# 2. Configurar variables de entorno
cp .env.example .env

# 3. (Opcional) Generar secretos seguros para JWT
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -base64 32)|g" .env
sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -base64 32)|g" .env

# 4. Levantar servicios con Docker
docker-compose up -d

# 5. Ejecutar migraciones
docker-compose exec app npm run db:migrate

# 6. (Opcional) Cargar datos de prueba
docker-compose exec app npm run db:seed
```

### Verificar Instalación

```bash
# Ver logs
docker-compose logs -f

# Health check
curl http://localhost:3001/api/v1/health

# Estado de servicios
docker-compose ps
```

**¡Listo!** El servicio estará corriendo en:
- 🌐 **API REST:** http://localhost:3001/api/v1
- 🔌 **WebSocket:** ws://localhost:3001
- 🐘 **PostgreSQL:** localhost:5432

---

## 🐳 Despliegue

### Desarrollo Local

```bash
# Levantar servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f app
```

### Producción en AWS EC2

#### Opción 1: Script Automatizado ⚡ (Recomendado)

```bash
# 1. Conectarse a EC2
ssh -i tu-key.pem ubuntu@tu-ip-publica

# 2. Ejecutar script de despliegue
curl -O https://raw.githubusercontent.com/wilber023/aura-messasing-service/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**El script automáticamente:**
- ✅ Detecta el SO (Ubuntu/Amazon Linux/CentOS)
- ✅ Instala Docker y Docker Compose
- ✅ Configura firewall
- ✅ Clona el repositorio
- ✅ Genera secretos JWT aleatorios
- ✅ Construye y levanta contenedores
- ✅ Ejecuta migraciones
- ✅ Configura restart policies
- ✅ Verifica la instalación

**Tiempo estimado:** 5-10 minutos

#### Opción 2: Despliegue Manual

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas.

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
aura-messaging-service/
├── src/
│   ├── domain/                     # Lógica de negocio
│   │   ├── entities/               # Entidades de dominio
│   │   └── repositories/           # Interfaces de repositorios
│   │
│   ├── infrastructure/             # Implementaciones técnicas
│   │   ├── database/
│   │   │   ├── config/             # Configuración de BD
│   │   │   ├── models/             # Modelos Sequelize
│   │   │   ├── migrations/         # Migraciones
│   │   │   └── seeders/            # Datos de prueba
│   │   │
│   │   ├── http/
│   │   │   ├── controllers/        # Controladores API
│   │   │   ├── routes/             # Definición de rutas
│   │   │   ├── middlewares/        # Middlewares (auth, errors)
│   │   │   └── server.js           # Configuración Express
│   │   │
│   │   ├── websocket/              # Socket.IO
│   │   └── repositories/           # Implementaciones
│   │
│   └── index.js                    # Punto de entrada
│
├── docker-compose.yml              # Orquestación de contenedores
├── Dockerfile                      # Imagen de producción
├── deploy.sh                       # Script de despliegue EC2
├── init-db.sql                     # Inicialización de PostgreSQL
├── .env.example                    # Template de variables
├── .dockerignore                   # Exclusiones de Docker
│
└── docs/
    ├── DEPLOYMENT.md               # Guía de despliegue
    ├── MIGRATION_MYSQL_TO_POSTGRESQL.md  # Resumen de migración
    └── README.md                   # Integración frontend (Flutter)
```

### Arquitectura de Servicios

```
┌─────────────────┐
│   Frontend      │
│  (Flutter App)  │
└─────────┬───────┘
          │
          ├──────────────┐
          │              │
     HTTP/REST      WebSocket
          │              │
          ▼              ▼
┌──────────────────────────┐
│   AURA Messaging API     │
│     (Express + Socket.IO)│
│                          │
│  ┌────────────────────┐  │
│  │  Controllers       │  │
│  │  ↓                 │  │
│  │  Repositories      │  │
│  │  ↓                 │  │
│  │  Sequelize ORM     │  │
│  └────────┬───────────┘  │
└───────────┼──────────────┘
            │
            ▼
    ┌──────────────┐
    │  PostgreSQL  │
    │     (16)     │
    └──────────────┘
```

---

## 🔌 API

### Endpoints Principales

#### Health Check
```http
GET /api/v1/health
```

#### Usuarios
```http
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
GET    /api/v1/users/profile/:profileId
```

#### Conversaciones
```http
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/:id
PATCH  /api/v1/conversations/:id/read
PATCH  /api/v1/conversations/:id/archive
```

#### Mensajes
```http
GET    /api/v1/messages/conversation/:conversationId
GET    /api/v1/messages/group/:groupId
POST   /api/v1/messages
PUT    /api/v1/messages/:id
DELETE /api/v1/messages/:id
```

#### Grupos
```http
GET    /api/v1/groups
POST   /api/v1/groups
GET    /api/v1/groups/:id
PUT    /api/v1/groups/:id
DELETE /api/v1/groups/:id
POST   /api/v1/groups/:id/join
POST   /api/v1/groups/:id/leave
GET    /api/v1/groups/:id/members
GET    /api/v1/groups/my/communities
GET    /api/v1/groups/my/activities
GET    /api/v1/groups/discover
GET    /api/v1/groups/activities
```

### WebSocket Events

**Cliente → Servidor:**
```javascript
join_conversation    // Unirse a sala de conversación
leave_conversation   // Salir de sala
join_group          // Unirse a sala de grupo
leave_group         // Salir de sala de grupo
typing_start        // Indicar que está escribiendo
typing_stop         // Dejar de escribir
```

**Servidor → Cliente:**
```javascript
new_message         // Nuevo mensaje recibido
message_updated     // Mensaje editado
message_deleted     // Mensaje eliminado
user_typing         // Usuario escribiendo
messages_read       // Mensajes marcados como leídos
member_joined       // Nuevo miembro en grupo
member_left         // Miembro salió del grupo
```

---

## 📚 Documentación

- 📖 **[Guía de Despliegue Completa](DEPLOYMENT.md)**
  - Instalación local con Docker
  - Despliegue en AWS EC2
  - Comandos útiles
  - Solución de problemas

- 🔄 **[Migración MySQL → PostgreSQL](MIGRATION_MYSQL_TO_POSTGRESQL.md)**
  - Resumen de cambios
  - Diferencias entre MySQL y PostgreSQL
  - Ventajas de PostgreSQL
  - Checklist de migración

- 💻 **[Integración Frontend - Flutter](README.md)**
  - Endpoints API REST
  - WebSocket en tiempo real
  - Ejemplos de código
  - Modelos de datos
  - Buenas prácticas

---

## 🛠 Comandos Útiles

### Docker

```bash
# Ver logs
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Reconstruir desde cero
docker-compose build --no-cache
docker-compose up -d

# Estado de contenedores
docker-compose ps

# Shell en contenedor de app
docker-compose exec app sh

# Shell en PostgreSQL
docker-compose exec postgres psql -U postgres -d aura_messaging
```

### Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec app npm run db:migrate

# Revertir última migración
docker-compose exec app npm run db:migrate:undo

# Revertir todas las migraciones
docker-compose exec app npm run db:migrate:undo:all

# Ejecutar seeders
docker-compose exec app npm run db:seed

# Revertir seeders
docker-compose exec app npm run db:seed:undo:all

# Reset completo
docker-compose exec app npm run db:reset

# Ver tablas
docker-compose exec postgres psql -U postgres -d aura_messaging -c "\dt"

# Backup de BD
docker-compose exec postgres pg_dump -U postgres aura_messaging > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres aura_messaging < backup.sql
```

### Desarrollo

```bash
# Instalar dependencias (local)
npm install

# Modo desarrollo con nodemon
npm run dev

# Ejecutar tests
npm test

# Ver uso de recursos
docker stats
```

---

## 🔒 Seguridad

### Implementado

- ✅ Autenticación JWT
- ✅ Validación de datos (express-validator)
- ✅ Headers de seguridad (Helmet)
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Usuario no-root en Docker
- ✅ Variables de entorno externalizadas
- ✅ SSL/TLS opcional para PostgreSQL

### Recomendaciones Producción

1. **Cambiar secretos:**
   ```bash
   # Generar secretos seguros
   openssl rand -base64 32
   ```

2. **Configurar SSL:**
   - Usar reverse proxy (Nginx/Traefik)
   - Certificados Let's Encrypt

3. **Limitar acceso a PostgreSQL:**
   - Solo localhost o red privada
   - Eliminar puerto público en docker-compose.yml

4. **Backups regulares:**
   - Script automatizado con cron
   - Almacenamiento externo (S3)

---

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

ISC License - ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

**Innovación W.E.L.**

---

## 📞 Soporte

- 📧 Email: soporte@aura.com
- 🐛 Issues: [GitHub Issues](https://github.com/wilber023/aura-messasing-service/issues)
- 📖 Documentación completa: [/docs](docs/)

---

## 🗺️ Roadmap

- [ ] Redis para caché y sesiones
- [ ] Llamadas de voz/video (WebRTC)
- [ ] Dashboard de administración
- [ ] Métricas con Prometheus + Grafana
- [ ] CI/CD con GitHub Actions
- [ ] Tests E2E
- [ ] Documentación API con Swagger
- [ ] Notificaciones push
- [ ] Búsqueda full-text en mensajes

---

## 📊 Métricas

![Node](https://img.shields.io/badge/node-20-green.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![License](https://img.shields.io/badge/license-ISC-blue.svg)

---

**Versión:** 2.0.0 (PostgreSQL)
**Última actualización:** 2024-11-01
**Autor:** Innovación W.E.L.
