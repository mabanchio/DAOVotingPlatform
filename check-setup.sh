#!/bin/bash

# Script de Verificación de Setup
# Verifica que todo esté configurado correctamente

echo "================================"
echo "Verificación de Setup"
echo "================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_item() {
  if [ -f "$1" ] || [ -d "$1" ]; then
    echo -e "${GREEN}[✓]${NC} $2"
    return 0
  else
    echo -e "${RED}[✗]${NC} $2"
    return 1
  fi
}

echo "Smart Contracts:"
check_item "sc/src/DAOVoting.sol" "DAOVoting.sol existe"
check_item "sc/src/MinimalForwarder.sol" "MinimalForwarder.sol existe"
check_item "sc/foundry.toml" "foundry.toml existe"

echo ""
echo "Web App:"
check_item "web/package.json" "package.json existe"
check_item "web/src/app/page.tsx" "page.tsx existe"
check_item "web/src/components/MainApp.tsx" "MainApp.tsx existe"

echo ""
echo "Configuración:"
check_item "sc/.env.example" "sc/.env.example existe"
check_item "web/.env.example" "web/.env.example existe"

echo ""
echo -e "${YELLOW}Verifica que hayas configurado:.env y.env.local con tus direcciones${NC}"
echo ""
