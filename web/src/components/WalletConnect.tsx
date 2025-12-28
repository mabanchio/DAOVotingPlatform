'use client';

import { useState } from 'react';
import { ethers } from 'ethers';

interface WalletConnectProps {
  onConnect: (address: string, provider: ethers.BrowserProvider) => void;
  onDisconnect: () => void;
  connected: boolean;
  user: any;
}

export default function WalletConnect({
  onConnect,
  onDisconnect,
  connected,
  user
}: WalletConnectProps) {
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setLoading(true);

      // Verificar si MetaMask está instalado
      if (!window.ethereum) {
        alert('Por favor instala MetaMask');
        return;
      }

      // Solicitar cuentas
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      onConnect(accounts[0], provider);
    } catch (error) {
      console.error('Error al conectar:', error);
      alert('Error al conectar la cartera');
    } finally {
      setLoading(false);
    }
  };

  if (connected && user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className="text-sm text-slate-400">Conectado como</p>
          <p className="text-white font-mono text-sm">
            {user.address.substring(0, 6)}...{user.address.substring(user.address.length - 4)}
          </p>
        </div>
        <button
          onClick={onDisconnect}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={loading}
      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
    >
      {loading ? 'Conectando...' : 'Conectar Cartera'}
    </button>
  );
}
