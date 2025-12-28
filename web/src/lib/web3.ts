/**
 * lib/web3.ts
 * Utilidades para interactuar con Web3 y contratos inteligentes
 */

import { ethers } from 'ethers';
import { DAO_VOTING_ABI } from './abi';

export interface MetaTransaction {
  from: string;
  to: string;
  value: string;
  data: string;
  gas: string;
  nonce: number;
  chainId: number;
}

export interface ForwardRequest {
  from: string;
  to: string;
  value: string;
  gas: string;
  nonce: number;
  data: string;
  chainId: number;
}

/**
 * Obtiene el provider basado en la configuración
 */
export function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Obtiene el signer del servidor (relayer)
 */
export function getServerSigner(): ethers.Wallet {
  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('RELAYER_PRIVATE_KEY no configurada');
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Obtiene instancia del contrato DAO
 */
export function getDAOContract(signer?: ethers.Signer) {
  const daoAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS;
  if (!daoAddress) {
    throw new Error('NEXT_PUBLIC_DAO_CONTRACT_ADDRESS no configurada');
  }

  const provider = signer || getProvider();
  return new ethers.Contract(daoAddress, DAO_VOTING_ABI, provider);
}

/**
 * Obtiene instancia del contrato Forwarder
 */
export function getForwarderContract(signer?: ethers.Signer) {
  const forwarderAddress = process.env.NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS;
  if (!forwarderAddress) {
    throw new Error('NEXT_PUBLIC_FORWARDER_CONTRACT_ADDRESS no configurada');
  }

  const provider = signer || getProvider();
  
  // ABI mínimo del Forwarder
  const FORWARDER_ABI = [
    'function execute((address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes memory signature) public payable returns (bool, bytes memory)',
    'function getNonce(address from) public view returns (uint256)'
  ];

  return new ethers.Contract(forwarderAddress, FORWARDER_ABI, provider);
}

/**
 * Crea una firma para una meta-transacción
 */
export async function signMetaTransaction(
  forwarder: ethers.Contract,
  from: string,
  to: string,
  data: string,
  signer: ethers.Signer
): Promise<{ req: ForwardRequest; signature: string }> {
  const nonce = await forwarder.getNonce(from);
  const chainId = (await getProvider().getNetwork()).chainId;

  const req: ForwardRequest = {
    from,
    to,
    value: '0',
    gas: '300000',
    nonce: Number(nonce),
    data,
    chainId: Number(chainId),
  };

  // Dominio para EIP-712
  const domain = {
    name: 'MinimalForwarder',
    version: '0.0.1',
    chainId,
    verifyingContract: forwarder.target,
  };

  // Tipos para EIP-712
  const types = {
    ForwardRequest: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'gas', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
  };

  const signature = await signer.signTypedData(domain as any, types, req as any);

  return { req, signature };
}

/**
 * Formatea dirección Ethereum
 */
export function formatAddress(address: string): string {
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

/**
 * Convierte wei a ETH
 */
export function weiToEth(wei: string | bigint): string {
  return ethers.formatEther(wei);
}

/**
 * Convierte ETH a wei
 */
export function ethToWei(eth: string | number): string {
  return ethers.parseEther(eth.toString()).toString();
}

/**
 * Valida una dirección Ethereum
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
