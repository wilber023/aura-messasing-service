#!/bin/bash

#############################################
# AURA Messaging Service - Deploy Script
# Para AWS EC2 (Ubuntu 22.04/24.04)
#############################################

set -e  # Salir si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
APP_NAME="aura-messaging-service"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/tu-usuario/aura-messaging-service.git"  # Cambiar por tu repo
BRANCH="main"
NODE_VERSION="20"
MYSQL_ROOT_PASSWORD="AuraRoot2024!"  # Cambiar en producción
DB_NAME="aura_messaging"
DB_USER="aura_user"
DB_PASSWORD="AuraMessaging2024!"  # Cambiar en producción
DOMAIN="api.tudominio.com"  # Cambiar por tu dominio

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   AURA Messaging Service - Script de Despliegue AWS EC2${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

#############################################
# FUNCIONES AUXILIARES
#############################################

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

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

# Verificar si Node ya está instalado
if command -v node &> /dev/null; then
    CURRENT_NODE=$(node -v)
    log_warn "Node.js ya está instalado: $CURRENT_NODE"
else
    # Instalar Node.js usando NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt install -y nodejs
    
    log_info "Node.js instalado: $(node -v)"
    log_info "npm instalado: $(npm -v)"
fi

# Instalar PM2 globalmente
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

# Verificar si MySQL ya está instalado
if command -v mysql &> /dev/null; then
    log_warn "MySQL ya está instalado"
else
    # Instalar MySQL
    sudo apt install -y mysql-server mysql-client
    
    # Iniciar y habilitar MySQL
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    log_info "MySQL instalado correctamente"
fi

# Configurar MySQL
log_info "Configurando MySQL..."

sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';" 2>/dev/null || true

# Crear base de datos y usuario
sudo mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

log_info "Base de datos '${DB_NAME}' y usuario '${DB_USER}' creados"

#############################################
# 4. INSTALAR NGINX
#############################################

log_step "4. Instalando Nginx"

if command -v nginx &> /dev/null; then
    log_warn "Nginx ya está instalado"
else
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    log_info "Nginx instalado correctamente"
fi

#############################################
# 5. CONFIGURAR FIREWALL
#############################################

log_step "5. Configurando Firewall (UFW)"

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 3001/tcp  # Puerto de la API
sudo ufw --force enable

log_info "Firewall configurado"

#############################################
# 6. CLONAR/ACTUALIZAR REPOSITORIO
#############################################

log_step "6. Configurando aplicación"

# Crear directorio de la aplicación
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clonar o actualizar repositorio
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
# 7. INSTALAR DEPENDENCIAS
#############################################

log_step "7. Instalando dependencias de Node.js"

cd $APP_DIR
npm install --production

log_info "Dependencias instaladas"

#############################################
# 8. CONFIGURAR VARIABLES DE ENTORNO
#############################################

log_step "8. Configurando variables de entorno"

# Generar JWT_SECRET aleatorio
JWT_SECRET=$(openssl rand -base64 32)

# Crear archivo .env
cat > $APP_DIR/.env <<EOF
# ====================================
# AURA MESSAGING SERVICE - PRODUCTION
# ====================================

# Servidor
NODE_ENV=production
PORT=3001

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# WebSocket
WS_CORS_ORIGIN=https://${DOMAIN}

# CORS
CORS_ORIGIN=https://${DOMAIN}

# Logs
LOG_LEVEL=info
EOF

log_info "Archivo .env creado"

#############################################
# 9. EJECUTAR MIGRACIONES
#############################################

log_step "9. Ejecutando migraciones de base de datos"

cd $APP_DIR
npm run db:migrate

log_info "Migraciones ejecutadas"

# Preguntar si ejecutar seeds
read -p "¿Deseas cargar datos de prueba (seeds)? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    log_info "Seeds ejecutados"
fi

#############################################
# 10. CONFIGURAR NGINX
#############################################

log_step "10. Configurando Nginx como reverse proxy"

sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
# AURA Messaging Service - Nginx Configuration

upstream aura_messaging {
    server 127.0.0.1:3001;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Logs
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;

    # Tamaño máximo de upload
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/json;

    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API REST
    location /api {
        proxy_pass http://aura_messaging;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://aura_messaging;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://aura_messaging/api/v1/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }

    # Root
    location / {
        return 301 /api/v1;
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

log_info "Nginx configurado como reverse proxy"

#############################################
# 11. CONFIGURAR PM2
#############################################

log_step "11. Configurando PM2 para gestión de procesos"

# Crear archivo de configuración de PM2
cat > $APP_DIR/ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'src/index.js',
    cwd: '${APP_DIR}',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/${APP_NAME}-error.log',
    out_file: '/var/log/pm2/${APP_NAME}-out.log',
    log_file: '/var/log/pm2/${APP_NAME}-combined.log',
    time: true
  }]
};
EOF

# Crear directorio de logs de PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Detener instancia anterior si existe
pm2 delete $APP_NAME 2>/dev/null || true

# Iniciar aplicación con PM2
cd $APP_DIR
pm2 start ecosystem.config.js --env production

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciar con el sistema
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

log_info "PM2 configurado y aplicación iniciada"

#############################################
# 12. CONFIGURAR SSL (OPCIONAL)
#############################################

log_step "12. Configuración SSL con Let's Encrypt"

read -p "¿Deseas configurar SSL con Let's Encrypt? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Instalar Certbot
    sudo apt install -y certbot python3-certbot-nginx
    
    # Obtener certificado
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Configurar renovación automática
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    log_info "SSL configurado correctamente"
else
    log_warn "SSL no configurado. Recuerda configurarlo manualmente para producción."
fi

#############################################
# 13. VERIFICACIÓN FINAL
#############################################

log_step "13. Verificación final"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ DESPLIEGUE COMPLETADO EXITOSAMENTE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Información del despliegue:${NC}"
echo -e "  • Aplicación: ${APP_NAME}"
echo -e "  • Directorio: ${APP_DIR}"
echo -e "  • Puerto interno: 3001"
echo -e "  • Dominio: ${DOMAIN}"
echo ""
echo -e "${BLUE}URLs de acceso:${NC}"
echo -e "  • API: http://${DOMAIN}/api/v1"
echo -e "  • Health: http://${DOMAIN}/api/v1/health"
echo -e "  • WebSocket: ws://${DOMAIN}/socket.io"
echo ""
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  • Ver logs: ${YELLOW}pm2 logs ${APP_NAME}${NC}"
echo -e "  • Reiniciar: ${YELLOW}pm2 restart ${APP_NAME}${NC}"
echo -e "  • Detener: ${YELLOW}pm2 stop ${APP_NAME}${NC}"
echo -e "  • Estado: ${YELLOW}pm2 status${NC}"
echo -e "  • Monitorear: ${YELLOW}pm2 monit${NC}"
echo ""
echo -e "${BLUE}Base de datos:${NC}"
echo -e "  • Host: localhost"
echo -e "  • Database: ${DB_NAME}"
echo -e "  • Usuario: ${DB_USER}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Cambia las contraseñas en producción${NC}"
echo ""

# Verificar estado de servicios
log_info "Estado de servicios:"
echo ""
systemctl status nginx --no-pager -l | head -5
echo ""
pm2 status
echo ""

# Test de la API
log_info "Probando API..."
sleep 3
curl -s http://localhost:3001/api/v1/health | head -20 || log_warn "API aún iniciando..."

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   🚀 AURA Messaging Service está listo${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"