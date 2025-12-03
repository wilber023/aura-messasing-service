#!/bin/bash

#############################################
# AURA Messaging Service - Deploy Script
# Para AWS EC2 (Amazon Linux 2 / Ubuntu)
# Con Docker + PostgreSQL
#############################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variables de configuración
APP_NAME="aura-messaging-service"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/wilber023/aura-messasing-service.git"
BRANCH="main"
DOMAIN="api.tudominio.com"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   🚀 AURA Messaging Service - Script de Despliegue Automático${NC}"
echo -e "${CYAN}   📦 Stack: Docker + PostgreSQL + Node.js${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

#############################################
# 1. DETECTAR SISTEMA OPERATIVO
#############################################

log_step "1. Detectando sistema operativo"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
    log_info "Sistema detectado: $OS $OS_VERSION"
else
    log_error "No se pudo detectar el sistema operativo"
    exit 1
fi

#############################################
# 2. ACTUALIZAR SISTEMA
#############################################

log_step "2. Actualizando sistema operativo"

if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    sudo apt-get update -y
    sudo apt-get upgrade -y
    sudo apt-get install -y curl wget git build-essential
elif [[ "$OS" == "amzn" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
    sudo yum update -y
    sudo yum install -y curl wget git gcc gcc-c++ make
fi

log_info "Sistema actualizado correctamente"

#############################################
# 3. INSTALAR DOCKER
#############################################

log_step "3. Instalando Docker"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    log_warn "Docker ya está instalado: $DOCKER_VERSION"
else
    log_info "Instalando Docker..."

    if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
        # Ubuntu/Debian
        sudo apt-get install -y ca-certificates gnupg lsb-release
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    elif [[ "$OS" == "amzn" ]]; then
        # Amazon Linux 2
        sudo amazon-linux-extras install docker -y
    elif [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
        # RHEL/CentOS
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
    fi

    sudo systemctl start docker
    sudo systemctl enable docker

    # Agregar usuario actual al grupo docker
    sudo usermod -aG docker $USER

    log_info "Docker instalado: $(docker --version)"
fi

#############################################
# 4. INSTALAR DOCKER COMPOSE
#############################################

log_step "4. Instalando Docker Compose"

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    log_warn "Docker Compose ya está instalado: $COMPOSE_VERSION"
else
    log_info "Instalando Docker Compose..."

    # Instalar Docker Compose v2
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Crear symlink si no existe
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    log_info "Docker Compose instalado: $(docker-compose --version)"
fi

#############################################
# 5. CONFIGURAR FIREWALL
#############################################

log_step "5. Configurando Firewall"

if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    if command -v ufw &> /dev/null; then
        sudo ufw allow OpenSSH
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 3001/tcp
        sudo ufw --force enable
        log_info "UFW configurado"
    fi
elif [[ "$OS" == "amzn" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-port=3001/tcp
        sudo firewall-cmd --reload
        log_info "Firewall configurado"
    fi
fi

#############################################
# 6. CLONAR/ACTUALIZAR REPOSITORIO
#############################################

log_step "6. Configurando aplicación"

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
# 7. CONFIGURAR VARIABLES DE ENTORNO
#############################################

log_step "7. Configurando variables de entorno"

if [ -f "$APP_DIR/.env" ]; then
    log_info "Archivo .env existente encontrado - NO se modificará"
    log_warn "Asegúrate de que tu .env tenga las credenciales correctas"
else
    log_warn "No se encontró archivo .env"
    log_info "Por favor, crea manualmente el archivo .env antes de continuar"
    exit 1
fi

# Mostrar configuración (sin secretos)
log_info "Configuración actual:"
grep -E "^(NODE_ENV|PORT|DB_HOST|DB_NAME|DB_USER)=" $APP_DIR/.env || true
#############################################
# 8. DETENER CONTENEDORES ANTERIORES
#############################################

log_step "8. Deteniendo contenedores anteriores (si existen)"

cd $APP_DIR
docker-compose down 2>/dev/null || log_warn "No hay contenedores anteriores"

#############################################
# 9. CONSTRUIR Y LEVANTAR CONTENEDORES
#############################################

log_step "9. Construyendo y levantando contenedores"

cd $APP_DIR

log_info "Construyendo imágenes Docker..."
docker-compose build --no-cache

log_info "Levantando servicios..."
docker-compose up -d

log_info "Esperando a que PostgreSQL esté listo..."
sleep 10

#############################################
# 10. VERIFICAR ESTADO DE CONTENEDORES
#############################################

log_step "10. Verificando estado de contenedores"

docker-compose ps

#############################################
# 11. EJECUTAR MIGRACIONES
#############################################

log_step "11. Ejecutando migraciones de base de datos"

log_info "Esperando a que la aplicación esté lista..."
sleep 5

log_info "Ejecutando migraciones..."
docker-compose exec -T app npm run db:migrate || {
    log_error "Error al ejecutar migraciones"
    log_warn "Intentando nuevamente en 10 segundos..."
    sleep 10
    docker-compose exec -T app npm run db:migrate
}

log_info "Migraciones ejecutadas correctamente"

#############################################
# 12. CONFIGURAR RESTART POLICIES
#############################################

log_step "12. Configurando políticas de reinicio"

docker update --restart=unless-stopped aura-postgres aura-messaging-service

log_info "Políticas de reinicio configuradas"

#############################################
# 13. VERIFICACIÓN FINAL
#############################################

log_step "13. Verificación final"

echo ""
log_info "Probando conexión a PostgreSQL..."
docker-compose exec -T postgres pg_isready -U postgres && log_info "✅ PostgreSQL: OK" || log_error "❌ PostgreSQL: FALLO"

echo ""
log_info "Probando API..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/health || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    log_info "✅ API: OK (HTTP $HTTP_CODE)"
else
    log_warn "⚠️  API: HTTP $HTTP_CODE (puede estar iniciando...)"
fi

#############################################
# 14. RESUMEN FINAL
#############################################

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ DESPLIEGUE COMPLETADO CON ÉXITO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📍 Información del despliegue:${NC}"
echo -e "  • Directorio: ${APP_DIR}"
echo -e "  • Puerto API: 3001"
echo -e "  • Puerto WebSocket: 3002"
echo -e "  • Base de datos: PostgreSQL 16"
echo ""

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "${CYAN}🌐 URLs de acceso:${NC}"
echo -e "  • API: ${GREEN}http://${PUBLIC_IP}:3001/api/v1${NC}"
echo -e "  • Health: ${GREEN}http://${PUBLIC_IP}:3001/api/v1/health${NC}"
echo -e "  • WebSocket: ${GREEN}ws://${PUBLIC_IP}:3002${NC}"
echo ""
echo -e "${CYAN}🐳 Comandos útiles Docker:${NC}"
echo -e "  • Ver logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  • Ver logs app: ${YELLOW}docker-compose logs -f app${NC}"
echo -e "  • Ver logs DB: ${YELLOW}docker-compose logs -f postgres${NC}"
echo -e "  • Reiniciar: ${YELLOW}docker-compose restart${NC}"
echo -e "  • Detener: ${YELLOW}docker-compose down${NC}"
echo -e "  • Estado: ${YELLOW}docker-compose ps${NC}"
echo -e "  • Shell app: ${YELLOW}docker-compose exec app sh${NC}"
echo -e "  • Shell DB: ${YELLOW}docker-compose exec postgres psql -U postgres -d aura_messaging${NC}"
echo ""
echo -e "${CYAN}🗄️  PostgreSQL:${NC}"
echo -e "  • Host: postgres (interno) / localhost (externo)"
echo -e "  • Puerto: 5432"
echo -e "  • Base de datos: aura_messaging"
echo -e "  • Usuario: postgres"
echo ""
echo -e "${CYAN}📊 Monitoreo:${NC}"
echo -e "  • Ver logs en tiempo real: ${YELLOW}cd $APP_DIR && docker-compose logs -f${NC}"
echo ""
echo -e "${GREEN}🚀 AURA Messaging Service está listo y funcionando!${NC}"
echo ""
