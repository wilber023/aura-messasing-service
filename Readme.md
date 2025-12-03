# 📚 API Documentation - AURA Messaging Service

> **Documentación completa para el equipo de Frontend**

## 🔗 URL Base

```
http://YOUR_EC2_PUBLIC_IP:3001/api/v1
```

**Ejemplo:**
```
http://54.242.230.190:3001/api/v1
```

## 📋 Tabla de Contenidos

- [Autenticación](#-autenticación)
- [Health Check](#-health-check)
- [Usuarios](#-usuarios)
- [Conversaciones](#-conversaciones)
- [Mensajes](#-mensajes)
- [Grupos](#-grupos)
- [WebSocket](#-websocket)
- [Códigos de Error](#-códigos-de-error)

---

## 🔐 Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT.

### Header de Autenticación

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Generar JWT (desde tu servicio de perfiles)

El JWT debe incluir:
```json
{
  "profileId": "uuid-del-usuario",
  "username": "nombre_usuario",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Secret:** Debe coincidir con `JWT_SECRET` en el archivo `.env`

---

## 💚 Health Check

### GET `/health`

Verifica que el servicio está funcionando.

**Sin autenticación**

#### Request
```bash
curl http://54.242.230.190:3001/api/v1/health
```

#### Response
```json
{
  "success": true,
  "message": "AURA Messaging Service is running",
  "timestamp": "2025-12-03T21:43:56.242Z"
}
```

---

## 👤 Usuarios

### 1. Crear Usuario (Sincronización)

**POST** `/users`

Sincroniza un usuario del servicio de perfiles con el servicio de mensajería.

**Sin autenticación** (úsalo después de crear el perfil)

#### Request Body
```json
{
  "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "username": "johndoe",
  "displayName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `profileId` | UUID | ✅ | ID del perfil en el servicio de perfiles |
| `username` | String | ✅ | Nombre de usuario (3-100 caracteres) |
| `displayName` | String | ❌ | Nombre para mostrar (máx 150 caracteres) |
| `avatarUrl` | String | ❌ | URL del avatar |

#### Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "online",
    "lastSeenAt": null,
    "createdAt": "2025-12-03T21:43:56.242Z",
    "updatedAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 2. Obtener Usuario por Profile ID

**GET** `/users/profile/:profileId`

🔒 Requiere autenticación

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/users/profile/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "status": "online",
    "lastSeenAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 3. Obtener Todos los Usuarios

**GET** `/users`

🔒 Requiere autenticación

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Número de página |
| `limit` | Number | 20 | Resultados por página (máx 100) |

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://54.242.230.190:3001/api/v1/users?page=1&limit=20"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "status": "online"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## 💬 Conversaciones

### 1. Crear Conversación

**POST** `/conversations`

Crea una conversación 1-a-1 entre dos usuarios.

🔒 Requiere autenticación

#### Request Body
```json
{
  "participantProfileId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `participantProfileId` | UUID | ✅ | Profile ID del otro participante |

#### Response
```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "participant1ProfileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "participant2ProfileId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "lastMessageId": null,
    "lastMessageAt": null,
    "participant1Status": "active",
    "participant2Status": "active",
    "unreadCount1": 0,
    "unreadCount2": 0,
    "createdAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 2. Obtener Mis Conversaciones

**GET** `/conversations`

Obtiene todas las conversaciones del usuario autenticado.

🔒 Requiere autenticación

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Número de página |
| `limit` | Number | 20 | Resultados por página |
| `status` | String | 'active' | Filtrar por estado: `active`, `archived`, `blocked` |

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://54.242.230.190:3001/api/v1/conversations?page=1&limit=20"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "otherParticipant": {
        "profileId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "username": "janedoe",
        "displayName": "Jane Doe",
        "avatarUrl": "https://example.com/jane.jpg",
        "status": "online"
      },
      "lastMessage": {
        "id": "d4e5f6a7-b8c9-0123-def0-123456789013",
        "content": "¡Hola! ¿Cómo estás?",
        "messageType": "text",
        "senderProfileId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "createdAt": "2025-12-03T21:43:56.242Z"
      },
      "unreadCount": 3,
      "status": "active",
      "lastMessageAt": "2025-12-03T21:43:56.242Z",
      "createdAt": "2025-12-01T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 3. Marcar Conversación como Leída

**PATCH** `/conversations/:id/read`

Marca todos los mensajes de una conversación como leídos.

🔒 Requiere autenticación

#### Request
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/conversations/c3d4e5f6-a7b8-9012-cdef-123456789012/read
```

#### Response
```json
{
  "success": true,
  "message": "Conversación marcada como leída",
  "data": {
    "unreadCount": 0
  }
}
```

### 4. Archivar Conversación

**PATCH** `/conversations/:id/archive`

Archiva una conversación.

🔒 Requiere autenticación

#### Request
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/conversations/c3d4e5f6-a7b8-9012-cdef-123456789012/archive
```

#### Response
```json
{
  "success": true,
  "message": "Conversación archivada",
  "data": {
    "status": "archived"
  }
}
```

---

## 📨 Mensajes

### 1. Enviar Mensaje

**POST** `/messages`

Envía un mensaje a una conversación o grupo.

🔒 Requiere autenticación

#### Request Body (Conversación)
```json
{
  "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "content": "¡Hola! ¿Cómo estás?",
  "messageType": "text"
}
```

#### Request Body (Grupo)
```json
{
  "groupId": "e5f6a7b8-c9d0-1234-ef01-234567890123",
  "content": "Hola a todos en el grupo!",
  "messageType": "text"
}
```

#### Request Body (Con Media)
```json
{
  "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "content": "Mira esta foto!",
  "messageType": "image",
  "mediaUrl": "https://example.com/photo.jpg"
}
```

#### Request Body (Responder a Mensaje)
```json
{
  "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "content": "¡Totalmente de acuerdo!",
  "messageType": "text",
  "replyToId": "d4e5f6a7-b8c9-0123-def0-123456789013"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `conversationId` | UUID | ⚠️ | ID de la conversación (requerido si no hay groupId) |
| `groupId` | UUID | ⚠️ | ID del grupo (requerido si no hay conversationId) |
| `content` | String | ✅ | Contenido del mensaje (máx 5000 caracteres) |
| `messageType` | String | ❌ | Tipo: `text`, `image`, `video`, `audio`, `file`, `system` (default: `text`) |
| `mediaUrl` | String | ❌ | URL del archivo multimedia |
| `replyToId` | UUID | ❌ | ID del mensaje al que se responde |

#### Response
```json
{
  "success": true,
  "data": {
    "id": "f6a7b8c9-d0e1-2345-f012-345678901234",
    "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "groupId": null,
    "senderProfileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "content": "¡Hola! ¿Cómo estás?",
    "messageType": "text",
    "status": "sent",
    "mediaUrl": null,
    "replyToId": null,
    "isEdited": false,
    "isDeleted": false,
    "metadata": {},
    "createdAt": "2025-12-03T21:43:56.242Z",
    "updatedAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 2. Obtener Mensajes de Conversación

**GET** `/messages/conversation/:conversationId`

Obtiene los mensajes de una conversación con paginación.

🔒 Requiere autenticación

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Número de página |
| `limit` | Number | 50 | Mensajes por página (máx 100) |
| `order` | String | 'DESC' | Orden: `ASC` (antiguos primero), `DESC` (nuevos primero) |

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://54.242.230.190:3001/api/v1/messages/conversation/c3d4e5f6-a7b8-9012-cdef-123456789012?page=1&limit=50"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "f6a7b8c9-d0e1-2345-f012-345678901234",
      "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "senderProfileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "content": "¡Hola! ¿Cómo estás?",
      "messageType": "text",
      "status": "read",
      "mediaUrl": null,
      "replyToId": null,
      "isEdited": false,
      "isDeleted": false,
      "sender": {
        "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "replyTo": null,
      "createdAt": "2025-12-03T21:43:56.242Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "pages": 5
  }
}
```

### 3. Obtener Mensajes de Grupo

**GET** `/messages/group/:groupId`

Obtiene los mensajes de un grupo con paginación.

🔒 Requiere autenticación

#### Query Parameters
Igual que mensajes de conversación.

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://54.242.230.190:3001/api/v1/messages/group/e5f6a7b8-c9d0-1234-ef01-234567890123?page=1&limit=50"
```

#### Response
Similar a mensajes de conversación.

### 4. Marcar Mensajes como Leídos

**POST** `/messages/mark-as-read`

Marca mensajes específicos como leídos.

🔒 Requiere autenticación

#### Request Body
```json
{
  "conversationId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "messageIds": [
    "f6a7b8c9-d0e1-2345-f012-345678901234",
    "a7b8c9d0-e1f2-3456-0123-456789012345"
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Mensajes marcados como leídos",
  "data": {
    "updated": 2
  }
}
```

### 5. Editar Mensaje

**PUT** `/messages/:id`

Edita un mensaje enviado.

🔒 Requiere autenticación (solo el emisor puede editar)

#### Request Body
```json
{
  "content": "Mensaje editado con nuevo contenido"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "f6a7b8c9-d0e1-2345-f012-345678901234",
    "content": "Mensaje editado con nuevo contenido",
    "isEdited": true,
    "updatedAt": "2025-12-03T22:00:00.000Z"
  }
}
```

### 6. Eliminar Mensaje

**DELETE** `/messages/:id`

Elimina un mensaje (soft delete).

🔒 Requiere autenticación (solo el emisor puede eliminar)

#### Request
```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/messages/f6a7b8c9-d0e1-2345-f012-345678901234
```

#### Response
```json
{
  "success": true,
  "message": "Mensaje eliminado",
  "data": {
    "id": "f6a7b8c9-d0e1-2345-f012-345678901234",
    "isDeleted": true
  }
}
```

---

## 👥 Grupos

### 1. Crear Grupo

**POST** `/groups`

Crea un nuevo grupo o comunidad.

🔒 Requiere autenticación

#### Request Body
```json
{
  "name": "Amantes del Café ☕",
  "description": "Grupo para compartir experiencias sobre café",
  "imageUrl": "https://example.com/cafe-group.jpg",
  "groupType": "community",
  "isPublic": true,
  "maxMembers": 100
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | String | ✅ | Nombre del grupo (2-200 caracteres) |
| `description` | String | ❌ | Descripción (máx 2000 caracteres) |
| `imageUrl` | String | ❌ | URL de la imagen del grupo |
| `groupType` | String | ❌ | Tipo: `community`, `activity`, `private` (default: `community`) |
| `isPublic` | Boolean | ❌ | Es público o privado (default: `true`) |
| `maxMembers` | Number | ❌ | Límite de miembros (mín 2) |
| `externalId` | UUID | ❌ | ID externo si se sincroniza desde otro servicio |
| `scheduledAt` | ISO8601 | ❌ | Fecha programada para actividades |
| `location` | Object | ❌ | Ubicación geográfica para actividades |

#### Request Body (Actividad con Ubicación)
```json
{
  "name": "Caminata en el Parque Central",
  "description": "Caminata grupal todos los sábados",
  "groupType": "activity",
  "isPublic": true,
  "maxMembers": 20,
  "scheduledAt": "2025-12-10T08:00:00.000Z",
  "location": {
    "lat": 40.785091,
    "lng": -73.968285,
    "address": "Central Park, New York, NY"
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "e5f6a7b8-c9d0-1234-ef01-234567890123",
    "name": "Amantes del Café ☕",
    "description": "Grupo para compartir experiencias sobre café",
    "imageUrl": "https://example.com/cafe-group.jpg",
    "groupType": "community",
    "creatorProfileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "externalId": null,
    "maxMembers": 100,
    "isPublic": true,
    "status": "active",
    "memberCount": 1,
    "lastMessageAt": null,
    "location": null,
    "scheduledAt": null,
    "createdAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 2. Sincronizar Grupo (Sin Autenticación)

**POST** `/groups/sync`

Sincroniza un grupo creado desde otro servicio.

**Sin autenticación** (para sincronización entre microservicios)

#### Request Body
```json
{
  "externalId": "g1h2i3j4-k5l6-7890-mnop-qr1234567890",
  "name": "Grupo Sincronizado",
  "description": "Grupo creado desde el servicio principal",
  "creatorProfileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "groupType": "community",
  "isPublic": true
}
```

### 3. Obtener Todos los Grupos

**GET** `/groups`

Obtiene grupos públicos con filtros opcionales.

Autenticación opcional (muestra más info si está autenticado)

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Número de página |
| `limit` | Number | 20 | Grupos por página |
| `groupType` | String | - | Filtrar por tipo: `community`, `activity`, `private` |
| `isPublic` | Boolean | - | Filtrar por públicos/privados |
| `search` | String | - | Buscar por nombre o descripción |

#### Request
```bash
curl "http://54.242.230.190:3001/api/v1/groups?groupType=community&page=1&limit=20"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "e5f6a7b8-c9d0-1234-ef01-234567890123",
      "name": "Amantes del Café ☕",
      "description": "Grupo para compartir experiencias sobre café",
      "imageUrl": "https://example.com/cafe-group.jpg",
      "groupType": "community",
      "memberCount": 45,
      "isPublic": true,
      "status": "active",
      "creator": {
        "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "username": "johndoe",
        "displayName": "John Doe"
      },
      "isMember": false,
      "createdAt": "2025-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 4. Descubrir Comunidades

**GET** `/groups/discover`

Obtiene comunidades públicas recomendadas.

Autenticación opcional

#### Request
```bash
curl "http://54.242.230.190:3001/api/v1/groups/discover?limit=10"
```

### 5. Obtener Actividades

**GET** `/groups/activities`

Obtiene actividades públicas (grupos de tipo activity).

Autenticación opcional

#### Query Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `upcoming` | Boolean | Solo actividades futuras |
| `lat` | Number | Latitud para filtrar por cercanía |
| `lng` | Number | Longitud para filtrar por cercanía |
| `radius` | Number | Radio en km (default: 10) |

#### Request
```bash
curl "http://54.242.230.190:3001/api/v1/groups/activities?upcoming=true&lat=40.785091&lng=-73.968285&radius=5"
```

### 6. Mis Comunidades

**GET** `/groups/my/communities`

Obtiene las comunidades a las que pertenece el usuario.

🔒 Requiere autenticación

#### Request
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/groups/my/communities
```

### 7. Mis Actividades

**GET** `/groups/my/activities`

Obtiene las actividades a las que pertenece el usuario.

🔒 Requiere autenticación

### 8. Unirse a Grupo

**POST** `/groups/:id/join`

Une al usuario autenticado a un grupo.

🔒 Requiere autenticación

#### Request
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/groups/e5f6a7b8-c9d0-1234-ef01-234567890123/join
```

#### Response
```json
{
  "success": true,
  "message": "Te has unido al grupo exitosamente",
  "data": {
    "groupId": "e5f6a7b8-c9d0-1234-ef01-234567890123",
    "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "role": "member",
    "joinedAt": "2025-12-03T21:43:56.242Z"
  }
}
```

### 9. Salir de Grupo

**POST** `/groups/:id/leave`

Saca al usuario autenticado de un grupo.

🔒 Requiere autenticación

#### Request
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://54.242.230.190:3001/api/v1/groups/e5f6a7b8-c9d0-1234-ef01-234567890123/leave
```

### 10. Obtener Miembros del Grupo

**GET** `/groups/:id/members`

Obtiene la lista de miembros de un grupo.

Autenticación opcional

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Número de página |
| `limit` | Number | 50 | Miembros por página |
| `role` | String | - | Filtrar por rol: `owner`, `admin`, `moderator`, `member` |

#### Request
```bash
curl "http://54.242.230.190:3001/api/v1/groups/e5f6a7b8-c9d0-1234-ef01-234567890123/members?page=1&limit=50"
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "profileId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "username": "johndoe",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "role": "owner",
      "joinedAt": "2025-12-01T10:00:00.000Z"
    },
    {
      "profileId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "username": "janedoe",
      "displayName": "Jane Doe",
      "avatarUrl": "https://example.com/jane.jpg",
      "role": "member",
      "joinedAt": "2025-12-02T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 45,
    "pages": 1
  }
}
```

---

## 🔌 WebSocket

### Conexión

```javascript
const io = require('socket.io-client');

const socket = io('http://54.242.230.190:3002', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Eventos del Cliente → Servidor

#### 1. Unirse a Conversación
```javascript
socket.emit('join_conversation', {
  conversationId: 'c3d4e5f6-a7b8-9012-cdef-123456789012'
});
```

#### 2. Salir de Conversación
```javascript
socket.emit('leave_conversation', {
  conversationId: 'c3d4e5f6-a7b8-9012-cdef-123456789012'
});
```

#### 3. Unirse a Grupo
```javascript
socket.emit('join_group', {
  groupId: 'e5f6a7b8-c9d0-1234-ef01-234567890123'
});
```

#### 4. Salir de Grupo
```javascript
socket.emit('leave_group', {
  groupId: 'e5f6a7b8-c9d0-1234-ef01-234567890123'
});
```

#### 5. Usuario Escribiendo
```javascript
socket.emit('typing_start', {
  conversationId: 'c3d4e5f6-a7b8-9012-cdef-123456789012'
  // O groupId si es un grupo
});
```

#### 6. Usuario Dejó de Escribir
```javascript
socket.emit('typing_stop', {
  conversationId: 'c3d4e5f6-a7b8-9012-cdef-123456789012'
});
```

### Eventos del Servidor → Cliente

#### 1. Nuevo Mensaje
```javascript
socket.on('new_message', (data) => {
  console.log('Nuevo mensaje:', data);
  // data = { message: {...}, conversationId: '...', groupId: '...' }
});
```

#### 2. Mensaje Actualizado
```javascript
socket.on('message_updated', (data) => {
  console.log('Mensaje editado:', data);
  // data = { messageId: '...', content: '...', isEdited: true }
});
```

#### 3. Mensaje Eliminado
```javascript
socket.on('message_deleted', (data) => {
  console.log('Mensaje eliminado:', data);
  // data = { messageId: '...', isDeleted: true }
});
```

#### 4. Usuario Escribiendo
```javascript
socket.on('user_typing', (data) => {
  console.log('Usuario escribiendo:', data);
  // data = { profileId: '...', username: '...', conversationId: '...' }
});
```

#### 5. Mensajes Leídos
```javascript
socket.on('messages_read', (data) => {
  console.log('Mensajes leídos:', data);
  // data = { messageIds: ['...'], profileId: '...' }
});
```

#### 6. Nuevo Miembro en Grupo
```javascript
socket.on('member_joined', (data) => {
  console.log('Nuevo miembro:', data);
  // data = { groupId: '...', member: {...} }
});
```

#### 7. Miembro Salió del Grupo
```javascript
socket.on('member_left', (data) => {
  console.log('Miembro salió:', data);
  // data = { groupId: '...', profileId: '...' }
});
```

### Ejemplo Completo de Cliente WebSocket

```javascript
import io from 'socket.io-client';

class MessagingService {
  constructor(token) {
    this.socket = io('http://54.242.230.190:3002', {
      auth: { token }
    });

    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Conectado a WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado de WebSocket');
    });

    this.socket.on('new_message', this.onNewMessage.bind(this));
    this.socket.on('user_typing', this.onUserTyping.bind(this));
    this.socket.on('message_updated', this.onMessageUpdated.bind(this));
    this.socket.on('message_deleted', this.onMessageDeleted.bind(this));
  }

  joinConversation(conversationId) {
    this.socket.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId) {
    this.socket.emit('leave_conversation', { conversationId });
  }

  startTyping(conversationId) {
    this.socket.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId) {
    this.socket.emit('typing_stop', { conversationId });
  }

  onNewMessage(data) {
    // Actualizar UI con nuevo mensaje
    console.log('Nuevo mensaje:', data.message);
  }

  onUserTyping(data) {
    // Mostrar indicador de "escribiendo..."
    console.log(`${data.username} está escribiendo...`);
  }

  onMessageUpdated(data) {
    // Actualizar mensaje en la UI
    console.log('Mensaje actualizado:', data);
  }

  onMessageDeleted(data) {
    // Eliminar mensaje de la UI
    console.log('Mensaje eliminado:', data.messageId);
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Uso
const messaging = new MessagingService('YOUR_JWT_TOKEN');
messaging.joinConversation('c3d4e5f6-a7b8-9012-cdef-123456789012');
```

---

## ❌ Códigos de Error

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error en los datos enviados |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - No tienes permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: conversación ya existe) |
| 422 | Unprocessable Entity - Error de validación |
| 500 | Internal Server Error - Error del servidor |

### Formato de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación en los datos enviados",
    "details": [
      {
        "field": "content",
        "message": "El contenido no puede estar vacío"
      }
    ]
  }
}
```

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Error en la validación de datos |
| `UNAUTHORIZED` | No autenticado o token inválido |
| `FORBIDDEN` | Sin permisos para esta acción |
| `NOT_FOUND` | Recurso no encontrado |
| `CONVERSATION_EXISTS` | La conversación ya existe |
| `GROUP_FULL` | El grupo alcanzó el límite de miembros |
| `ALREADY_MEMBER` | Ya eres miembro de este grupo |
| `NOT_MEMBER` | No eres miembro de este grupo |
| `INTERNAL_ERROR` | Error interno del servidor |

---

## 📝 Tipos de Datos

### User
```typescript
{
  id: string;              // UUID
  profileId: string;       // UUID
  username: string;        // 3-100 caracteres
  displayName: string;     // Máx 150 caracteres
  avatarUrl: string;       // URL
  status: 'online' | 'offline' | 'away';
  lastSeenAt: string;      // ISO 8601
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

### Conversation
```typescript
{
  id: string;                    // UUID
  participant1ProfileId: string; // UUID
  participant2ProfileId: string; // UUID
  lastMessageId: string | null;  // UUID
  lastMessageAt: string | null;  // ISO 8601
  participant1Status: 'active' | 'archived' | 'blocked';
  participant2Status: 'active' | 'archived' | 'blocked';
  unreadCount1: number;
  unreadCount2: number;
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

### Message
```typescript
{
  id: string;                    // UUID
  conversationId: string | null; // UUID
  groupId: string | null;        // UUID
  senderProfileId: string;       // UUID
  content: string;               // Máx 5000 caracteres
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl: string | null;       // URL
  replyToId: string | null;      // UUID
  isEdited: boolean;
  isDeleted: boolean;
  metadata: object;              // JSON
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

### Group
```typescript
{
  id: string;                    // UUID
  name: string;                  // 2-200 caracteres
  description: string;           // Máx 2000 caracteres
  imageUrl: string | null;       // URL
  groupType: 'community' | 'activity' | 'private';
  creatorProfileId: string;      // UUID
  externalId: string | null;     // UUID
  maxMembers: number | null;     // Mín 2
  isPublic: boolean;
  status: 'active' | 'inactive' | 'archived';
  settings: object;              // JSON
  memberCount: number;
  lastMessageAt: string | null;  // ISO 8601
  location: {
    lat: number;
    lng: number;
    address: string;
  } | null;
  scheduledAt: string | null;    // ISO 8601
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

### GroupMember
```typescript
{
  groupId: string;               // UUID
  profileId: string;             // UUID
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: string;              // ISO 8601
  isBanned: boolean;
}
```

---

## 🚀 Guía Rápida de Integración

### 1. Sincronizar Usuario al Registrarse

```javascript
// Después de crear el usuario en el servicio de perfiles
await fetch('http://54.242.230.190:3001/api/v1/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    profileId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl
  })
});
```

### 2. Iniciar Conversación

```javascript
const token = 'JWT_TOKEN_FROM_PROFILE_SERVICE';

// Crear conversación
const response = await fetch('http://54.242.230.190:3001/api/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    participantProfileId: 'OTHER_USER_PROFILE_ID'
  })
});

const { data: conversation } = await response.json();
```

### 3. Enviar Mensaje

```javascript
// Enviar mensaje
await fetch('http://54.242.230.190:3001/api/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversationId: conversation.id,
    content: 'Hola! ¿Cómo estás?',
    messageType: 'text'
  })
});
```

### 4. Conectar WebSocket y Recibir Mensajes en Tiempo Real

```javascript
import io from 'socket.io-client';

const socket = io('http://54.242.230.190:3002', {
  auth: { token }
});

// Unirse a la conversación
socket.emit('join_conversation', {
  conversationId: conversation.id
});

// Escuchar nuevos mensajes
socket.on('new_message', (data) => {
  console.log('Nuevo mensaje:', data.message);
  // Actualizar UI
});
```

---

## 🔧 Variables de Entorno Necesarias

Para integrar este servicio, asegúrate de configurar:

```env
# En tu frontend
VITE_MESSAGING_API_URL=http://54.242.230.190:3001/api/v1
VITE_MESSAGING_WS_URL=http://54.242.230.190:3002

# El JWT_SECRET debe coincidir entre servicios
JWT_SECRET=tu_secret_compartido
```

---

## 📞 Soporte

Si encuentras algún problema o necesitas ayuda:

- 📧 Email: soporte@aura.com
- 🐛 Issues: [GitHub Issues](https://github.com/wilber023/aura-messasing-service/issues)
- 📖 Documentación completa: Ver [README_PROYECTO.md](README_PROYECTO.md)

---

**Última actualización:** Diciembre 2025
**Versión:** 2.0.0 (PostgreSQL)
