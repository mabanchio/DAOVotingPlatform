# DAO Voting Platform

Plataforma de votación DAO con meta-transacciones sin gas usando EIP-2771.

## 📋 Descripción

Aplicación Web3 completa que permite crear y votar propuestas en una DAO donde los usuarios **no pagan gas** - un relayer cubre los costos mientras valida las firmas.

### Características

✅ Votaciones sin gas (meta-transacciones EIP-2771)  
✅ Gestión de propuestas (crear, votar, ejecutar)  
✅ Depósitos y retiros de ETH  
✅ Ejecución automática de propuestas  
✅ Interfaz moderna con MetaMask  

## 🚀 Quick Start

```bash
# 1. Setup
bash deploy-local.sh

# 2. Verificar
bash check-setup.sh

# 3. Iniciar en 3 terminales:
# Terminal 1
anvil

# Terminal 2
cd sc
forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast

# Terminal 3
cd web
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura

```
sc/              # Smart Contracts (Solidity + Foundry)
web/             # Frontend (Next.js + React)
```

## 📖 Documentación

**DOCUMENTACION_COMPLETA.md** - Guía completa (no se sube al remoto)

## 🔧 Tech Stack

- **Smart Contracts**: Solidity 0.8.19, Foundry
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Web3**: ethers.js, MetaMask
- **Backend**: Next.js API Routes

## 📝 Licencia

MIT
