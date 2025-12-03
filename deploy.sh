#!/bin/bash

#############################################
# AURA Messaging Service - Deploy Script
# Para desarrollo local y AWS EC2
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
APP_DIR="$(pwd)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   🚀 AURA Messaging Service - Script de Despliegue Automático${NC}"
echo -e "${CYAN}   📦 Stack: Docker + PostgreSQL + Node.js${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📂 Directorio de trabajo: ${APP_DIR}${NC}"
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

    log_info "Docker instalado: $(sudo docker --version)"
fi

# Verificar y configurar permisos de Docker
log_info "Configurando permisos de Docker..."

if ! groups $USER | grep -q '\bdocker\b'; then
    log_info "Agregando usuario al grupo docker..."
    sudo usermod -aG docker $USER
    log_warn "Usuario agregado al grupo docker"
    log_warn "IMPORTANTE: Necesitas recargar el grupo para que los cambios tomen efecto"
    log_warn "Ejecuta: newgrp docker"
    log_warn "O cierra sesión y vuelve a entrar"
fi

# Verificar si podemos ejecutar Docker sin sudo
if ! docker ps &> /dev/null; then
    log_warn "No se puede ejecutar docker sin sudo"
    log_info "Usando sudo para comandos Docker..."
    DOCKER_CMD="sudo docker"
    DOCKER_COMPOSE_CMD="sudo docker-compose"
else
    log_info "Docker configurado correctamente para el usuario actual"
    DOCKER_CMD="docker"
    DOCKER_COMPOSE_CMD="docker-compose"
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
        sudo ufw allow 3002/tcp
        sudo ufw --force enable
        log_info "UFW configurado"
    else
        log_warn "UFW no está disponible"
    fi
elif [[ "$OS" == "amzn" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-port=3001/tcp
        sudo firewall-cmd --permanent --add-port=3002/tcp
        sudo firewall-cmd --reload
        log_info "Firewall configurado"
    else
        log_warn "Firewall no está disponible"
    fi
fi

#############################################
# 6. VERIFICAR ARCHIVOS DEL PROYECTO
#############################################

log_step "6. Verificando archivos del proyecto"

# Verificar que estamos en el directorio correcto
if [ ! -f "$APP_DIR/package.json" ]; then
    log_error "No se encontró package.json en el directorio actual"
    log_error "Asegúrate de ejecutar este script desde el directorio raíz del proyecto"
    exit 1
fi

log_info "Archivos del proyecto encontrados correctamente"

# Verificar que existe docker-compose.yml
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
    log_error "No se encontró docker-compose.yml"
    exit 1
fi

log_info "docker-compose.yml encontrado"

# Verificar que existe Dockerfile
if [ ! -f "$APP_DIR/Dockerfile" ]; then
    log_error "No se encontró Dockerfile"
    exit 1
fi

log_info "Dockerfile encontrado"

#############################################
# 7. VERIFICAR VARIABLES DE ENTORNO
#############################################

log_step "7. Verificando variables de entorno"

if [ ! -f "$APP_DIR/.env" ]; then
    log_error "No se encontró archivo .env"
    log_error "Por favor, crea el archivo .env con las configuraciones necesarias"
    log_info "Ejemplo de .env:"
    echo ""
    echo "NODE_ENV=production"
    echo "PORT=3001"
    echo "HOST=0.0.0.0"
    echo ""
    echo "DB_HOST=postgres"
    echo "DB_PORT=5432"
    echo "DB_NAME=aura_messaging"
    echo "DB_USER=postgres"
    echo "DB_PASSWORD=tu_password_seguro"
    echo "DB_DIALECT=postgres"
    echo "DB_SSL=false"
    echo ""
    echo "JWT_SECRET=tu_jwt_secret"
    echo "JWT_EXPIRES_IN=24h"
    echo "JWT_REFRESH_SECRET=tu_jwt_refresh_secret"
    echo "JWT_REFRESH_EXPIRES_IN=7d"
    echo ""
    exit 1
fi

log_info "Archivo .env encontrado correctamente"

# Mostrar configuración (sin secretos)
log_info "Configuración actual:"
grep -E "^(NODE_ENV|PORT|HOST|DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_DIALECT)=" "$APP_DIR/.env" || true

#############################################
# 8. DETENER CONTENEDORES ANTERIORES
#############################################

log_step "8. Deteniendo contenedores anteriores (si existen)"

cd "$APP_DIR"
$DOCKER_COMPOSE_CMD down 2>/dev/null || log_warn "No hay contenedores anteriores"

#############################################
# 9. LIMPIAR IMÁGENES Y VOLÚMENES HUÉRFANOS
#############################################

log_step "9. Limpiando recursos Docker"

log_info "Eliminando imágenes dangling..."
$DOCKER_CMD image prune -f 2>/dev/null || true

log_info "Limpieza completada"

#############################################
# 10. CONSTRUIR Y LEVANTAR CONTENEDORES
#############################################

log_step "10. Construyendo y levantando contenedores"

cd "$APP_DIR"

log_info "Construyendo imágenes Docker..."
$DOCKER_COMPOSE_CMD build --no-cache

log_info "Levantando servicios..."
$DOCKER_COMPOSE_CMD up -d

log_info "Esperando a que PostgreSQL esté listo..."
sleep 15

#############################################
# 11. VERIFICAR ESTADO DE CONTENEDORES
#############################################

log_step "11. Verificando estado de contenedores"

$DOCKER_COMPOSE_CMD ps

#############################################
# 12. EJECUTAR MIGRACIONES
#############################################

log_step "12. Ejecutando migraciones de base de datos"

log_info "Esperando a que la aplicación esté lista..."
sleep 10

log_info "Ejecutando migraciones..."
$DOCKER_COMPOSE_CMD exec -T app npm run db:migrate || {
    log_error "Error al ejecutar migraciones"
    log_warn "Intentando nuevamente en 15 segundos..."
    sleep 15
    $DOCKER_COMPOSE_CMD exec -T app npm run db:migrate
}

log_info "Migraciones ejecutadas correctamente"

#############################################
# 13. CONFIGURAR RESTART POLICIES
#############################################

log_step "13. Configurando políticas de reinicio"

# Obtener nombres reales de los contenedores
POSTGRES_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q postgres 2>/dev/null)
APP_CONTAINER=$($DOCKER_COMPOSE_CMD ps -q app 2>/dev/null)

if [ -n "$POSTGRES_CONTAINER" ] && [ -n "$APP_CONTAINER" ]; then
    $DOCKER_CMD update --restart=unless-stopped $POSTGRES_CONTAINER $APP_CONTAINER
    log_info "Políticas de reinicio configuradas"
else
    log_warn "No se pudieron configurar las políticas de reinicio"
fi

#############################################
# 14. VERIFICACIÓN FINAL
#############################################

log_step "14. Verificación final"

echo ""
log_info "Probando conexión a PostgreSQL..."
$DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U postgres && log_info "✅ PostgreSQL: OK" || log_error "❌ PostgreSQL: FALLO"

echo ""
log_info "Probando API..."
sleep 5

# Intentar varias veces el health check
MAX_RETRIES=5
RETRY_COUNT=0
HTTP_CODE="000"

while [ "$HTTP_CODE" != "200" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/health 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" == "200" ]; then
        log_info "✅ API: OK (HTTP $HTTP_CODE)"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warn "⚠️  API: HTTP $HTTP_CODE - Reintentando ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 5
        else
            log_warn "⚠️  API: HTTP $HTTP_CODE (puede estar iniciando...)"
            log_info "Verifica los logs con: docker-compose logs -f app"
        fi
    fi
done

#############################################
# 15. RESUMEN FINAL
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

# Detectar IP pública (EC2) o local
PUBLIC_IP=$(curl -s --connect-timeout 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null)

# Si no se obtuvo desde metadata de AWS, intentar con servicio externo
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "" ]; then
    PUBLIC_IP=$(curl -s --connect-timeout 3 https://api.ipify.org 2>/dev/null)
fi

# Si aún no hay IP pública, usar hostname
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "" ]; then
    PUBLIC_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# Fallback final
if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" == "" ]; then
    PUBLIC_IP="localhost"
fi

# Detectar si es IP privada de AWS (172.x o 10.x)
if [[ "$PUBLIC_IP" =~ ^172\. ]] || [[ "$PUBLIC_IP" =~ ^10\. ]]; then
    log_warn "Se detectó IP privada ($PUBLIC_IP). Obteniendo IP pública..."
    PUBLIC_IP=$(curl -s --connect-timeout 3 https://api.ipify.org 2>/dev/null || echo "localhost")
fi

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

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}🚀 AURA Messaging Service está listo y funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  El servicio está arrancando. Verifica los logs si demora más de 2 minutos.${NC}"
fi

echo ""
