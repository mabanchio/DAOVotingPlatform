// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title CustomMinimalForwarder
 * @dev Forwarder EIP-2771 para soportar meta-transacciones sin gas
 * 
 * Este contrato:
 * - Recibe llamadas firmadas por usuarios
 * - Valida la firma del usuario
 * - Reenvía la transacción al contrato objetivo
 * - La aplicación (relayer) paga el gas
 */
contract CustomMinimalForwarder is ERC2771Forwarder {
    constructor() ERC2771Forwarder("DAOVotingForwarder") {}
}
