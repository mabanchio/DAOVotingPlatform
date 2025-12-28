'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import WalletConnect from './WalletConnect';
import ProposalList from './ProposalList';
import ProposalForm from './ProposalForm';
import DepositForm from './DepositForm';

interface UserData {
  address: string;
  balance: string;
  daoBalance: string;
}

export default function MainApp() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'proposals' | 'create' | 'deposit'>('proposals');

  const handleWalletConnect = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      setLoading(true);
      
      // Obtener saldo de ETH
      const ethBalance = await provider.getBalance(address);
      
      // Obtener saldo en DAO (necesitaríamos el contrato)
      const formattedBalance = ethers.formatEther(ethBalance);
      
      setUser({
        address,
        balance: formattedBalance,
        daoBalance: '0'
      });
      setConnected(true);
    } catch (error) {
      console.error('Error al conectar:', error);
      alert('Error al conectar la cartera');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setUser(null);
    setSelectedTab('proposals');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">DAO</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Plataforma de Votación DAO</h1>
            </div>
            <WalletConnect 
              onConnect={handleWalletConnect}
              onDisconnect={handleDisconnect}
              connected={connected}
              user={user}
            />
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!connected ? (
          <div className="text-center py-12">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                Bienvenido a la DAO
              </h2>
              <p className="text-slate-300 mb-6">
                Conecta tu cartera para participar en la votación de propuestas
              </p>
              <div className="bg-blue-900/20 border border-blue-500/50 rounded p-4 text-left text-sm text-slate-300">
                <p className="font-semibold text-blue-300 mb-2">💡 Características:</p>
                <ul className="space-y-1">
                  <li>✓ Votación sin gas (meta-transacciones)</li>
                  <li>✓ Creación de propuestas</li>
                  <li>✓ Ejecución automática</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Información del Usuario */}
            {user && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Tu Información</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Dirección</p>
                    <p className="text-white font-mono text-sm break-all">{user.address}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Saldo ETH</p>
                    <p className="text-white font-semibold">{parseFloat(user.balance).toFixed(4)} ETH</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-slate-700">
              <button
                onClick={() => setSelectedTab('proposals')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  selectedTab === 'proposals'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Propuestas
              </button>
              <button
                onClick={() => setSelectedTab('create')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  selectedTab === 'create'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Crear Propuesta
              </button>
              <button
                onClick={() => setSelectedTab('deposit')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  selectedTab === 'deposit'
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Depositar
              </button>
            </div>

            {/* Contenido Tab */}
            {selectedTab === 'proposals' && <ProposalList userAddress={user?.address} />}
            {selectedTab === 'create' && <ProposalForm />}
            {selectedTab === 'deposit' && <DepositForm />}
          </>
        )}
      </div>
    </main>
  );
}
