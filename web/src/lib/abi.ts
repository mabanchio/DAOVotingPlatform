/**
 * lib/abi/DAOVoting.json
 * ABI del contrato DAOVoting
 */

export const DAO_VOTING_ABI = [
  {
    "type": "function",
    "name": "depositar",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "retirar",
    "inputs": [{"name": "cantidad", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "crearPropuesta",
    "inputs": [
      {"name": "titulo", "type": "string"},
      {"name": "descripcion", "type": "string"},
      {"name": "tiempoVotacion", "type": "uint256"}
    ],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "votar",
    "inputs": [
      {"name": "propuestaId", "type": "uint256"},
      {"name": "voto", "type": "uint8"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "finalizarVotacion",
    "inputs": [{"name": "propuestaId", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ejecutarPropuesta",
    "inputs": [{"name": "propuestaId", "type": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "obtenerTotalPropuestas",
    "inputs": [],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "obtenerPropuesta",
    "inputs": [{"name": "propuestaId", "type": "uint256"}],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {"name": "id", "type": "uint256"},
          {"name": "creador", "type": "address"},
          {"name": "titulo", "type": "string"},
          {"name": "descripcion", "type": "string"},
          {"name": "saldoRequerido", "type": "uint256"},
          {"name": "plazoVotacion", "type": "uint256"},
          {"name": "tiempoEjecucion", "type": "uint256"},
          {"name": "fechaCreacion", "type": "uint256"},
          {"name": "fechaFinVotacion", "type": "uint256"},
          {"name": "votosAFavor", "type": "uint256"},
          {"name": "votosEnContra", "type": "uint256"},
          {"name": "votosAbstencion", "type": "uint256"},
          {"name": "estado", "type": "uint8"},
          {"name": "ejecutada", "type": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "obtenerSaldo",
    "inputs": [{"name": "usuario", "type": "address"}],
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "haVotado",
    "inputs": [
      {"name": "propuestaId", "type": "uint256"},
      {"name": "usuario", "type": "address"}
    ],
    "outputs": [{"type": "bool"}],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "PropuestaCreada",
    "inputs": [
      {"name": "id", "type": "uint256", "indexed": true},
      {"name": "creador", "type": "address", "indexed": true},
      {"name": "titulo", "type": "string"},
      {"name": "tiempoVotacion", "type": "uint256"}
    ]
  },
  {
    "type": "event",
    "name": "VotoEmitido",
    "inputs": [
      {"name": "propuestaId", "type": "uint256", "indexed": true},
      {"name": "votante", "type": "address", "indexed": true},
      {"name": "voto", "type": "uint8"}
    ]
  },
  {
    "type": "event",
    "name": "PropuestaAprobada",
    "inputs": [{"name": "propuestaId", "type": "uint256", "indexed": true}]
  },
  {
    "type": "event",
    "name": "PropuestaRechazada",
    "inputs": [{"name": "propuestaId", "type": "uint256", "indexed": true}]
  },
  {
    "type": "event",
    "name": "PropuestaEjecutada",
    "inputs": [{"name": "propuestaId", "type": "uint256", "indexed": true}]
  },
  {
    "type": "event",
    "name": "DepositoRealizado",
    "inputs": [
      {"name": "usuario", "type": "address", "indexed": true},
      {"name": "cantidad", "type": "uint256"}
    ]
  },
  {
    "type": "event",
    "name": "RetiroRealizado",
    "inputs": [
      {"name": "usuario", "type": "address", "indexed": true},
      {"name": "cantidad", "type": "uint256"}
    ]
  }
];
