'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getDAOContract } from '@/lib/web3';

export default function ProposalForm() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempoVotacion, setTiempoVotacion] = useState('86400'); // 1 día por defecto
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!window.ethereum) {
        alert('MetaMask no está instalado');
        return;
      }

      if (!titulo.trim() || !descripcion.trim()) {
        alert('Por favor completa todos los campos');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      const tx = await contract.crearPropuesta(
        titulo,
        descripcion,
        parseInt(tiempoVotacion)
      );

      await tx.wait();

      alert('Propuesta creada exitosamente');
      setTitulo('');
      setDescripcion('');
      setTiempoVotacion('86400');
    } catch (error: any) {
      console.error('Error al crear propuesta:', error);
      alert(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Crear Nueva Propuesta</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Título de la Propuesta
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Aumentar fondo de desarrollo"
            maxLength={100}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          <p className="text-xs text-slate-400 mt-1">{titulo.length}/100 caracteres</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Explica el propósito y detalles de la propuesta..."
            maxLength={500}
            rows={5}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{descripcion.length}/500 caracteres</p>
        </div>

        {/* Tiempo de Votación */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Tiempo de Votación (segundos)
          </label>
          <select
            value={tiempoVotacion}
            onChange={(e) => setTiempoVotacion(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          >
            <option value="3600">1 Hora</option>
            <option value="43200">12 Horas</option>
            <option value="86400">1 Día</option>
            <option value="604800">7 Días</option>
          </select>
        </div>

        {/* Info */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded p-4 text-sm text-slate-300">
          <p className="font-semibold text-blue-300 mb-2">ℹ️ Requisitos:</p>
          <ul className="space-y-1">
            <li>• Debes tener al menos el 10% del saldo total de la DAO</li>
            <li>• La votación debe durar al menos 1 hora</li>
            <li>• Se necesita mayoría simple para aprobar</li>
          </ul>
        </div>

        {/* Botón de Envío */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
        >
          {loading ? 'Creando Propuesta...' : 'Crear Propuesta'}
        </button>
      </form>
    </div>
  );
}
