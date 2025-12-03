# ============================================
# STAGE 1: Build Dependencies
# ============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --production && npm cache clean --force

# ============================================
# STAGE 2: Production Image
# ============================================
FROM node:20-alpine AS production

# Variables de entorno de producción
ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app

# Instalar solo el cliente de PostgreSQL (necesario para healthcheck)
RUN apk add --no-cache postgresql-client

# Crear usuario no-root para mayor seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar dependencias desde la stage de build
COPY --from=dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar el código fuente de la aplicación
COPY --chown=nodejs:nodejs . .

# Cambiar al usuario no-root
USER nodejs

# Exponer el puerto de la aplicación
EXPOSE 3001

# Healthcheck para verificar que el servicio está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "src/index.js"]
