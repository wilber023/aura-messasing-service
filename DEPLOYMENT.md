# 🚀 Guía de Despliegue - AURA Messaging Service

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Requisitos Previos](#requisitos-previos)
- [Despliegue con Docker (Recomendado)](#despliegue-con-docker-recomendado)
- [Despliegue en AWS EC2](#despliegue-en-aws-ec2)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Comandos Útiles](#comandos-útiles)
- [Solución de Problemas](#solución-de-problemas)

---

## 🎯 Descripción General

Este microservicio de mensajería utiliza:

- **Node.js 20**: Runtime de JavaScript
- **PostgreSQL 16**: Base de datos relacional
- **Docker & Docker Compose**: Containerización
- **Sequelize**: ORM para PostgreSQL

---

## ⚙️ Requisitos Previos

### Para Despliegue Local con Docker

- Docker 20.10+
- Docker Compose 2.0+

### Para Despliegue en EC2

- Instancia EC2 (Amazon Linux 2 o Ubuntu 22.04/24.04)
- Acceso SSH a la instancia
- Puertos abiertos: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API), 5432 (PostgreSQL)

---

## 🐳 Despliegue con Docker (Recomendado)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/wilber023/aura-messasing-service.git
cd aura-messaging-service
```

### 2. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus configuraciones
nano .env
```

**Variables críticas a configurar:**

```env
NODE_ENV=production
DB_PASSWORD=TuPasswordSeguraAqui
JWT_SECRET=GeneraUnSecretoSeguroAqui
JWT_REFRESH_SECRET=GeneraOtroSecretoSeguroAqui
```

### 3. Levantar los Contenedores

```bash
# Construir y levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 4. Ejecutar Migraciones

```bash
# Ejecutar migraciones de base de datos
docker-compose exec app npm run db:migrate

# (Opcional) Ejecutar seeders
docker-compose exec app npm run db:seed
```

### 5. Verificar el Despliegue

```bash
# Verificar que los contenedores estén corriendo
docker-compose ps

# Probar el endpoint de health
curl http://localhost:3001/api/v1/health
```

**Respuesta esperada:**

```json
{
  "status": "ok",
  "timestamp": "2024-11-01T12:00:00.000Z"
}
```

---

## ☁️ Despliegue en AWS EC2

### Opción 1: Script Automatizado (Recomendado)

El script `deploy.sh` automatiza completamente el proceso de despliegue.

```bash
# 1. Conectarse a la instancia EC2
ssh -i tu-key.pem ubuntu@tu-ip-publica

# 2. Descargar y ejecutar el script
curl -O https://raw.githubusercontent.com/wilber023/aura-messasing-service/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

**El script realiza automáticamente:**

- ✅ Detecta el sistema operativo (Ubuntu/Amazon Linux/CentOS)
- ✅ Actualiza el sistema
- ✅ Instala Docker y Docker Compose
- ✅ Configura el firewall
- ✅ Clona el repositorio
- ✅ Crea archivo `.env` con secretos generados automáticamente
- ✅ Construye y levanta los contenedores
- ✅ Ejecuta las migraciones
- ✅ Configura restart policies
- ✅ Verifica la instalación

### Opción 2: Despliegue Manual

#### 1. Conectarse a la Instancia

```bash
ssh -i tu-key.pem ubuntu@tu-ip-publica
```

#### 2. Instalar Docker

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Amazon Linux 2
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
```

#### 3. Clonar y Configurar

```bash
sudo mkdir -p /var/www/aura-messaging-service
sudo chown -R $USER:$USER /var/www/aura-messaging-service
cd /var/www/aura-messaging-service

git clone https://github.com/wilber023/aura-messasing-service.git .
cp .env.example .env
nano .env  # Editar configuraciones
```

#### 4. Levantar Servicios

```bash
docker-compose up -d
docker-compose exec app npm run db:migrate
```

---

## 🔧 Configuración de Variables de Entorno

### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto de la API | `3001` |
| `DB_HOST` | Host de PostgreSQL | `postgres` (Docker) / `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `aura_messaging` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `TuPasswordSegura` |
| `JWT_SECRET` | Secreto para JWT | Generar con `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | Generar con `openssl rand -base64 32` |

### Variables Opcionales

| Variable | Descripción | Default |
|----------|-------------|---------|
| `WS_PORT` | Puerto WebSocket | `3002` |
| `LOG_LEVEL` | Nivel de logs | `info` |
| `RATE_LIMIT_MAX_REQUESTS` | Límite de requests | `100` |

---

## 🛠 Comandos Útiles

### Docker Compose

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Ver logs solo de PostgreSQL
docker-compose logs -f postgres

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Elimina datos)
docker-compose down -v

# Ver estado de contenedores
docker-compose ps

# Ejecutar comando en el contenedor de la app
docker-compose exec app sh

# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d aura_messaging
```

### Migraciones y Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec app npm run db:migrate

# Revertir última migración
docker-compose exec app npm run db:migrate:undo

# Revertir todas las migraciones
docker-compose exec app npm run db:migrate:undo:all

# Ejecutar seeders
docker-compose exec app npm run db:seed

# Reset completo de base de datos
docker-compose exec app npm run db:reset
```

### Mantenimiento

```bash
# Ver uso de recursos
docker stats

# Limpiar recursos no utilizados
docker system prune -a

# Ver espacio usado por Docker
docker system df

# Backup de PostgreSQL
docker-compose exec postgres pg_dump -U postgres aura_messaging > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres aura_messaging < backup.sql
```

---

## 🐛 Solución de Problemas

### Problema: Contenedores no inician

```bash
# Ver logs de error
docker-compose logs

# Verificar que los puertos no estén ocupados
sudo netstat -tulpn | grep -E '3001|5432'

# Reconstruir desde cero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problema: Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar conectividad
docker-compose exec postgres pg_isready -U postgres

# Acceder manualmente
docker-compose exec postgres psql -U postgres -d aura_messaging
```

### Problema: Migraciones fallan

```bash
# Ver el estado de las migraciones
docker-compose exec app npx sequelize-cli db:migrate:status

# Reintentar migraciones
docker-compose exec app npm run db:migrate

# Si persiste, resetear base de datos (¡CUIDADO!)
docker-compose exec app npm run db:migrate:undo:all
docker-compose exec app npm run db:migrate
```

### Problema: Puerto 3001 o 5432 ocupado

```bash
# Encontrar el proceso que usa el puerto
sudo lsof -i :3001
sudo lsof -i :5432

# Matar el proceso (reemplaza PID con el ID del proceso)
sudo kill -9 PID

# O cambiar el puerto en .env
```

### Problema: Permiso denegado en Docker

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar
exit
# Volver a conectar por SSH
```

### Logs en Producción

```bash
# Ver logs de la aplicación en tiempo real
docker-compose logs -f app

# Ver últimas 100 líneas
docker-compose logs --tail=100 app

# Buscar errores
docker-compose logs app | grep ERROR
```

---

## 📊 Monitoreo

### Health Check

El servicio expone un endpoint de health:

```bash
curl http://localhost:3001/api/v1/health
```

### Verificar Base de Datos

```bash
# Verificar conexión
docker-compose exec postgres pg_isready -U postgres

# Ver bases de datos
docker-compose exec postgres psql -U postgres -c "\l"

# Ver tablas
docker-compose exec postgres psql -U postgres -d aura_messaging -c "\dt"
```

---

## 🔒 Seguridad

### Recomendaciones para Producción

1. **Cambiar contraseñas por defecto**
   ```bash
   # Generar contraseñas seguras
   openssl rand -base64 32
   ```

2. **Configurar SSL/TLS**
   - Usar un reverse proxy (Nginx/Traefik)
   - Certificados Let's Encrypt

3. **Limitar acceso a PostgreSQL**
   - Solo permitir conexiones desde localhost o red privada
   - En `docker-compose.yml`, eliminar el puerto público de PostgreSQL

4. **Configurar firewall**
   ```bash
   # Permitir solo puertos necesarios
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

5. **Backups regulares**
   ```bash
   # Crear script de backup automático
   0 2 * * * docker-compose -f /var/www/aura-messaging-service/docker-compose.yml exec -T postgres pg_dump -U postgres aura_messaging > /backups/aura_$(date +\%Y\%m\%d).sql
   ```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs -f`
2. Verifica las variables de entorno en `.env`
3. Consulta la documentación de Sequelize para PostgreSQL
4. Reporta issues en el repositorio de GitHub

---

**Última actualización:** 2024-11-01
**Versión:** 2.0.0 (PostgreSQL)
