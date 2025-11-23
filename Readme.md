# AURA Messaging Service

Microservicio de mensajería para la **Plataforma AURA** (Análisis y Reconexión Humana Asistida).

## 📋 Descripción

Este microservicio maneja toda la funcionalidad de mensajería de AURA:
- **Conversaciones individuales** entre usuarios
- **Comunidades** (Mis grupos / Descubrir)
- **Actividades cerca de ti**
- **Grupos privados**

## 🏗️ Arquitectura

Arquitectura **Hexagonal** (Ports & Adapters):

```
src/
├── domain/                    # Núcleo de negocio
│   ├── entities/              # Entidades del dominio
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── Group.js
│   │   └── GroupMember.js
│   └── repositories/          # Interfaces de repositorios (Ports)
│
├── application/               # Casos de uso
│   ├── use-cases/
│   └── dtos/
│
└── infrastructure/            # Adaptadores
    ├── database/
    │   ├── config/
    │   ├── models/            # Modelos Sequelize
    │   └── migrations/
    ├── http/
    │   ├── controllers/
    │   ├── routes/
    │   └── middlewares/
    ├── repositories/          # Implementación de repositorios
    └── websocket/             # Servidor WebSocket
```

## 🚀 Instalación

### Prerrequisitos
- Node.js v18+
- MySQL 8.0+
- npm o yarn

### Pasos

1. **Clonar repositorio**
```bash
git clone <repository-url>
cd aura-messaging-service
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

4. **Crear base de datos**
```sql
CREATE DATABASE aura_messaging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Ejecutar migraciones** (opcional - se auto-sincroniza en desarrollo)
```bash
npm run migrate
```

6. **Iniciar servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📡 API Endpoints

### Users
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/users` | Listar usuarios |
| POST | `/api/v1/users` | Crear usuario |
| GET | `/api/v1/users/:id` | Obtener usuario |
| PUT | `/api/v1/users/:id` | Actualizar usuario |
| DELETE | `/api/v1/users/:id` | Eliminar usuario |

### Messages
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/messages` | Listar mensajes |
| POST | `/api/v1/messages` | Enviar mensaje |
| GET | `/api/v1/messages/:id` | Obtener mensaje |
| PUT | `/api/v1/messages/:id` | Editar mensaje |
| DELETE | `/api/v1/messages/:id` | Eliminar mensaje |
| GET | `/api/v1/messages/conversation/:id` | Mensajes de conversación |
| GET | `/api/v1/messages/group/:id` | Mensajes de grupo |

### Conversations
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | Mis conversaciones |
| POST | `/api/v1/conversations` | Iniciar conversación |
| GET | `/api/v1/conversations/:id` | Obtener conversación |
| PATCH | `/api/v1/conversations/:id/archive` | Archivar |
| PATCH | `/api/v1/conversations/:id/block` | Bloquear |
| PATCH | `/api/v1/conversations/:id/read` | Marcar como leída |

### Groups
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/groups` | Listar grupos |
| POST | `/api/v1/groups` | Crear grupo |
| GET | `/api/v1/groups/:id` | Obtener grupo |
| PUT | `/api/v1/groups/:id` | Actualizar grupo |
| DELETE | `/api/v1/groups/:id` | Eliminar grupo |
| GET | `/api/v1/groups/my/communities` | Mis comunidades |
| GET | `/api/v1/groups/my/activities` | Mis actividades |
| GET | `/api/v1/groups/discover` | Descubrir comunidades |
| GET | `/api/v1/groups/activities` | Actividades cerca de ti |
| POST | `/api/v1/groups/:id/join` | Unirse |
| POST | `/api/v1/groups/:id/leave` | Salir |

### Group Members
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/group-members` | Listar miembros |
| POST | `/api/v1/group-members` | Agregar miembro |
| GET | `/api/v1/group-members/:id` | Obtener miembro |
| PUT | `/api/v1/group-members/:id` | Actualizar miembro |
| DELETE | `/api/v1/group-members/:id` | Eliminar miembro |
| PATCH | `/api/v1/group-members/:id/promote` | Promover |
| PATCH | `/api/v1/group-members/:id/ban` | Banear |
| PATCH | `/api/v1/group-members/:id/mute` | Silenciar |

## 🔌 WebSocket Events

### Cliente -> Servidor
- `join_conversation` - Unirse a sala de conversación
- `leave_conversation` - Salir de sala
- `join_group` - Unirse a sala de grupo
- `leave_group` - Salir de grupo
- `typing_start` - Empezar a escribir
- `typing_stop` - Dejar de escribir
- `message_read` - Marcar mensajes como leídos

### Servidor -> Cliente
- `new_message` - Nuevo mensaje
- `message_updated` - Mensaje editado
- `message_deleted` - Mensaje eliminado
- `user_typing` - Usuario escribiendo
- `messages_read` - Mensajes leídos
- `member_joined` - Miembro se unió
- `member_left` - Miembro salió

## 🔐 Autenticación

El servicio usa **JWT** para autenticación. Los tokens deben enviarse en el header:

```
Authorization: Bearer <token>
```

Para WebSocket, enviar token en handshake:
```javascript
const socket = io('ws://localhost:3001', {
  auth: { token: '<jwt_token>' }
});
```

## 🔗 Comunicación entre Microservicios

La comunicación se realiza a través del **`profileId`** (ID del perfil completo del usuario).

Cuando un usuario se registra en el servicio principal:
1. Se crea el perfil en el microservicio de usuarios
2. Se sincroniza con este servicio vía `POST /api/v1/users`
3. El `profileId` se usa para todas las operaciones

## 📊 Modelos de Datos

### User
```javascript
{
  id: UUID,
  profileId: UUID,     // Clave de comunicación
  username: String,
  displayName: String,
  avatarUrl: String,
  isOnline: Boolean,
  lastSeenAt: DateTime
}
```

### Message
```javascript
{
  id: UUID,
  conversationId: UUID,  // Para chats 1:1
  groupId: UUID,         // Para grupos/comunidades
  senderProfileId: UUID,
  content: String,
  messageType: Enum,
  status: Enum,
  mediaUrl: String,
  replyToId: UUID
}
```

### Conversation
```javascript
{
  id: UUID,
  participant1ProfileId: UUID,
  participant2ProfileId: UUID,
  lastMessageId: UUID,
  unreadCount1: Integer,
  unreadCount2: Integer
}
```

### Group
```javascript
{
  id: UUID,
  name: String,
  groupType: Enum,  // community, activity, private
  creatorProfileId: UUID,
  externalId: UUID, // Referencia a otro microservicio
  memberCount: Integer,
  location: JSON    // Para actividades
}
```

### GroupMember
```javascript
{
  id: UUID,
  groupId: UUID,
  profileId: UUID,
  role: Enum,      // owner, admin, moderator, member
  status: Enum,    // active, muted, banned, left
  unreadCount: Integer
}
```

## 🛠️ Scripts

```bash
npm start        # Iniciar en producción
npm run dev      # Iniciar con nodemon
npm test         # Ejecutar tests
npm run migrate  # Ejecutar migraciones
```

## 📝 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | development |
| `PORT` | Puerto del servidor | 3001 |
| `DB_HOST` | Host de MySQL | localhost |
| `DB_PORT` | Puerto de MySQL | 3306 |
| `DB_NAME` | Nombre de BD | aura_messaging |
| `DB_USER` | Usuario de BD | root |
| `DB_PASSWORD` | Contraseña de BD | - |
| `JWT_SECRET` | Secret para JWT | - |
| `JWT_EXPIRES_IN` | Expiración JWT | 24h |
| `WS_CORS_ORIGIN` | CORS para WS | * |

## 👥 Autor

**Innovación W.E.L.**

## 📄 Licencia

ISC