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
    
    event DepositoRealizado(address indexed usuario, uint256 cantidad);
    event RetiroRealizado(address indexed usuario, uint256 cantidad);

    // Modificadores
    modifier propuestaValida(uint256 propuestaId) {
        require(propuestaId < _propuestasCounter, "Propuesta no existe");
        _;
    }

    modifier puedeVotar(uint256 propuestaId) {
        require(saldosDeposito[msg.sender] >= saldoMinimo, "Saldo insuficiente");
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
        emit DepositoRealizado(msg.sender, msg.value);
    }

    /**
     * @dev Permite retirar fondos
     */
    function retirar(uint256 cantidad) external {
        require(saldosDeposito[msg.sender] >= cantidad, "Saldo insuficiente");
        saldosDeposito[msg.sender] -= cantidad;
        (bool exito, ) = payable(msg.sender).call{value: cantidad}("");
        require(exito, "Retiro fallido");
        emit RetiroRealizado(msg.sender, cantidad);
    }

    /**
     * @dev Crea una nueva propuesta
     */
    function crearPropuesta(
        string memory titulo,
        string memory descripcion,
        uint256 tiempoVotacion
    ) external returns (uint256) {
        uint256 saldoTotalDAO = address(this).balance;
        uint256 saldoRequerido = (saldoTotalDAO * porcentajeRequisitoCreacion) / saldoMinimoBases;
        
        require(saldosDeposito[msg.sender] >= saldoRequerido, "Saldo insuficiente para crear propuesta");
        require(tiempoVotacion > 0, "Tiempo de votacion debe ser mayor a 0");

        uint256 propuestaId = _propuestasCounter;
        _propuestasCounter++;

        Proposal storage prop = propuestas[propuestaId];
        prop.id = propuestaId;
        prop.creador = msg.sender;
        prop.titulo = titulo;
        prop.descripcion = descripcion;
        prop.saldoRequerido = saldoRequerido;
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
