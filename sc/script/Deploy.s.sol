// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/DAOVoting.sol";
import "../src/MinimalForwarder.sol";

/**
 * @title DeployScript
 * @dev Script para desplegar los contratos en local o testnet
 * 
 * Uso:
 * - Local: forge script script/Deploy.s.sol:DeployScript --rpc-url http://127.0.0.1:8545 --broadcast
 * - Testnet: forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --verify
 */
contract DeployScript is Script {
    uint256 constant MINIMUM_BALANCE = 0.1 ether; // 0.1 ETH mínimo
    uint256 constant EXECUTION_DELAY = 1 days;    // 1 día de espera antes de ejecutar

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Paso 1: Desplegar el Forwarder
        console.log("Desplegando CustomMinimalForwarder...");
        CustomMinimalForwarder forwarder = new CustomMinimalForwarder();
        console.log("Forwarder desplegado en:", address(forwarder));

        // Paso 2: Desplegar el contrato DAO
        console.log("Desplegando DAOVoting...");
        DAOVoting dao = new DAOVoting(
            address(forwarder),
            MINIMUM_BALANCE,
            EXECUTION_DELAY
        );
        console.log("DAO desplegado en:", address(dao));

        vm.stopBroadcast();

        // Mostrar resultados
        console.log("\n========== DESPLIEGUE EXITOSO ==========");
        console.log("Forwarder:    ", address(forwarder));
        console.log("DAO:          ", address(dao));
        console.log("Saldo minimo: ", MINIMUM_BALANCE);
        console.log("Delay ejecución:", EXECUTION_DELAY);
        console.log("========================================\n");

        // Guardar direcciones en archivo (opcional)
        string memory forwarderAddr = addressToString(address(forwarder));
        string memory daoAddr = addressToString(address(dao));
        
        console.log("Guarda estas direcciones en tu .env.local:");
        console.log("NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS=", forwarderAddr);
        console.log("NEXT_PUBLIC_DAO_CONTRACT_ADDRESS=", daoAddr);
    }

    function addressToString(address _addr) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(_addr)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(abi.encodePacked("0x", s));
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
