# 📱 AURA Messaging Service - Guía de Integración Frontend

## Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints API REST](#endpoints-api-rest)
4. [WebSocket - Tiempo Real](#websocket---tiempo-real)
5. [Modelos de Datos](#modelos-de-datos)
6. [Ejemplos de Integración Flutter](#ejemplos-de-integración-flutter)
7. [Manejo de Errores](#manejo-de-errores)
8. [Buenas Prácticas](#buenas-prácticas)

---

## Información General

### URLs Base

| Entorno | URL API | URL WebSocket |
|---------|---------|---------------|
| **Desarrollo** | `http://localhost:3001/api/v1` | `ws://localhost:3001` |
| **Producción** | `https://api.tudominio.com/api/v1` | `wss://api.tudominio.com` |

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Formato de Respuesta

Todas las respuestas siguen este formato:
```json
{
  "success": true,
  "message": "Descripción de la operación",
  "data": { ... },
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## Autenticación

### Obtener Token JWT

El token JWT se obtiene del **microservicio de autenticación principal** de AURA. Este token debe incluir:
```json
{
  "id": "user-uuid",
  "profileId": "profile-uuid",  // ⚠️ IMPORTANTE: Este es el ID que usa el servicio de mensajería
  "username": "usuario",
  "email": "usuario@email.com"
}
```

### Sincronizar Usuario en Mensajería

Cuando un usuario se registra o actualiza su perfil, sincronizar con el servicio de mensajería:
```http
POST /api/v1/users
Content-Type: application/json

{
  "profileId": "uuid-del-perfil-completo",
  "username": "nombre_usuario",
  "displayName": "Nombre Visible",
  "avatarUrl": "https://url-avatar.com/imagen.jpg"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario creado",
  "data": {
    "id": "uuid",
    "profileId": "uuid",
    "username": "nombre_usuario",
    "displayName": "Nombre Visible",
    "avatarUrl": "https://...",
    "isOnline": false,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Endpoints API REST

### 👤 USERS

#### Listar usuarios
```http
GET /api/v1/users?page=1&limit=20&search=nombre&isOnline=true
Authorization: Bearer <token>
```

#### Obtener usuario por ID
```http
GET /api/v1/users/:id
Authorization: Bearer <token>
```

#### Obtener usuario por Profile ID
```http
GET /api/v1/users/profile/:profileId
Authorization: Bearer <token>
```

#### Crear usuario (sincronización)
```http
POST /api/v1/users
Content-Type: application/json

{
  "profileId": "uuid",
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string (URL)"
}
```

#### Actualizar usuario
```http
PUT /api/v1/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string"
}
```

---

### 💬 CONVERSATIONS (Chats Individuales)

#### Listar mis conversaciones
```http
GET /api/v1/conversations?page=1&limit=20
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conversation-uuid",
      "otherParticipant": {
        "id": "user-uuid",
        "profileId": "profile-uuid",
        "username": "otro_usuario",
        "displayName": "Otro Usuario",
        "avatarUrl": "https://...",
        "isOnline": true
      },
      "lastMessage": {
        "id": "message-uuid",
        "content": "Hola!",
        "messageType": "text",
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      "unreadCount": 3,
      "lastMessageAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "totalPages": 1
}
```

#### Obtener conversación específica
```http
GET /api/v1/conversations/:id
Authorization: Bearer <token>
```

#### Crear/Obtener conversación con usuario
```http
POST /api/v1/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantProfileId": "uuid-del-otro-usuario"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Conversación creada",
  "data": { ... },
  "isExisting": false  // true si ya existía
}
```

#### Archivar conversación
```http
PATCH /api/v1/conversations/:id/archive
Authorization: Bearer <token>
```

#### Marcar como leída
```http
PATCH /api/v1/conversations/:id/read
Authorization: Bearer <token>
```

---

### 📨 MESSAGES

#### Obtener mensajes de conversación
```http
GET /api/v1/messages/conversation/:conversationId?page=1&limit=50
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "message-uuid",
      "conversationId": "conversation-uuid",
      "senderProfileId": "profile-uuid",
      "content": "Hola, ¿cómo estás?",
      "messageType": "text",
      "status": "read",
      "mediaUrl": null,
      "replyToId": null,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "sender": {
        "id": "user-uuid",
        "profileId": "profile-uuid",
        "username": "usuario",
        "displayName": "Usuario",
        "avatarUrl": "https://..."
      }
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 2
}
```

#### Obtener mensajes de grupo
```http
GET /api/v1/messages/group/:groupId?page=1&limit=50
Authorization: Bearer <token>
```

#### Enviar mensaje
```http
POST /api/v1/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "uuid",     // Para chat individual
  // O
  "groupId": "uuid",            // Para grupo/comunidad
  
  "content": "Texto del mensaje",
  "messageType": "text",        // text, image, video, audio, file
  "mediaUrl": "https://...",    // Opcional, para multimedia
  "replyToId": "uuid"           // Opcional, para responder a otro mensaje
}
```

#### Editar mensaje
```http
PUT /api/v1/messages/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Mensaje editado"
}
```

#### Eliminar mensaje
```http
DELETE /api/v1/messages/:id
Authorization: Bearer <token>
```

---

### 👥 GROUPS (Comunidades y Actividades)

#### Listar todos los grupos públicos
```http
GET /api/v1/groups?page=1&limit=20&groupType=community&search=texto
Authorization: Bearer <token> (opcional)
```

#### Mis comunidades
```http
GET /api/v1/groups/my/communities?page=1&limit=20
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid",
      "name": "Apoyo Mutuo",
      "groupType": "community",
      "imageUrl": "https://...",
      "memberCount": 150,
      "lastMessageAt": "2024-01-01T12:00:00.000Z",
      "myRole": "member",
      "unreadCount": 5
    }
  ]
}
```

#### Descubrir comunidades
```http
GET /api/v1/groups/discover?page=1&limit=20&search=meditacion
Authorization: Bearer <token> (opcional)
```

#### Actividades cerca de ti
```http
GET /api/v1/groups/activities?page=1&limit=20&upcoming=true
Authorization: Bearer <token> (opcional)
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid",
      "name": "Caminata al Aire Libre",
      "description": "Actividad grupal...",
      "groupType": "activity",
      "imageUrl": "https://...",
      "memberCount": 15,
      "maxMembers": 20,
      "location": {
        "lat": 16.7569,
        "lng": -93.1292,
        "address": "Parque Central, Tuxtla"
      },
      "scheduledAt": "2024-02-01T09:00:00.000Z"
    }
  ]
}
```

#### Mis actividades
```http
GET /api/v1/groups/my/activities
Authorization: Bearer <token>
```

#### Obtener grupo específico
```http
GET /api/v1/groups/:id
Authorization: Bearer <token> (opcional)
```

**Respuesta incluye:**
```json
{
  "data": {
    "id": "...",
    "name": "...",
    "isMember": true,      // Si el usuario es miembro
    "myRole": "member",    // owner, admin, moderator, member
    "unreadCount": 5
  }
}
```

#### Crear grupo
```http
POST /api/v1/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nombre del Grupo",
  "description": "Descripción...",
  "imageUrl": "https://...",
  "groupType": "community",      // community, activity, private
  "maxMembers": 100,             // null = sin límite
  "isPublic": true,
  "location": {                  // Solo para actividades
    "lat": 16.7569,
    "lng": -93.1292,
    "address": "Dirección"
  },
  "scheduledAt": "2024-02-01T09:00:00.000Z"  // Solo para actividades
}
```

#### Actualizar grupo
```http
PUT /api/v1/groups/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nuevo nombre",
  "description": "Nueva descripción"
}
```

#### Eliminar grupo (solo owner)
```http
DELETE /api/v1/groups/:id
Authorization: Bearer <token>
```

#### Unirse a grupo
```http
POST /api/v1/groups/:id/join
Authorization: Bearer <token>
```

#### Salir del grupo
```http
POST /api/v1/groups/:id/leave
Authorization: Bearer <token>
```

#### Obtener miembros del grupo
```http
GET /api/v1/groups/:id/members?page=1&limit=50
Authorization: Bearer <token> (opcional)
```

---

### 👥 GROUP MEMBERS

#### Listar miembros
```http
GET /api/v1/group-members?groupId=uuid&page=1&limit=50
Authorization: Bearer <token>
```

#### Agregar miembro (admin)
```http
POST /api/v1/group-members
Authorization: Bearer <token>
Content-Type: application/json

{
  "groupId": "uuid",
  "profileId": "uuid",
  "role": "member",        // member, moderator, admin
  "nickname": "Apodo"      // Opcional
}
```

#### Actualizar miembro
```http
PUT /api/v1/group-members/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "moderator",
  "nickname": "Nuevo apodo"
}
```

#### Promover miembro
```http
PATCH /api/v1/group-members/:id/promote
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "moderator"   // moderator o admin
}
```

#### Banear miembro
```http
PATCH /api/v1/group-members/:id/ban
Authorization: Bearer <token>
```

#### Eliminar/Expulsar miembro
```http
DELETE /api/v1/group-members/:id
Authorization: Bearer <token>
```

---

## WebSocket - Tiempo Real

### Conexión
```dart
// Flutter - usando socket_io_client
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://api.tudominio.com',
  IO.OptionBuilder()
    .setTransports(['websocket'])
    .setAuth({'token': 'JWT_TOKEN_AQUI'})
    .build(),
);

socket.onConnect((_) {
  print('Conectado al WebSocket');
});

socket.onDisconnect((_) {
  print('Desconectado del WebSocket');
});

socket.onError((error) {
  print('Error WebSocket: $error');
});
```

### Eventos del Cliente → Servidor

#### Unirse a sala de conversación
```dart
socket.emit('join_conversation', conversationId);
```

#### Salir de sala de conversación
```dart
socket.emit('leave_conversation', conversationId);
```

#### Unirse a sala de grupo
```dart
socket.emit('join_group', groupId);
```

#### Salir de sala de grupo
```dart
socket.emit('leave_group', groupId);
```

#### Indicar que está escribiendo
```dart
// Para conversación
socket.emit('typing_start', {'conversationId': conversationId});

// Para grupo
socket.emit('typing_start', {'groupId': groupId});
```

#### Indicar que dejó de escribir
```dart
socket.emit('typing_stop', {'conversationId': conversationId});
// o
socket.emit('typing_stop', {'groupId': groupId});
```

### Eventos del Servidor → Cliente

#### Nuevo mensaje
```dart
socket.on('new_message', (data) {
  // data contiene el mensaje completo
  print('Nuevo mensaje: ${data['content']}');
});
```

#### Mensaje actualizado
```dart
socket.on('message_updated', (data) {
  // data contiene el mensaje actualizado
});
```

#### Mensaje eliminado
```dart
socket.on('message_deleted', (data) {
  // data: { messageId: 'uuid' }
});
```

#### Usuario escribiendo
```dart
socket.on('user_typing', (data) {
  // data: { profileId: 'uuid', isTyping: true/false }
  if (data['isTyping']) {
    print('Usuario ${data['profileId']} está escribiendo...');
  }
});
```

#### Mensajes leídos
```dart
socket.on('messages_read', (data) {
  // data: { profileId: 'uuid', messageIds: ['uuid1', 'uuid2'] }
});
```

#### Miembro se unió al grupo
```dart
socket.on('member_joined', (data) {
  // data contiene info del nuevo miembro
});
```

#### Miembro salió del grupo
```dart
socket.on('member_left', (data) {
  // data: { profileId: 'uuid' }
});
```

---

## Modelos de Datos

### User
```dart
class User {
  final String id;
  final String profileId;
  final String username;
  final String? displayName;
  final String? avatarUrl;
  final bool isOnline;
  final DateTime? lastSeenAt;
  final bool isActive;
  final DateTime createdAt;
  
  // Constructor y fromJson...
}
```

### Message
```dart
class Message {
  final String id;
  final String? conversationId;
  final String? groupId;
  final String senderProfileId;
  final String content;
  final String messageType; // text, image, video, audio, file, system
  final String status;      // sent, delivered, read, failed
  final String? mediaUrl;
  final String? replyToId;
  final bool isEdited;
  final bool isDeleted;
  final DateTime createdAt;
  final User? sender;
  
  // Constructor y fromJson...
}
```

### Conversation
```dart
class Conversation {
  final String id;
  final User otherParticipant;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime? lastMessageAt;
  final DateTime createdAt;
  
  // Constructor y fromJson...
}
```

### Group
```dart
class Group {
  final String id;
  final String name;
  final String? description;
  final String? imageUrl;
  final String groupType; // community, activity, private
  final String creatorProfileId;
  final int? maxMembers;
  final bool isPublic;
  final int memberCount;
  final DateTime? lastMessageAt;
  final Map<String, dynamic>? location;
  final DateTime? scheduledAt;
  final bool? isMember;
  final String? myRole;
  final int? unreadCount;
  
  // Constructor y fromJson...
}
```

### GroupMember
```dart
class GroupMember {
  final String id;
  final String groupId;
  final String profileId;
  final String role;   // owner, admin, moderator, member
  final String status; // active, muted, banned, left, pending
  final String? nickname;
  final int unreadCount;
  final DateTime joinedAt;
  final User? user;
  
  // Constructor y fromJson...
}
```

---

## Ejemplos de Integración Flutter

### Service de API Base
```dart
// lib/core/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'https://api.tudominio.com/api/v1';
  String? _token;

  void setToken(String token) {
    _token = token;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  Future<Map<String, dynamic>> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> put(String endpoint, Map<String, dynamic> body) async {
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
    );
    return _handleResponse(response);
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    
    throw ApiException(
      statusCode: response.statusCode,
      message: data['message'] ?? 'Error desconocido',
      code: data['code'],
    );
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? code;

  ApiException({required this.statusCode, required this.message, this.code});

  @override
  String toString() => 'ApiException: $message (code: $code, status: $statusCode)';
}
```

### Repository de Mensajes
```dart
// lib/features/messaging/data/repositories/message_repository.dart

import '../models/message_model.dart';
import '../../core/services/api_service.dart';

class MessageRepository {
  final ApiService _api;

  MessageRepository(this._api);

  Future<List<Message>> getConversationMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _api.get(
      '/messages/conversation/$conversationId?page=$page&limit=$limit',
    );
    
    final List<dynamic> data = response['data'];
    return data.map((json) => Message.fromJson(json)).toList();
  }

  Future<List<Message>> getGroupMessages(
    String groupId, {
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _api.get(
      '/messages/group/$groupId?page=$page&limit=$limit',
    );
    
    final List<dynamic> data = response['data'];
    return data.map((json) => Message.fromJson(json)).toList();
  }

  Future<Message> sendMessage({
    String? conversationId,
    String? groupId,
    required String content,
    String messageType = 'text',
    String? mediaUrl,
    String? replyToId,
  }) async {
    final body = <String, dynamic>{
      'content': content,
      'messageType': messageType,
    };

    if (conversationId != null) body['conversationId'] = conversationId;
    if (groupId != null) body['groupId'] = groupId;
    if (mediaUrl != null) body['mediaUrl'] = mediaUrl;
    if (replyToId != null) body['replyToId'] = replyToId;

    final response = await _api.post('/messages', body);
    return Message.fromJson(response['data']);
  }

  Future<Message> editMessage(String messageId, String content) async {
    final response = await _api.put('/messages/$messageId', {
      'content': content,
    });
    return Message.fromJson(response['data']);
  }

  Future<void> deleteMessage(String messageId) async {
    await _api.delete('/messages/$messageId');
  }
}
```

### Provider de Chat
```dart
// lib/features/messaging/presentation/providers/chat_provider.dart

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../data/repositories/message_repository.dart';
import '../../data/models/message_model.dart';

class ChatProvider extends ChangeNotifier {
  final MessageRepository _repository;
  IO.Socket? _socket;
  
  List<Message> _messages = [];
  bool _isLoading = false;
  String? _error;
  bool _isTyping = false;
  String? _typingUser;

  List<Message> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isTyping => _isTyping;
  String? get typingUser => _typingUser;

  ChatProvider(this._repository);

  void initSocket(String token, String baseUrl) {
    _socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('WebSocket conectado');
    });

    _socket!.on('new_message', (data) {
      final message = Message.fromJson(data);
      _messages.insert(0, message);
      notifyListeners();
    });

    _socket!.on('message_updated', (data) {
      final updatedMessage = Message.fromJson(data);
      final index = _messages.indexWhere((m) => m.id == updatedMessage.id);
      if (index != -1) {
        _messages[index] = updatedMessage;
        notifyListeners();
      }
    });

    _socket!.on('message_deleted', (data) {
      _messages.removeWhere((m) => m.id == data['messageId']);
      notifyListeners();
    });

    _socket!.on('user_typing', (data) {
      _isTyping = data['isTyping'];
      _typingUser = data['profileId'];
      notifyListeners();
    });
  }

  void joinConversation(String conversationId) {
    _socket?.emit('join_conversation', conversationId);
  }

  void leaveConversation(String conversationId) {
    _socket?.emit('leave_conversation', conversationId);
  }

  void joinGroup(String groupId) {
    _socket?.emit('join_group', groupId);
  }

  void leaveGroup(String groupId) {
    _socket?.emit('leave_group', groupId);
  }

  void startTyping({String? conversationId, String? groupId}) {
    _socket?.emit('typing_start', {
      if (conversationId != null) 'conversationId': conversationId,
      if (groupId != null) 'groupId': groupId,
    });
  }

  void stopTyping({String? conversationId, String? groupId}) {
    _socket?.emit('typing_stop', {
      if (conversationId != null) 'conversationId': conversationId,
      if (groupId != null) 'groupId': groupId,
    });
  }

  Future<void> loadConversationMessages(String conversationId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _messages = await _repository.getConversationMessages(conversationId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadGroupMessages(String groupId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _messages = await _repository.getGroupMessages(groupId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage({
    String? conversationId,
    String? groupId,
    required String content,
    String? mediaUrl,
    String? replyToId,
  }) async {
    try {
      await _repository.sendMessage(
        conversationId: conversationId,
        groupId: groupId,
        content: content,
        mediaUrl: mediaUrl,
        replyToId: replyToId,
      );
      // El mensaje llegará por WebSocket
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void dispose() {
    _socket?.dispose();
    super.dispose();
  }
}
```

---

## Manejo de Errores

### Códigos de Error Comunes

| Código HTTP | Código Error | Descripción |
|-------------|--------------|-------------|
| 400 | `VALIDATION_ERROR` | Error de validación de datos |
| 400 | `INVALID_TARGET` | Debe especificar conversationId o groupId |
| 400 | `ALREADY_MEMBER` | Ya eres miembro del grupo |
| 400 | `GROUP_FULL` | El grupo está lleno |
| 401 | `NO_TOKEN` | Token no proporcionado |
| 401 | `TOKEN_EXPIRED` | Token expirado |
| 401 | `INVALID_TOKEN` | Token inválido |
| 403 | `ACCESS_DENIED` | Sin acceso a este recurso |
| 403 | `NOT_A_MEMBER` | No eres miembro del grupo |
| 403 | `NOT_AUTHORIZED` | Sin permisos para esta acción |
| 403 | `NOT_OWNER` | Solo el owner puede hacer esto |
| 403 | `PRIVATE_GROUP` | El grupo es privado |
| 404 | `USER_NOT_FOUND` | Usuario no encontrado |
| 404 | `MESSAGE_NOT_FOUND` | Mensaje no encontrado |
| 404 | `CONVERSATION_NOT_FOUND` | Conversación no encontrada |
| 404 | `GROUP_NOT_FOUND` | Grupo no encontrado |
| 409 | `USER_EXISTS` | El usuario ya existe |
| 409 | `DUPLICATE_ENTRY` | Registro duplicado |
| 500 | `INTERNAL_ERROR` | Error interno del servidor |

### Ejemplo de Manejo en Flutter
```dart
try {
  final response = await api.post('/messages', body);
  // Éxito
} on ApiException catch (e) {
  switch (e.code) {
    case 'TOKEN_EXPIRED':
      // Redirigir a login
      break;
    case 'NOT_A_MEMBER':
      // Mostrar mensaje de que no es miembro
      break;
    case 'GROUP_FULL':
      // Mostrar que el grupo está lleno
      break;
    default:
      // Mostrar error genérico
      showError(e.message);
  }
}
```

---

## Buenas Prácticas

### 1. Paginación
Siempre usar paginación para listas:
```dart
// Cargar más mensajes al hacer scroll
Future<void> loadMoreMessages() async {
  if (_isLoadingMore || _hasReachedEnd) return;
  
  _currentPage++;
  final newMessages = await repository.getMessages(page: _currentPage);
  
  if (newMessages.isEmpty) {
    _hasReachedEnd = true;
  } else {
    _messages.addAll(newMessages);
  }
}
```

### 2. WebSocket - Reconexión
Implementar lógica de reconexión:
```dart
socket.onDisconnect((_) {
  Future.delayed(Duration(seconds: 3), () {
    if (!socket.connected) {
      socket.connect();
    }
  });
});
```

### 3. Optimistic Updates
Para mejor UX, mostrar mensaje antes de confirmación:
```dart
Future<void> sendMessage(String content) async {
  // Crear mensaje temporal
  final tempMessage = Message(
    id: 'temp-${DateTime.now().millisecondsSinceEpoch}',
    content: content,
    status: 'sending',
    // ...
  );
  
  // Agregar a la lista inmediatamente
  _messages.insert(0, tempMessage);
  notifyListeners();
  
  try {
    final realMessage = await repository.sendMessage(content: content);
    // Reemplazar temporal con real
    final index = _messages.indexWhere((m) => m.id == tempMessage.id);
    _messages[index] = realMessage;
  } catch (e) {
    // Marcar como fallido
    tempMessage.status = 'failed';
  }
  notifyListeners();
}
```

### 4. Caché Local
Guardar mensajes localmente para acceso offline:
```dart
// Usar Hive o SQLite para caché local
await localDb.saveMessages(conversationId, messages);

// Cargar primero de caché, luego actualizar
_messages = await localDb.getMessages(conversationId);
notifyListeners();

// Actualizar desde servidor
final serverMessages = await repository.getMessages(conversationId);
_messages = serverMessages;
await localDb.saveMessages(conversationId, serverMessages);
notifyListeners();
```

### 5. Debounce para Typing
Evitar muchas emisiones de "typing":
```dart
Timer? _typingTimer;

void onTextChanged(String text) {
  if (_typingTimer?.isActive ?? false) {
    _typingTimer!.cancel();
  } else {
    socket.emit('typing_start', {...});
  }
  
  _typingTimer = Timer(Duration(seconds: 2), () {
    socket.emit('typing_stop', {...});
  });
}
```

---

## Contacto y Soporte

- **API Health Check:** `GET /api/v1/health`
- **Documentación API:** `GET /api/v1`

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de backend.

---

**Versión:** 1.0.0  
**Última actualización:** Noviembre 2024  
**Autor:** Innovación W.E.L.