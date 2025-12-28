'use client';

import { useState } from 'react';
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
  const [selectedTab, setSelectedTab] = useState<'proposals' | 'create' | 'deposit'>('proposals');

  const handleWalletConnect = async (address: string, provider: ethers.BrowserProvider) => {
    try {
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
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setUser(null);
    setSelectedTab('proposals');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-850">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <span className="text-white font-bold text-lg">DAO</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  DAO Governance
                </h1>
                <p className="text-xs text-slate-400">Plataforma de Votación Descentralizada</p>
              </div>
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
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {!connected ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center py-16 max-w-lg">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl mb-8">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Bienvenido a DAO Governance
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Participa en la gobernanza descentralizada de la DAO. Conecta tu cartera para empezar.
              </p>
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-left mb-8">
                <p className="font-semibold text-cyan-300 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  Características principales:
                </p>
                <ul className="space-y-3">
                  <li className="text-slate-300 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-cyan-500/30 rounded mr-3 text-cyan-400 text-xs font-bold">✓</span>
                    Votación sin gas (meta-transacciones)
                  </li>
                  <li className="text-slate-300 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-cyan-500/30 rounded mr-3 text-cyan-400 text-xs font-bold">✓</span>
                    Creación de propuestas
                  </li>
                  <li className="text-slate-300 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-cyan-500/30 rounded mr-3 text-cyan-400 text-xs font-bold">✓</span>
                    Ejecución automática de propuestas
                  </li>
                  <li className="text-slate-300 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-cyan-500/30 rounded mr-3 text-cyan-400 text-xs font-bold">✓</span>
                    Gestión transparente de fondos
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-12 mt-6">
              {/* Información del Usuario */}
              {user && (
                <section className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Conectado como</p>
                      <p className="text-white font-mono text-lg mt-1">{user.address.substring(0, 10)}...{user.address.substring(user.address.length - 8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-sm font-medium">Saldo disponible</p>
                      <p className="text-2xl font-bold text-cyan-400">{parseFloat(user.balance).toFixed(4)} ETH</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Navegación de Pestañas - Mejorada */}
              <section className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 md:p-8 space-y-4 py-8 mt-8 mb-10">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Selecciona una acción</p>
                <div className="h-3" aria-hidden />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 py-4">
                  <button
                    onClick={() => setSelectedTab('proposals')}
                    className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      selectedTab === 'proposals'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Propuestas</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedTab('create')}
                    className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      selectedTab === 'create'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Crear Propuesta</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedTab('deposit')}
                    className={`group relative px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      selectedTab === 'deposit'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Depositar</span>
                    </div>
                  </button>
                </div>
                <div className="h-3" aria-hidden />
              </section>

              {/* Contenido Tab */}
              <section className="space-y-6 animate-in pt-12 mt-10">
                {selectedTab === 'proposals' && <ProposalList />}
                {selectedTab === 'create' && <ProposalForm />}
                {selectedTab === 'deposit' && <DepositForm />}
              </section>
          </div>
        </>
        )}
      </div>
    </main>
  );
}
