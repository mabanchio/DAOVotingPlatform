'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getDAOContract } from '@/lib/web3';

export default function ProposalForm() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tiempoVotacion, setTiempoVotacion] = useState('86400'); // 1 día por defecto
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saldoRequerido, setSaldoRequerido] = useState<string>('...');
  const [saldoUsuario, setSaldoUsuario] = useState<string>('...');
  const [saldoContrato, setSaldoContrato] = useState<string>('...');
  
  // Estados para modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Cargar saldo requerido y del usuario
  useEffect(() => {
    const loadSaldos = async () => {
      try {
        if (!(window as any).ethereum) return;

        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contract = getDAOContract(signer);
        const userAddress = await signer.getAddress();

        // Obtener balance total del contrato
        const contractBalance = await provider.getBalance(
          process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''
        );
        setSaldoContrato(ethers.formatEther(contractBalance));
        const requerido = (contractBalance * BigInt(10)) / BigInt(1000);
        setSaldoRequerido(ethers.formatEther(requerido));

        // Obtener saldo del usuario (saldo actual después de votaciones sin gas)
        const usuario = await contract.obtenerSaldo(userAddress);
        setSaldoUsuario(ethers.formatEther(usuario));
      } catch (error) {
        console.error('Error cargando saldos:', error);
      }
    };

    const interval = setInterval(loadSaldos, 3000); // Actualizar cada 3 segundos
    loadSaldos();

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!(window as any).ethereum) {
        setErrorMessage('MetaMask no está instalado');
        setShowErrorModal(true);
        return;
      }

      if (!titulo.trim() || !descripcion.trim()) {
        setErrorMessage('Por favor completa todos los campos');
        setShowErrorModal(true);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);
      const userAddress = await signer.getAddress();

      // Obtener balance total del contrato
      const contractBalance = await provider.getBalance(
        process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''
      );
      const saldoRequerido = (contractBalance * BigInt(10)) / BigInt(1000);
      const saldoUsuario = await contract.obtenerSaldo(userAddress);

      console.log('📊 Verificación previa:');
      console.log(`  Usuario: ${userAddress}`);
      console.log(`  Saldo en DAO: ${ethers.formatEther(saldoUsuario)} ETH`);
      console.log(`  Requerido: ${ethers.formatEther(saldoRequerido)} ETH`);

      if (saldoUsuario < saldoRequerido) {
        setErrorMessage(
          `No tienes fondos suficientes para crear una propuesta.\n\n` +
          `Tienes: ${ethers.formatEther(saldoUsuario)} ETH\n` +
          `Se requiere: ${ethers.formatEther(saldoRequerido)} ETH\n\n` +
          `Debes hacer un depósito adicional de: ${ethers.formatEther(saldoRequerido - saldoUsuario)} ETH`
        );
        setShowErrorModal(true);
        return;
      }

      const tx = await contract.crearPropuesta(
        titulo,
        descripcion,
        parseInt(tiempoVotacion)
      );

      await tx.wait();

      setSuccess(true);
      setTitulo('');
      setDescripcion('');
      setTiempoVotacion('86400');
      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      console.error('Error al crear propuesta:', error);
      
      let mensajeError = error.message || 'Error desconocido';
      
      // Intentar extraer el mensaje del revert
      if (error.data) {
        console.error('Error data:', error.data);
      }
      if (error.reason) {
        mensajeError = error.reason;
      }
      
      setErrorMessage(mensajeError);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">Crear Nueva Propuesta</h2>

      {success && (
        <div className="bg-blue-900/30 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg mb-6">
          ✓ Propuesta creada con éxito
        </div>
      )}

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
        <div className="bg-blue-900/20 border border-blue-500/50 rounded p-4 text-sm text-slate-300 space-y-2">
          <p className="font-semibold text-blue-300">ℹ️ Requisitos y Estado:</p>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>• Fondos del Contrato:</span>
              <span className="text-green-300 font-semibold">{saldoContrato} ETH</span>
            </li>
            <li className="flex justify-between">
              <span>• Tu saldo en la DAO:</span>
              <span className="text-cyan-300 font-semibold">{saldoUsuario} ETH</span>
            </li>
            <li className="flex justify-between">
              <span>• Saldo requerido (10%):</span>
              <span className="text-cyan-300 font-semibold">{saldoRequerido} ETH</span>
            </li>
            <li>• La votación debe durar al menos 1 día</li>
            <li>• Se necesita mayoría simple para aprobar</li>
          </ul>
          {parseFloat(saldoUsuario) < parseFloat(saldoRequerido) && (
            <div className="bg-red-900/40 border border-red-500/50 rounded p-2 mt-3">
              <p className="text-red-300 text-xs font-semibold">
                ⚠️ Fondos insuficientes. Necesitas hacer un depósito adicional.
              </p>
            </div>
          )}
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

      {/* Modal de error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-red-700/50 rounded-2xl p-6 w-full max-w-md text-center space-y-5">
            <h3 className="text-xl font-semibold text-red-400">⚠️ Error</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
