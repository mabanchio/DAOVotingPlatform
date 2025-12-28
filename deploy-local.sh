#!/bin/bash

# Script de Setup Automático para DAO Voting Platform
# Este script configura todo automáticamente

echo "================================"
echo "Setup Automático - DAO Voting"
echo "================================"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[!]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "sc" ] || [ ! -d "web" ]; then
  print_error "Este script debe ejecutarse desde la raíz del proyecto"
  exit 1
fi

# Paso 1: Verificar dependencias
print_status "Verificando dependencias..."

if ! command -v node &> /dev/null; then
  print_error "Node.js no está instalado"
  exit 1
fi
print_success "Node.js encontrado"

if ! command -v forge &> /dev/null; then
  print_error "Foundry no está instalado. Instálalo con: curl -L https://foundry.paradigm.xyz | bash"
  exit 1
fi
print_success "Foundry encontrado"

# Paso 2: Setup Smart Contracts
print_status "Setup de Smart Contracts..."
cd sc

# Instalar dependencias de Foundry
if [ ! -d "lib" ]; then
  print_status "Instalando librerías de Foundry..."
  forge install OpenZeppelin/openzeppelin-contracts --no-commit
  print_success "Librerías instaladas"
fi

# Crear .env si no existe
if [ ! -f ".env" ]; then
  cp .env.example .env
  print_warning "Archivo .env creado. Edítalo con tus valores."
fi

cd ..

# Paso 3: Setup Web App
print_status "Setup de aplicación web..."
cd web

# Instalar dependencias de npm
if [ ! -d "node_modules" ]; then
  print_status "Instalando dependencias de npm..."
  npm install
  print_success "Dependencias instaladas"
fi

# Crear .env.local si no existe
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  print_warning "Archivo .env.local creado. Edítalo con tus valores."
fi

cd ..

print_success "Setup completado!"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Terminal 1: Inicia Anvil con: anvil"
echo "2. Terminal 2: Deploya los contratos: cd sc && forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast"
echo "3. Terminal 3: Inicia la aplicación: cd web && npm run dev"
echo ""
echo "Abre http://localhost:3000 en tu navegador"
echo ""
