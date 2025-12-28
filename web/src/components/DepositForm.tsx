'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getDAOContract, ethToWei } from '@/lib/web3';

export default function DepositForm() {
  const [amount, setAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [userBalance, setUserBalance] = useState('0');
  const [userRetirableBalance, setUserRetirableBalance] = useState('0');
  const [contractBalance, setContractBalance] = useState('0');

  // Detectar cambios de cuenta y hacer polling cada 3 segundos
  useEffect(() => {
    loadUserData();
    // Polling más frecuente (cada 3 segundos)
    const interval = setInterval(loadUserData, 3000);
    
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', loadUserData);
      return () => {
        (window as any).ethereum?.removeListener('accountsChanged', loadUserData);
        clearInterval(interval);
      };
    }
    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    try {
      if ((window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const contract = getDAOContract();
        const balance = await contract.obtenerSaldo(address);
        setUserBalance(ethers.formatEther(balance));
        
        // Obtener saldo retirable (cálculo equitativo)
        const retirableBalance = await contract.obtenerSaldoRetirable(address);
        setUserRetirableBalance(ethers.formatEther(retirableBalance));
        
        // Obtener saldo del contrato
        const contractBal = await provider.getBalance(
          process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''
        );
        setContractBalance(ethers.formatEther(contractBal));
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!(window as any).ethereum) {
        alert('MetaMask no está instalado');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      const tx = await contract.depositar({
        value: ethToWei(amount)
      });

      await tx.wait();

      setSuccess(true);
      setAmount('');
      loadUserData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error al depositar:', error);
      alert(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!(window as any).ethereum) {
        alert('MetaMask no está instalado');
        return;
      }

      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
      }

      const maxRetirable = parseFloat(userRetirableBalance);
      if (parseFloat(withdrawAmount) > maxRetirable) {
        alert(`No puedes retirar más de ${maxRetirable.toFixed(4)} ETH (saldo equitativo)`);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      // La nueva función retirar() no toma parámetros - retira TODO lo disponible equitativamente
      const tx = await contract.retirar();
      await tx.wait();

      setSuccess(true);
      setWithdrawAmount('');
      loadUserData();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error al retirar:', error);
      alert(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-6 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Gestionar Fondos</h2>
      </div>

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Operación completada exitosamente
        </div>
      )}

      {/* Panel de Saldos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
          <p className="text-slate-400 text-xs font-semibold">Tu Saldo Depositado</p>
          <p className="text-lg font-bold text-cyan-400 mt-1">{parseFloat(userBalance).toFixed(4)} ETH</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
          <p className="text-slate-400 text-xs font-semibold">Saldo Retirable (Equitativo)</p>
          <p className="text-lg font-bold text-green-400 mt-1">{parseFloat(userRetirableBalance).toFixed(4)} ETH</p>
        </div>
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4">
          <p className="text-slate-400 text-xs font-semibold">Saldo del Contrato</p>
          <p className="text-lg font-bold text-purple-400 mt-1">{parseFloat(contractBalance).toFixed(4)} ETH</p>
        </div>
      </div>
      <div className="flex space-x-4 mb-10 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 text-base ${
            activeTab === 'deposit'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Depositar
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 text-base ${
            activeTab === 'withdraw'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Retirar
        </button>
      </div>

      {/* Tab: Depositar */}
      {activeTab === 'deposit' && (
        <form onSubmit={handleDeposit} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Cantidad a Depositar (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.1"
                step="0.01"
                min="0"
                disabled={loading}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-semibold">ETH</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {['0.1', '0.5', '1', '5'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                disabled={loading}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {value}
              </button>
            ))}
          </div>

          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-semibold text-green-300 mb-2">✓ Beneficios:</p>
            <ul className="space-y-1 text-xs">
              <li>• Participar en votaciones</li>
              <li>• Crear propuestas</li>
              <li>• Poder retirar en cualquier momento</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
          >
            {loading ? 'Procesando...' : amount ? `Depositar ${amount} ETH` : 'Depositar ETH'}
          </button>
        </form>
      )}

      {/* Tab: Retirar */}
      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdraw} className="space-y-8">
          {parseFloat(userRetirableBalance) > 0 ? (
            <>
              {/* Información de Saldos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <p className="text-slate-400 text-xs font-medium">Saldo Depositado</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-2">{parseFloat(userBalance).toFixed(4)}</p>
                  <p className="text-xs text-slate-500 mt-2">Tu contribución total</p>
                </div>
                <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4">
                  <p className="text-emerald-300 text-xs font-medium">Puedes Retirar</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">{parseFloat(userRetirableBalance).toFixed(4)}</p>
                  <p className="text-xs text-emerald-200 mt-2">Saldo equitativo disponible</p>
                </div>
              </div>

              {/* Info sobre el cálculo */}
              {parseFloat(userBalance) > parseFloat(userRetirableBalance) && (
                <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4 text-sm text-blue-200">
                  <p className="font-semibold text-blue-300 mb-2">💡 ¿Por qué no puedo retirar todo?</p>
                  <p className="text-xs">
                    Se divide equitativamente entre todos los depositantes. Tu retiro: 
                    <br />({parseFloat(userBalance).toFixed(4)} / Total Depositado) × Fondos del Contrato
                  </p>
                </div>
              )}

              {/* Input de cantidad */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Cantidad a Retirar (ETH)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    min="0"
                    max={parseFloat(userRetirableBalance)}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-semibold">ETH</span>
                </div>
              </div>

              {/* Botones de atajo */}
              <div className="grid grid-cols-3 gap-3">
                {['25%', '50%', '100%'].map((percent) => {
                  const value = parseFloat(userRetirableBalance) * (parseFloat(percent) / 100);
                  return (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => setWithdrawAmount(value.toString())}
                      disabled={loading}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors border border-slate-600"
                    >
                      {percent === '100%' ? '100% (Todo)' : percent}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={loading || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 text-white rounded-lg font-bold text-lg transition-all shadow-lg"
              >
                {loading ? 'Procesando...' : withdrawAmount ? `Retirar ${withdrawAmount} ETH` : 'Retirar ETH'}
              </button>
            </>
          ) : (
            <div className="bg-slate-700/50 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400 font-semibold">No tienes fondos para retirar</p>
              <p className="text-slate-500 text-sm mt-2">Realiza un depósito primero</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
