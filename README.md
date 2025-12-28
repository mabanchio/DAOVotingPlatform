# DAO Voting Platform

Plataforma de votación DAO completa con smart contracts auditables y suite de tests comprobada.

## 📋 Descripción

Aplicación Web3 completa que permite crear y votar propuestas en una DAO donde los usuarios pueden participar de forma segura y transparente con depósitos de ETH y un sistema de votación robusto.

### Características Principales

✅ **Sistema de Votación**: Crear propuestas, votar (favor/contra/abstención)  
✅ **Gestión de Fondos**: Depósitos y retiros de ETH  
✅ **Votación Segura**: Validación de saldos y prevención de doble voto  
✅ **Ejecución Automática**: Propuestas se ejecutan después del tiempo de demora  
✅ **Tests Completos**: 21/21 tests pasando (100% cobertura)  
✅ **Frontend Moderno**: Next.js 14, React 18, TypeScript, Tailwind CSS  

## 🚀 Quick Start

```bash
# 1. Instalación de dependencias
cd web
npm install

# 2. Compilación de smart contracts
cd ../sc
forge build

# 3. Ejecutar tests
forge test -vv

# 4. Iniciar frontend
cd ../web
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
DAOVotingPlatform/
├── sc/                          # Smart Contracts (Solidity + Foundry)
│   ├── src/
│   │   ├── DAOVoting.sol        # Contrato principal de votación (271 líneas)
│   │   └── MinimalForwarder.sol # Forwarder ERC2771 (18 líneas)
│   ├── test/
│   │   └── DAOVoting.t.sol      # Suite de 21 tests (100% passing)
│   ├── script/
│   │   └── Deploy.s.sol         # Script de despliegue automático
│   ├── lib/
│   │   ├── openzeppelin-contracts/  # Dependencia OpenZeppelin
│   │   └── forge-std/               # Foundry standard library
│   ├── foundry.toml             # Configuración Foundry
│   └── README.md                # Guía de smart contracts
│
├── web/                         # Frontend (Next.js + React)
│   ├── src/
│   │   ├── components/          # React components (5 componentes)
│   │   │   ├── MainApp.tsx
│   │   │   ├── WalletConnect.tsx
│   │   │   ├── ProposalList.tsx
│   │   │   ├── ProposalForm.tsx
│   │   │   └── DepositForm.tsx
│   │   ├── lib/                 # Utilidades Web3
│   │   │   ├── web3.ts          # Funciones Web3 (156 líneas)
│   │   │   └── abi.ts           # ABIs de contratos (158 líneas)
│   │   └── app/
│   │       ├── page.tsx         # Página principal
│   │       ├── layout.tsx       # Layout global
│   │       └── api/             # API routes
│   │           ├── relay/route.ts    # Endpoint relay de meta-tx
│   │           └── daemon/route.ts   # Daemon automático
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── README.md                # Guía de frontend
│
├── .git/                        # Repositorio Git sincronizado
├── .gitignore                   # Configuración Git
├── README.md                    # Este archivo
├── RESUMEN_TESTS.md             # Resultados de tests y métricas
├── check-setup.sh               # Script de verificación
└── deploy-local.sh              # Script de despliegue local
```

## 🧪 Testing

```bash
cd sc/

# Ejecutar todos los tests
forge test -vv

# Resultado: 21/21 tests passing ✅
# ✓ Depósitos (3 tests)
# ✓ Retiros (2 tests)
# ✓ Propuestas (4 tests)
# ✓ Votación (6 tests)
# ✓ Finalización (2 tests)
# ✓ Ejecución (1 test)
# ✓ Configuración (2 tests)
# ✓ Edge cases (1 test)

# Ejecutar test específico
forge test --match testDepositar -vv

# Generar reporte de gas
forge test --gas-report
```

## 🏗️ Arquitectura

### Smart Contracts (Solidity 0.8.24)

**DAOVoting.sol** (271 líneas)
- `depositar()` - Deposita ETH en la DAO
- `retirar(uint256)` - Retira fondos personales
- `crearPropuesta(string, string, uint256)` - Crea nueva propuesta
- `votar(uint256, VoteType)` - Emite un voto (Favor/Contra/Abstención)
- `finalizarVotacion(uint256)` - Finaliza período de votación
- `ejecutarPropuesta(uint256)` - Ejecuta propuesta aprobada
- `obtenerSaldo(address)` - Consulta saldo de usuario
- `obtenerTotalPropuestas()` - Total de propuestas
- `obtenerPropuesta(uint256)` - Información de propuesta
- `haVotado(uint256, address)` - Verifica si votó

**MinimalForwarder.sol** (18 líneas)
- Extiende `ERC2771Forwarder` de OpenZeppelin
- Soporta meta-transacciones seguras (EIP-2771)

### Frontend (Next.js 14 + React 18)

**5 Componentes principales:**
1. `MainApp` - Componente raíz
2. `WalletConnect` - Conexión con MetaMask
3. `ProposalList` - Listado de propuestas
4. `ProposalForm` - Crear nuevas propuestas
5. `DepositForm` - Gestión de depósitos

**API Routes:**
- `/api/relay` - Procesa meta-transacciones
- `/api/daemon` - Ejecución automática de propuestas

### Librerias Principales

```json
{
  "dependencies": {
    "next": "14.0.4",
    "react": "18.2.0",
    "ethers": "6.9.0",
    "tailwindcss": "3.3.0"
  },
  "devDependencies": {
    "typescript": "5.3.3",
    "@types/react": "18.2.0"
  }
}
```

## 🔧 Tech Stack

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Smart Contracts | Solidity | 0.8.24 |
| Testing Framework | Foundry | Latest |
| Frontend Framework | Next.js | 14 |
| UI Library | React | 18 |
| Styling | Tailwind CSS | 3 |
| Web3 Library | ethers.js | 6.9.0 |
| Wallet Integration | MetaMask | Browser |
| Type Safety | TypeScript | 5.3 |

## 📊 Estado del Proyecto

| Aspecto | Estado | Detalles |
|--------|--------|----------|
| Smart Contracts | ✅ Completado | DAOVoting.sol + MinimalForwarder.sol |
| Tests | ✅ 21/21 Pasando | 100% cobertura de funcionalidades |
| Frontend | ✅ Funcional | 5 componentes React integrados |
| API Routes | ✅ Implementado | Relay y daemon operativos |
| Documentación | ✅ Completa | Docs técnica y de usuario |
| Deploy Script | ✅ Listo | Despliegue automático |
| Git Repository | ✅ Sincronizado | GitHub remote configurado |

## 📖 Documentación Adicional

- **[sc/README.md](sc/README.md)** - Documentación de smart contracts
- **[web/README.md](web/README.md)** - Documentación de frontend

## 🔐 Seguridad

- ✅ Validación de saldos en depósitos y votación
- ✅ Prevención de doble voto por usuario
- ✅ Validación de estados de propuesta
- ✅ Requiere aprobación de votación antes de ejecutar
- ✅ Protección contra transacciones malformadas
- ⚠️ **Sin auditoría externa** - Para producción requiere auditoría

## 🚀 Despliegue

### En Testnet (Sepolia)

```bash
# 1. Configurar variables de entorno
export PRIVATE_KEY=0x...
export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...

# 2. Desplegar smart contracts
cd sc
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast

# 3. Actualizar ABI en frontend
cp out/DAOVoting.json ../web/src/lib/abi-dao.json

# 4. Iniciar frontend
cd ../web
npm run dev
```

### En Local (Anvil)

```bash
# Terminal 1: Iniciar Anvil
anvil

# Terminal 2: Desplegar smart contracts
cd sc
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Iniciar frontend
cd web
npm run dev
```

## 🐛 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| "Propuesta no existe" | ID inválido | Verificar ID en listado |
| "Saldo insuficiente" | No tiene ETH | Depositar más ETH |
| "Ya has votado" | Ya votó | Un voto por propuesta |
| MetaMask no conecta | Red incorrecta | Cambiar a la red correcta |
| Gas muy alto | Contract bloated | Optimizar con via_ir |

## 📈 Métricas

**Smart Contracts:**
- Total líneas de código: ~290 LOC
- Funciones públicas: 10
- Tests: 21 (100% passing)
- Gas promedio por función: 50K-500K

**Frontend:**
- Componentes: 5
- Páginas: 2
- API routes: 2
- Total líneas TypeScript: ~500 LOC

## 📝 Licencia

MIT - Libre para usar, modificar y distribuir

## 👤 Autor

Desarrollado como proyecto de entrenamiento CodeCrypto 2025

## 🔗 Enlaces Útiles

- [Solidity Docs](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js Docs](https://docs.ethers.org/v6/)
- [EIP-2771](https://eips.ethereum.org/EIPS/eip-2771)

---

**Última actualización:** 28 de Diciembre 2025  
**Estado:** ✅ Listo para desarrollo y demostración
