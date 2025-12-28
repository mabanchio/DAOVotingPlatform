// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DAOVoting
 * @dev Contrato principal de la DAO con soporte para votaciones sin gas (meta-transacciones)
 */
contract DAOVoting is ERC2771Context, Ownable {
    using Counters for Counters.Counter;

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
        uint256 plazoVotacion; // en segundos
        uint256 tiempoEjecucion; // timestamp cuando se puede ejecutar
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
    Counters.Counter private _propuestasCounter;
    
    uint256 public saldoMinimo; // Saldo mínimo para participar (0.1 ETH por defecto)
    uint256 public porcentajeRequisitoCreacion; // Porcentaje requerido para crear propuestas (10%)
    uint256 public saldoMinimoBases; // En denominadores (1000 = 100%, 100 = 10%)
    uint256 public tiempoEjecucionDemorado; // Tiempo de espera antes de ejecutar (1 día)

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
        require(propuestaId < _propuestasCounter.current(), "Propuesta no existe");
        _;
    }

    modifier puedeVotar(uint256 propuestaId) {
        require(saldosDeposito[_msgSender()] >= saldoMinimo, "Saldo insuficiente");
        require(!propuestas[propuestaId].haVotado[_msgSender()], "Ya has votado");
        require(propuestas[propuestaId].estado == ProposalState.Votacion, "Votacion no activa");
        _;
    }

    // Constructor
    constructor(
        address forwarderAddress,
        uint256 _saldoMinimo,
        uint256 _tiempoEjecucionDemorado
    ) ERC2771Context(forwarderAddress) {
        saldoMinimo = _saldoMinimo;
        porcentajeRequisitoCreacion = 10; // 10%
        saldoMinimoBases = 1000;
        tiempoEjecucionDemorado = _tiempoEjecucionDemorado;
    }

    // ==================== Funciones Públicas ====================

    /**
     * @dev Permite a los usuarios depositar ETH en la DAO
     */
    function depositar() external payable {
        require(msg.value > 0, "El deposito debe ser mayor a 0");
        saldosDeposito[_msgSender()] += msg.value;
        emit DepositoRealizado(_msgSender(), msg.value);
    }

    /**
     * @dev Permite a los usuarios retirar sus fondos
     */
    function retirar(uint256 cantidad) external {
        require(saldosDeposito[_msgSender()] >= cantidad, "Saldo insuficiente");
        saldosDeposito[_msgSender()] -= cantidad;
        (bool exito, ) = payable(_msgSender()).call{value: cantidad}("");
        require(exito, "Transferencia fallida");
        emit RetiroRealizado(_msgSender(), cantidad);
    }

    /**
     * @dev Crea una nueva propuesta
     * Requiere al menos el 10% del saldo total de la DAO
     */
    function crearPropuesta(
        string memory titulo,
        string memory descripcion,
        uint256 tiempoVotacion
    ) external returns (uint256) {
        uint256 saldoTotalDAO = address(this).balance;
        uint256 saldoRequerido = (saldoTotalDAO * porcentajeRequisitoCreacion) / saldoMinimoBases;
        
        require(saldosDeposito[_msgSender()] >= saldoRequerido, "Saldo insuficiente para crear propuesta");
        require(tiempoVotacion > 0, "Tiempo de votacion debe ser mayor a 0");

        uint256 propuestaId = _propuestasCounter.current();
        _propuestasCounter.increment();

        Proposal storage prop = propuestas[propuestaId];
        prop.id = propuestaId;
        prop.creador = _msgSender();
        prop.titulo = titulo;
        prop.descripcion = descripcion;
        prop.saldoRequerido = saldoRequerido;
        prop.plazoVotacion = tiempoVotacion;
        prop.fechaCreacion = block.timestamp;
        prop.fechaFinVotacion = block.timestamp + tiempoVotacion;
        prop.tiempoEjecucion = block.timestamp + tiempoVotacion + tiempoEjecucionDemorado;
        prop.estado = ProposalState.Votacion;

        emit PropuestaCreada(propuestaId, _msgSender(), titulo, tiempoVotacion);
        return propuestaId;
    }

    /**
     * @dev Emite un voto en una propuesta (sin gas usando meta-transacciones)
     */
    function votar(uint256 propuestaId, VoteType voto) external propuestaValida(propuestaId) puedeVotar(propuestaId) {
        Proposal storage prop = propuestas[propuestaId];
        
        prop.haVotado[_msgSender()] = true;
        prop.tipoVoto[_msgSender()] = voto;

        if (voto == VoteType.Favor) {
            prop.votosAFavor += 1;
        } else if (voto == VoteType.Contra) {
            prop.votosEnContra += 1;
        } else {
            prop.votosAbstencion += 1;
        }

        emit VotoEmitido(propuestaId, _msgSender(), voto);
        
        // Actualizar estado si el plazo terminó
        _actualizarEstadoPropuesta(propuestaId);
    }

    /**
     * @dev Finaliza la votación y determina si fue aprobada
     */
    function finalizarVotacion(uint256 propuestaId) external propuestaValida(propuestaId) {
        Proposal storage prop = propuestas[propuestaId];
        
        require(prop.estado == ProposalState.Votacion, "Votacion no esta activa");
        require(block.timestamp >= prop.fechaFinVotacion, "Plazo de votacion no ha terminado");

        // Si hay más votos a favor que en contra, se aprueba
        if (prop.votosAFavor > prop.votosEnContra) {
            prop.estado = ProposalState.Aprobada;
            emit PropuestaAprobada(propuestaId);
        } else {
            prop.estado = ProposalState.Rechazada;
            emit PropuestaRechazada(propuestaId);
        }
    }

    /**
     * @dev Ejecuta una propuesta aprobada después del tiempo de demora
     */
    function ejecutarPropuesta(uint256 propuestaId) external propuestaValida(propuestaId) {
        Proposal storage prop = propuestas[propuestaId];
        
        require(prop.estado == ProposalState.Aprobada, "Propuesta no fue aprobada");
        require(!prop.ejecutada, "Propuesta ya fue ejecutada");
        require(block.timestamp >= prop.tiempoEjecucion, "Tiempo de ejecucion aun no llega");

        prop.ejecutada = true;
        prop.estado = ProposalState.Ejecutada;

        emit PropuestaEjecutada(propuestaId);
    }

    // ==================== Funciones de Consulta ====================

    /**
     * @dev Retorna el número total de propuestas
     */
    function obtenerTotalPropuestas() external view returns (uint256) {
        return _propuestasCounter.current();
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
        return ProposalInfo({
            id: prop.id,
            creador: prop.creador,
            titulo: prop.titulo,
            descripcion: prop.descripcion,
            saldoRequerido: prop.saldoRequerido,
            plazoVotacion: prop.plazoVotacion,
            tiempoEjecucion: prop.tiempoEjecucion,
            fechaCreacion: prop.fechaCreacion,
            fechaFinVotacion: prop.fechaFinVotacion,
            votosAFavor: prop.votosAFavor,
            votosEnContra: prop.votosEnContra,
            votosAbstencion: prop.votosAbstencion,
            estado: prop.estado,
            ejecutada: prop.ejecutada
        });
    }

    /**
     * @dev Retorna el saldo depositado de un usuario
     */
    function obtenerSaldo(address usuario) external view returns (uint256) {
        return saldosDeposito[usuario];
    }

    /**
     * @dev Verifica si un usuario ha votado en una propuesta
     */
    function haVotado(uint256 propuestaId, address usuario) 
        external 
        view 
        propuestaValida(propuestaId) 
        returns (bool) 
    {
        return propuestas[propuestaId].haVotado[usuario];
    }

    // ==================== Funciones Internas ====================

    /**
     * @dev Actualiza automáticamente el estado de una propuesta
     */
    function _actualizarEstadoPropuesta(uint256 propuestaId) internal {
        Proposal storage prop = propuestas[propuestaId];
        
        if (block.timestamp >= prop.fechaFinVotacion && prop.estado == ProposalState.Votacion) {
            if (prop.votosAFavor > prop.votosEnContra) {
                prop.estado = ProposalState.Aprobada;
                emit PropuestaAprobada(propuestaId);
            } else {
                prop.estado = ProposalState.Rechazada;
                emit PropuestaRechazada(propuestaId);
            }
        }
    }

    /**
     * @dev Función requerida por ERC2771Context
     */
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return super._msgSender();
    }

    /**
     * @dev Función requerida por ERC2771Context
     */
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return super._msgData();
    }
}
