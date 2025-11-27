#!/bin/bash

#############################################
# AURA Messaging Service - Deploy Script
# Para AWS EC2 (Ubuntu 22.04/24.04)
#############################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Variables de configuración
APP_NAME="aura-messaging-service"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/wilber023/aura-messasing-service.git"
BRANCH="main"
NODE_VERSION="20"
DOMAIN="api.tudominio.com"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   AURA Messaging Service - Script de Despliegue AWS EC2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

#############################################
# 1. ACTUALIZAR SISTEMA
#############################################

log_step "1. Actualizando sistema operativo"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common
log_info "Sistema actualizado correctamente"

#############################################
# 2. INSTALAR NODE.JS
#############################################

log_step "2. Instalando Node.js v$NODE_VERSION"

if command -v node &> /dev/null; then
    CURRENT_NODE=$(node -v)
    log_warn "Node.js ya está instalado: $CURRENT_NODE"
else
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
    log_info "Node.js instalado: $(node -v)"
fi

if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    log_info "PM2 instalado correctamente"
else
    log_warn "PM2 ya está instalado"
fi

#############################################
# 3. INSTALAR MYSQL
#############################################

log_step "3. Instalando MySQL Server"

if command -v mysql &> /dev/null; then
    log_warn "MySQL ya está instalado"
else
    sudo apt install -y mysql-server mysql-client
    sudo systemctl start mysql
    sudo systemctl enable mysql
    log_info "MySQL instalado correctamente"
fi

#############################################
# 4. CONFIGURAR MYSQL
#############################################

log_step "4. Configurando MySQL"

# Crear directorio socket si no existe
sudo mkdir -p /var/run/mysqld
sudo chown mysql:mysql /var/run/mysqld

# Intentar configurar MySQL
log_info "Configurando acceso a MySQL..."

# Verificar si podemos acceder con sudo
if sudo mysql -e "SELECT 1;" 2>/dev/null; then
    log_info "Acceso a MySQL con sudo disponible"
    
    # Configurar contraseña root y crear usuario
    sudo mysql << 'SQLEOF'
-- Configurar root
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'AuraRoot2024!';

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS aura_messaging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario de aplicación
CREATE USER IF NOT EXISTS 'aura_user'@'localhost' IDENTIFIED BY 'AuraMessaging2024!';
GRANT ALL PRIVILEGES ON aura_messaging.* TO 'aura_user'@'localhost';

FLUSH PRIVILEGES;
SQLEOF
    
    log_info "MySQL configurado con usuario 'aura_user'"
else
    log_warn "No se pudo acceder a MySQL con sudo. Intentando reset de contraseña..."
    
    # Detener MySQL
    sudo systemctl stop mysql
    
    # Crear directorio socket
    sudo mkdir -p /var/run/mysqld
    sudo chown mysql:mysql /var/run/mysqld
    
    # Iniciar en modo seguro
    sudo mysqld_safe --skip-grant-tables --skip-networking &
    sleep 5
    
    # Configurar
    mysql -u root << 'SQLEOF'
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'AuraRoot2024!';
FLUSH PRIVILEGES;
SQLEOF
    
    # Detener modo seguro
    sudo killall mysqld
    sleep 3
    
    # Reiniciar normal
    sudo systemctl start mysql
    sleep 3
    
    # Crear base de datos y usuario
    mysql -u root -p"AuraRoot2024!" << 'SQLEOF'
CREATE DATABASE IF NOT EXISTS aura_messaging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'aura_user'@'localhost' IDENTIFIED BY 'AuraMessaging2024!';
GRANT ALL PRIVILEGES ON aura_messaging.* TO 'aura_user'@'localhost';
FLUSH PRIVILEGES;
SQLEOF
    
    log_info "MySQL reseteado y configurado"
fi

# Verificar conexión
if mysql -u aura_user -p"AuraMessaging2024!" -e "SELECT 1;" 2>/dev/null; then
    log_info "✅ Conexión a MySQL verificada correctamente"
else
    log_error "❌ No se pudo verificar la conexión a MySQL"
    log_warn "Deberás configurar MySQL manualmente"
fi

#############################################
# 5. INSTALAR NGINX
#############################################

log_step "5. Instalando Nginx"

if command -v nginx &> /dev/null; then
    log_warn "Nginx ya está instalado"
else
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_info "Nginx instalado correctamente"
fi

#############################################
# 6. CONFIGURAR FIREWALL
#############################################

log_step "6. Configurando Firewall (UFW)"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001/tcp
sudo ufw --force enable
log_info "Firewall configurado"

#############################################
# 7. CLONAR/ACTUALIZAR REPOSITORIO
#############################################

log_step "7. Configurando aplicación"

sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

if [ -d "$APP_DIR/.git" ]; then
    log_info "Actualizando repositorio existente..."
    cd $APP_DIR
    git fetch origin
    git reset --hard origin/$BRANCH
else
    log_info "Clonando repositorio..."
    git clone -b $BRANCH $REPO_URL $APP_DIR
    cd $APP_DIR
fi

log_info "Código fuente actualizado"

#############################################
# 8. INSTALAR DEPENDENCIAS
#############################################

log_step "8. Instalando dependencias de Node.js"
cd $APP_DIR
npm install
log_info "Dependencias instaladas"

#############################################
# 9. VERIFICAR/CREAR ARCHIVO .ENV
#############################################

log_step "9. Verificando archivo .env"

if [ -f "$APP_DIR/.env" ]; then
    log_info "Archivo .env existente encontrado - NO se modificará"
    log_warn "Asegúrate de que tu .env tenga las credenciales correctas"
else
    log_warn "No se encontró archivo .env"
    log_info "Creando .env con valores por defecto..."
    
    cat > $APP_DIR/.env << 'ENVEOF'
# Servidor
NODE_ENV=development
PORT=3001

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aura_messaging
DB_USER=aura_user
DB_PASSWORD=AuraMessaging2024!

# JWT
JWT_SECRET=pezcadofrito.1
JWT_EXPIRES_IN=24h

# WebSocket
WS_CORS_ORIGIN=*

# CORS
CORS_ORIGIN=*

# Logs
LOG_LEVEL=debug
ENVEOF
    
    log_info "Archivo .env creado con valores por defecto"
fi

# Mostrar contenido actual del .env (sin contraseñas)
log_info "Configuración actual del .env:"
grep -E "^(NODE_ENV|PORT|DB_HOST|DB_NAME|DB_USER)=" $APP_DIR/.env || true

#############################################
# 10. EJECUTAR MIGRACIONES
#############################################

log_step "10. Ejecutando migraciones de base de datos"

cd $APP_DIR
export NODE_ENV=development

if npm run db:migrate; then
    log_info "✅ Migraciones ejecutadas correctamente"
else
    log_error "❌ Error en las migraciones"
    log_warn "Verifica las credenciales en tu archivo .env"
    exit 1
fi

#############################################
# 11. CONFIGURAR NGINX
#############################################

log_step "11. Configurando Nginx como reverse proxy"

sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << 'NGINXEOF'
upstream aura_messaging {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    access_log /var/log/nginx/aura-messaging_access.log;
    error_log /var/log/nginx/aura-messaging_error.log;

    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;

    location /api {
        proxy_pass http://aura_messaging;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    location /socket.io {
        proxy_pass http://aura_messaging;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    location /health {
        proxy_pass http://aura_messaging/api/v1/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location / {
        return 301 /api/v1;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
log_info "Nginx configurado"

#############################################
# 12. CONFIGURAR PM2
#############################################

log_step "12. Configurando PM2"

cat > $APP_DIR/ecosystem.config.js << PMEOF
module.exports = {
  apps: [{
    name: 'aura-messaging-service',
    script: 'src/index.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    }
  }]
};
PMEOF

sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

pm2 delete $APP_NAME 2>/dev/null || true
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER 2>/dev/null || true
pm2 save

log_info "PM2 configurado y aplicación iniciada"

#############################################
# 13. VERIFICACIÓN FINAL
#############################################

log_step "13. Verificación final"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Información:${NC}"
echo -e "  • Directorio: ${APP_DIR}"
echo -e "  • Puerto: 3001"
echo ""
echo -e "${BLUE}URLs de acceso:${NC}"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "TU_IP_PUBLICA")
echo -e "  • API: http://${PUBLIC_IP}/api/v1"
echo -e "  • Health: http://${PUBLIC_IP}/api/v1/health"
echo -e "  • WebSocket: ws://${PUBLIC_IP}/socket.io"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  • Ver logs: ${YELLOW}pm2 logs${NC}"
echo -e "  • Reiniciar: ${YELLOW}pm2 restart all${NC}"
echo -e "  • Estado: ${YELLOW}pm2 status${NC}"
echo ""
echo -e "${BLUE}Base de datos:${NC}"
echo -e "  • Usuario: aura_user"
echo -e "  • Password: AuraMessaging2024!"
echo -e "  • Database: aura_messaging"
echo ""

pm2 status
echo ""

sleep 3
log_info "Probando API..."
curl -s http://localhost:3001/api/v1/health 2>/dev/null || log_warn "API iniciando..."

echo ""
echo -e "${GREEN}🚀 AURA Messaging Service está listo${NC}"