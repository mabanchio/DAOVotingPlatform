// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DAOVoting
 * @dev Contrato principal de la DAO con soporte para votaciones
 */
contract DAOVoting is Ownable {

    // Enums
    enum ProposalState {
        Pendiente,      // 0: Propuesta creada
        Votacion,       // 1: En período de votación
        Aprobada,       // 2: Aprobada, esperando ejecución
        Rechazada,      // 3: Rechazada
        Ejecutada,      // 4: Ejecutada exitosamente
        Cancelada       // 5: Cancelada
    }

    enum VoteType {
        Favor,      // 0: Voto a favor
        Contra,     // 1: Voto en contra
        Abstencion  // 2: Abstención
    }

    // Estructuras
    struct Proposal {
        uint256 id;
        address creador;
        string titulo;
        string descripcion;
        uint256 saldoRequerido;
        uint256 plazoVotacion;
        uint256 tiempoEjecucion;
        uint256 fechaCreacion;
        uint256 fechaFinVotacion;
        
        uint256 votosAFavor;
        uint256 votosEnContra;
        uint256 votosAbstencion;
        
        ProposalState estado;
        bool ejecutada;
        
        mapping(address => bool) haVotado;
        mapping(address => VoteType) tipoVoto;
    }

    struct ProposalInfo {
        uint256 id;
        address creador;
        string titulo;
        string descripcion;
        uint256 saldoRequerido;
        uint256 plazoVotacion;
        uint256 tiempoEjecucion;
        uint256 fechaCreacion;
        uint256 fechaFinVotacion;
        
        uint256 votosAFavor;
        uint256 votosEnContra;
        uint256 votosAbstencion;
        
        ProposalState estado;
        bool ejecutada;
    }

    // Variables de estado
    uint256 private _propuestasCounter = 0;
    address public forwarderAddress;
    
    uint256 public saldoMinimo;
    uint256 public porcentajeRequisitoCreacion;
    uint256 public saldoMinimoBases;
    uint256 public tiempoEjecucionDemorado;
    uint256 public saldoTotalDepositado = 0;

    mapping(uint256 => Proposal) public propuestas;
    mapping(address => uint256) public saldosDeposito;

    // Eventos
    event PropuestaCreada(
        uint256 indexed id,
        address indexed creador,
        string titulo,
        uint256 tiempoVotacion
    );

    event VotoEmitido(
        uint256 indexed propuestaId,
        address indexed votante,
        VoteType voto
    );

    event PropuestaAprobada(uint256 indexed propuestaId);
    event PropuestaRechazada(uint256 indexed propuestaId);
    event PropuestaEjecutada(uint256 indexed propuestaId);
    event PropuestaCancelada(uint256 indexed propuestaId);
    
    event DepositoRealizado(address indexed usuario, uint256 cantidad);
    event RetiroRealizado(address indexed usuario, uint256 cantidad);

    // Modificadores
    modifier propuestaValida(uint256 propuestaId) {
        require(propuestaId < _propuestasCounter, "Propuesta no existe");
        _;
    }

    modifier puedeVotar(uint256 propuestaId) {
        require(!propuestas[propuestaId].haVotado[msg.sender], "Ya has votado");
        require(propuestas[propuestaId].estado == ProposalState.Votacion, "Votacion no activa");
        _;
    }

    // Constructor
    constructor(
        address _forwarderAddress,
        uint256 _saldoMinimo,
        uint256 _tiempoEjecucionDemorado
    ) Ownable(msg.sender) {
        forwarderAddress = _forwarderAddress;
        saldoMinimo = _saldoMinimo;
        porcentajeRequisitoCreacion = 10;
        saldoMinimoBases = 1000;
        tiempoEjecucionDemorado = _tiempoEjecucionDemorado;
    }

    // ==================== Funciones Públicas ====================

    /**
     * @dev Permite depositar ETH en la DAO
     */
    function depositar() external payable {
        require(msg.value > 0, "El deposito debe ser mayor a 0");
        saldosDeposito[msg.sender] += msg.value;
        saldoTotalDepositado += msg.value;
        emit DepositoRealizado(msg.sender, msg.value);
    }

    /**
     * @dev Permite retirar fondos de manera equitativa
     * Solo retira la proporción que le corresponde: (su_deposito / total_depositado) * saldo_actual
     */
    function retirar() external {
        require(saldosDeposito[msg.sender] > 0, "No tienes fondos depositados");
        
        uint256 saldoRetirable = obtenerSaldoRetirable(msg.sender);
        require(saldoRetirable >= 0.0001 ether, "Saldo retirable debe ser al menos 0.0001 ETH");
        
        uint256 depositoAnterior = saldosDeposito[msg.sender];
        saldosDeposito[msg.sender] = 0;
        saldoTotalDepositado -= depositoAnterior;
        
        (bool exito, ) = payable(msg.sender).call{value: saldoRetirable}("");
        require(exito, "Retiro fallido");
        emit RetiroRealizado(msg.sender, saldoRetirable);
    }

    /**
     * @dev Calcula el saldo retirable de un usuario basado en su contribución
     * Fórmula: (su_deposito / total_depositado) * saldo_actual_contrato
     * Si es negativo o cero (fondos consumidos), retorna 0
     */
    function obtenerSaldoRetirable(address usuario) public view returns (uint256) {
        uint256 depositoUsuario = saldosDeposito[usuario];
        if (depositoUsuario == 0) return 0;
        if (saldoTotalDepositado == 0) return 0;
        
        uint256 saldoActual = address(this).balance;
        uint256 saldoRetirable = (depositoUsuario * saldoActual) / saldoTotalDepositado;
        
        return saldoRetirable;
    }

    /**
     * @dev Crea una nueva propuesta (sin requisito de depósito, consume gas de wallet)
     */
    function crearPropuesta(
        string memory titulo,
        string memory descripcion,
        uint256 tiempoVotacion
    ) external returns (uint256) {
        require(tiempoVotacion > 0, "Tiempo de votacion debe ser mayor a 0");

        uint256 propuestaId = _propuestasCounter;
        _propuestasCounter++;

        Proposal storage prop = propuestas[propuestaId];
        prop.id = propuestaId;
        prop.creador = msg.sender;
        prop.titulo = titulo;
        prop.descripcion = descripcion;
        prop.saldoRequerido = 0;
        prop.plazoVotacion = tiempoVotacion;
        prop.fechaCreacion = block.timestamp;
        prop.fechaFinVotacion = block.timestamp + tiempoVotacion;
        prop.tiempoEjecucion = block.timestamp + tiempoVotacion + tiempoEjecucionDemorado;
        prop.estado = ProposalState.Votacion;
        prop.ejecutada = false;

        emit PropuestaCreada(propuestaId, msg.sender, titulo, tiempoVotacion);
        return propuestaId;
    }

    /**
     * @dev Emite un voto en una propuesta
     */
    function votar(uint256 propuestaId, VoteType voto) 
        external 
        propuestaValida(propuestaId) 
        puedeVotar(propuestaId) 
    {
        Proposal storage prop = propuestas[propuestaId];
        
        prop.haVotado[msg.sender] = true;
        prop.tipoVoto[msg.sender] = voto;

        if (voto == VoteType.Favor) {
            prop.votosAFavor++;
        } else if (voto == VoteType.Contra) {
            prop.votosEnContra++;
        } else {
            prop.votosAbstencion++;
        }

        emit VotoEmitido(propuestaId, msg.sender, voto);
    }

    /**
     * @dev Emite un voto sin gastar gas (votación gasless)
     * Requiere: saldo depositado previo + firma válida
     * El contrato paga el gas
     */
    function votarGasless(
        address votante,
        uint256 propuestaId,
        VoteType voto,
        bytes memory signature
    ) 
        external 
        propuestaValida(propuestaId) 
    {
        // Votación sin gas: cualquiera puede votar, el contrato paga el costo de gas
        // NO se requiere que el votante tenga fondos depositados
        
        // Validar que el contrato tiene fondos para pagar el gas
        require(address(this).balance >= 0.0001 ether, "Contrato sin fondos para pagar votacion sin gas");
        
        // Validar que el usuario no ha votado ya
        require(!propuestas[propuestaId].haVotado[votante], "Ya has votado");
        
        // Validar que la propuesta está en votación
        require(propuestas[propuestaId].estado == ProposalState.Votacion, "Votacion no activa");
        
        // Verificar la firma - mensaje simple
        string memory message = string(abi.encodePacked(
            "Voto en propuesta ",
            _uintToString(propuestaId),
            " tipo ",
            _uintToString(uint256(voto))
        ));
        
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            _uintToString(bytes(abi.encodePacked(message)).length),
            message
        ));
        
        address recoveredAddress = _recoverAddress(messageHash, signature);
        require(recoveredAddress == votante, "Firma invalida");
        
        // Registrar el voto
        Proposal storage prop = propuestas[propuestaId];
        prop.haVotado[votante] = true;
        prop.tipoVoto[votante] = voto;

        if (voto == VoteType.Favor) {
            prop.votosAFavor++;
        } else if (voto == VoteType.Contra) {
            prop.votosEnContra++;
        } else {
            prop.votosAbstencion++;
        }

        // Consumir una pequeña cantidad del saldo del CONTRATO para pagar gas
        // Costo fijo por votación gasless: 0.0001 ETH (sale del saldo del contrato, no del usuario)
        uint256 gasCost = 0.0001 ether;
        require(address(this).balance >= gasCost, "Contrato sin fondos para pagar votacion sin gas");
        
        // Transferir el dinero del gas al owner (para pagar por el servidor que procesó la transacción)
        (bool exito, ) = payable(owner()).call{value: gasCost}("");
        require(exito, "Error al transferir costo de gas");

        emit VotoEmitido(propuestaId, votante, voto);
    }

    // Funciones auxiliares para manejo de firmas
    function _recoverAddress(bytes32 messageHash, bytes memory signature) 
        internal 
        pure 
        returns (address) 
    {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);
        return ecrecover(messageHash, v, r, s);
    }

    function _splitSignature(bytes memory sig) 
        internal 
        pure 
        returns (bytes32 r, bytes32 s, uint8 v) 
    {
        require(sig.length == 65, "Firma invalida");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function _uintToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Finaliza la votación
     */
    function finalizarVotacion(uint256 propuestaId) 
        external 
        propuestaValida(propuestaId) 
    {
        Proposal storage prop = propuestas[propuestaId];
        
        require(block.timestamp >= prop.fechaFinVotacion, "Votacion aun activa");
        require(prop.estado == ProposalState.Votacion, "Propuesta no esta en votacion");

        if (prop.votosAFavor > prop.votosEnContra) {
            prop.estado = ProposalState.Aprobada;
            emit PropuestaAprobada(propuestaId);
        } else {
            prop.estado = ProposalState.Rechazada;
            emit PropuestaRechazada(propuestaId);
        }
    }

    /**
     * @dev Ejecuta una propuesta aprobada
     */
    function ejecutarPropuesta(uint256 propuestaId) 
        external 
        propuestaValida(propuestaId) 
    {
        Proposal storage prop = propuestas[propuestaId];
        
        require(prop.estado == ProposalState.Aprobada, "Propuesta no esta aprobada");
        require(block.timestamp >= prop.tiempoEjecucion, "Tiempo de ejecucion no alcanzado");
        require(!prop.ejecutada, "Propuesta ya fue ejecutada");

        prop.estado = ProposalState.Ejecutada;
        prop.ejecutada = true;
        
        emit PropuestaEjecutada(propuestaId);
    }

    /**
     * @dev Cancela una propuesta (solo el creador durante votación)
     */
    function cancelarPropuesta(uint256 propuestaId) 
        external 
        propuestaValida(propuestaId) 
    {
        Proposal storage prop = propuestas[propuestaId];
        
        require(prop.creador == msg.sender, "Solo el creador puede cancelar la propuesta");
        require(prop.estado == ProposalState.Votacion, "Solo se pueden cancelar propuestas en votacion");
        require(!prop.ejecutada, "Propuesta ya fue ejecutada");

        prop.estado = ProposalState.Cancelada;
        
        emit PropuestaCancelada(propuestaId);
    }

    // ==================== Funciones de Vista ====================

    /**
     * @dev Obtiene el saldo de un usuario
     */
    function obtenerSaldo(address usuario) external view returns (uint256) {
        return saldosDeposito[usuario];
    }

    /**
     * @dev Retorna el total de propuestas
     */
    function obtenerTotalPropuestas() external view returns (uint256) {
        return _propuestasCounter;
    }

    /**
     * @dev Retorna información de una propuesta
     */
    function obtenerPropuesta(uint256 propuestaId) 
        external 
        view 
        propuestaValida(propuestaId) 
        returns (ProposalInfo memory) 
    {
        Proposal storage prop = propuestas[propuestaId];
        return ProposalInfo(
            prop.id,
            prop.creador,
            prop.titulo,
            prop.descripcion,
            prop.saldoRequerido,
            prop.plazoVotacion,
            prop.tiempoEjecucion,
            prop.fechaCreacion,
            prop.fechaFinVotacion,
            prop.votosAFavor,
            prop.votosEnContra,
            prop.votosAbstencion,
            prop.estado,
            prop.ejecutada
        );
    }

    /**
     * @dev Verifica si un usuario ha votado
     */
    function haVotado(uint256 propuestaId, address usuario) 
        external 
        view 
        propuestaValida(propuestaId) 
        returns (bool) 
    {
        return propuestas[propuestaId].haVotado[usuario];
    }

    /**
     * @dev Obtiene el tipo de voto de un usuario
     */
    function obtenerTipoVoto(uint256 propuestaId, address usuario) 
        external 
        view 
        propuestaValida(propuestaId) 
        returns (VoteType) 
    {
        require(propuestas[propuestaId].haVotado[usuario], "Usuario no ha votado");
        return propuestas[propuestaId].tipoVoto[usuario];
    }
}
