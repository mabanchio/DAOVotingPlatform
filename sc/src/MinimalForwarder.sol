// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

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
contract CustomMinimalForwarder is MinimalForwarder {
    constructor() MinimalForwarder() {}
}
