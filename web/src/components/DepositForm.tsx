'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getDAOContract, ethToWei } from '@/lib/web3';

export default function DepositForm() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!window.ethereum) {
        alert('MetaMask no está instalado');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        alert('Por favor ingresa una cantidad válida');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      const tx = await contract.depositar({
        value: ethToWei(amount)
      });

      await tx.wait();

      alert(`${amount} ETH depositados exitosamente`);
      setAmount('');
    } catch (error: any) {
      console.error('Error al depositar:', error);
      alert(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Depositar ETH</h2>

      <form onSubmit={handleDeposit} className="space-y-6">
        {/* Monto */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Cantidad (ETH)
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
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            <span className="absolute right-4 top-2.5 text-slate-400 font-semibold">ETH</span>
          </div>
        </div>

        {/* Atajos */}
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

        {/* Info */}
        <div className="bg-green-900/20 border border-green-500/50 rounded p-4 text-sm text-slate-300">
          <p className="font-semibold text-green-300 mb-2">✓ Beneficios del Depósito:</p>
          <ul className="space-y-1">
            <li>• Participar en votaciones</li>
            <li>• Crear nuevas propuestas (si alcanzas el 10% del total)</li>
            <li>• Compartir las ganancias de la DAO</li>
            <li>• Poder retirar tu dinero en cualquier momento</li>
          </ul>
        </div>

        {/* Botón de Depósito */}
        <button
          type="submit"
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
        >
          {loading ? 'Procesando...' : amount ? `Depositar ${amount} ETH` : 'Depositar'}
        </button>
      </form>
    </div>
  );
}
