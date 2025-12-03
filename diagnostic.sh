#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO DE AURA MESSAGING SERVICE"
echo "=========================================="
echo ""

echo "1. Estado de contenedores Docker:"
docker-compose ps
echo ""

echo "2. Logs de la aplicación (últimas 50 líneas):"
docker-compose logs --tail=50 app
echo ""

echo "3. Prueba de conectividad local:"
curl -v http://localhost:3001/api/v1/health
echo ""

echo "4. Puertos en escucha:"
sudo netstat -tulpn | grep -E '(3001|3002|5432)'
echo ""

echo "5. IP Pública:"
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
echo ""

echo "6. Contenedores en ejecución:"
docker ps
echo ""

echo "=========================================="
echo "FIN DEL DIAGNÓSTICO"
echo "=========================================="
