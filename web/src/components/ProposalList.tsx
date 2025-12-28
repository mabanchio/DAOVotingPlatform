'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getDAOContract } from '@/lib/web3';
import Notification, { useNotification } from './Notification';

interface Proposal {
  id: bigint;
  titulo: string;
  descripcion: string;
  creador: string;
  votosAFavor: bigint;
  votosEnContra: bigint;
  votosAbstencion: bigint;
  estado: number;
  ejecutada: boolean;
  fechaFinVotacion: bigint;
}

const VOTE_LABELS = ['Favor', 'Contra', 'Abstención'];

const getTimeRemaining = (fechaFin: bigint): string => {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(fechaFin);
  const diff = end - now;
  
  if (diff <= 0) return 'Finalizado';
  
  const horas = Math.floor(diff / 3600);
  const minutos = Math.floor((diff % 3600) / 60);
  const segundos = diff % 60;
  
  if (horas > 0) return `${horas}h ${minutos}m`;
  if (minutos > 0) return `${minutos}m ${segundos}s`;
  return `${segundos}s`;
};

export default function ProposalList() {
  const { notification, showSuccess, showError } = useNotification();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);
  const [userVotes, setUserVotes] = useState<Record<number, { votado: boolean; voto?: number }>>({});
  const [contractBalance, setContractBalance] = useState('0');
  const [userAddress, setUserAddress] = useState<string>('');
  const [gaslessMode, setGasslessMode] = useState(true);
  const [canceling, setCanceling] = useState<number | null>(null);
  
  // Estados para el modal de votación
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ proposalId: number; voteType: number } | null>(null);
  
  // Estados para el modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [activeTab, setActiveTab] = useState<'vigentes' | 'historial'>('vigentes');
  const [filtroFecha, setFiltroFecha] = useState<string>(''); // Filtro de fecha en historial
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>(''); // Filtro por título/descripción
  const [filtroNumero, setFiltroNumero] = useState<string>(''); // Filtro por número de propuesta

  // Detectar cambios de cuenta en MetaMask
  useEffect(() => {
    if ((window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', loadData);
      return () => {
        (window as any).ethereum?.removeListener('accountsChanged', loadData);
      };
    }
  }, []);

  // Cargar propuestas solo cuando cambia de tab (sin refresco automático)
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Obtener dirección del usuario
      if ((window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);
      }

      const contract = getDAOContract();
      
      // Obtener provider y saldo
      const ethProvider = new ethers.BrowserProvider((window as any).ethereum);
      const balance = await ethProvider.getBalance(
        process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''
      );
      setContractBalance(ethers.formatEther(balance));

      // Cargar propuestas
      const total = await contract.obtenerTotalPropuestas();
      console.log('Total de propuestas:', total.toString());
      const proposalsList: Proposal[] = [];
      const votesMap: Record<number, { votado: boolean; voto?: number }> = {};

      for (let i = 0; i < total; i++) {
        const prop = await contract.obtenerPropuesta(i);
        proposalsList.push({
          id: BigInt(i),
          titulo: prop.titulo,
          descripcion: prop.descripcion,
          creador: prop.creador,
          votosAFavor: prop.votosAFavor,
          votosEnContra: prop.votosEnContra,
          votosAbstencion: prop.votosAbstencion,
          estado: prop.estado,
          ejecutada: prop.ejecutada,
          fechaFinVotacion: prop.fechaFinVotacion,
        });

        // Verificar si el usuario ya votó y obtener tipo de voto
        if (userAddress) {
          try {
            const hasVoted = await contract.haVotado(i, userAddress);
            console.log(`Propuesta ${i}: ¿Ha votado ${userAddress}?`, hasVoted);
            if (hasVoted) {
              const voteType = await contract.obtenerTipoVoto(i, userAddress);
              console.log(`Propuesta ${i}: Tipo de voto:`, voteType);
              votesMap[i] = { votado: true, voto: voteType };
            } else {
              votesMap[i] = { votado: false };
            }
          } catch (error) {
            console.error(`Error verificando voto en propuesta ${i}:`, error);
            votesMap[i] = { votado: false };
          }
        }
      }

      setUserVotes(votesMap);
      setProposals(proposalsList);
      console.log('✅ Propuestas cargadas:', proposalsList.length);
      console.log('📊 userVotes actualizado:', votesMap);
    } catch (error) {
      console.error('❌ Error cargando propuestas:', error);
      console.error('Error al cargar propuestas:', error);
    } finally {
      setLoading(false);
    }
  };

  const isVotingActive = (proposal: Proposal): boolean => {
    if (Number(proposal.estado) !== 1) return false; // No está en votación
    const now = Math.floor(Date.now() / 1000);
    return now < Number(proposal.fechaFinVotacion);
  };

  const handleCancel = async (proposalId: number, creador: string) => {
    try {
      if (userAddress.toLowerCase() !== creador.toLowerCase()) {
        showError('Solo el creador de la propuesta puede cancelarla');
        return;
      }

      if (!window.confirm('¿Estás seguro de que deseas cancelar esta propuesta?')) {
        return;
      }

      setCanceling(proposalId);

      if (!(window as any).ethereum) {
        showError('MetaMask no está instalado');
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      const tx = await contract.cancelarPropuesta(proposalId);
      await tx.wait();

      await loadData();
      showSuccess('Propuesta cancelada exitosamente');
    } catch (error: any) {
      console.error('Error al cancelar:', error);
      showError(`Error: ${error.message || 'Error desconocido'}`);
    } finally {
      setCanceling(null);
    }
  };

  // Abre el modal de confirmación
  const openVoteConfirmation = async (proposalId: number, voteType: number) => {
    // Verificar doble votación ANTES de abrir el modal
    console.log('🔍 Verificando votación anterior:');
    console.log('Propuesta:', proposalId);
    console.log('userVotes[proposalId]:', userVotes[proposalId]);
    console.log('¿Ha votado?', userVotes[proposalId]?.votado);
    
    if (userVotes[proposalId]?.votado) {
      setErrorMessage(`❌ Ya has votado en propuesta #${proposalId}. Solo puedes votar una vez por propuesta.`);
      setShowErrorModal(true);
      return;
    }

    setPendingVote({ proposalId, voteType });
    setShowVoteModal(true);
  };

  const confirmVote = async () => {
    if (!pendingVote) return;

    // VALIDACIÓN CRÍTICA INMEDIATA: Verificar que NO ha votado ya ANTES de cualquier otra acción
    console.log('🔍 CONFIRMANDO VOTO:');
    console.log('userVotes state:', userVotes);
    console.log('Propuesta:', pendingVote.proposalId);
    console.log('¿Dice que ya votó?', userVotes[pendingVote.proposalId]?.votado);
    
    if (userVotes[pendingVote.proposalId]?.votado) {
      setShowVoteModal(false);
      setErrorMessage(`❌ Ya has votado en propuesta #${pendingVote.proposalId}. No se puede votar dos veces.`);
      setShowErrorModal(true);
      setPendingVote(null);
      return;
    }

    try {
      setVoting(pendingVote.proposalId);
      setShowVoteModal(false);

      if (!(window as any).ethereum) {
        setErrorMessage('MetaMask no está instalado');
        setShowErrorModal(true);
        setVoting(null);
        setPendingVote(null);
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const contract = getDAOContract(signer);

      // LOG DEBUG: Verificar estado antes de votar
      console.log('🔍 DEBUG VOTO:');
      console.log('Propuesta:', pendingVote.proposalId);
      console.log('Tipo voto:', pendingVote.voteType);
      console.log('Usuario:', userAddress);
      console.log('Modo gasless:', gaslessMode);
      console.log('¿Ya votó según estado local?', userVotes[pendingVote.proposalId]?.votado);

      // VERIFICACIÓN EN EL CONTRATO: Preguntar directamente si ya votó
      console.log('🔎 Verificando en el contrato si ya votó...');
      const haVotadoEnContrato = await contract.haVotado(pendingVote.proposalId, userAddress);
      console.log('¿Ha votado en contrato?', haVotadoEnContrato);
      
      if (haVotadoEnContrato) {
        setShowVoteModal(false);
        setErrorMessage(`❌ Ya has votado en propuesta #${pendingVote.proposalId}. El contrato registra tu voto.`);
        setShowErrorModal(true);
        setVoting(null);
        setPendingVote(null);
        // Actualizar estado local para futuras consultas
        setUserVotes(prev => ({
          ...prev,
          [pendingVote.proposalId]: { votado: true }
        }));
        return;
      }

      // VALIDACIÓN DE SALDOS ANTES DE CONTINUAR
      if (gaslessMode) {
        // Votación sin gas: solo verificar que el contrato tiene fondos para pagar el gas
        // NO se requiere depósito previo, el costo se descuenta del saldo del contrato
        const contractBalance = await provider.getBalance(
          process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || ''
        );
        console.log('Saldo del contrato:', ethers.formatEther(contractBalance), 'ETH');
        
        const VOTE_COST = ethers.parseEther('0.0001');
        if (contractBalance < VOTE_COST) {
          setErrorMessage(`❌ El contrato no tiene fondos suficientes (necesita ≥ 0.0001 ETH, tiene ${ethers.formatEther(contractBalance)} ETH). Contacta al administrador.`);
          setShowErrorModal(true);
          setVoting(null);
          setPendingVote(null);
          return;
        }
      } else {
        // Votación normal: verificar que la wallet tiene ETH para gas
        const walletBalance = await provider.getBalance(userAddress);
        if (walletBalance === 0n) {
          setErrorMessage('❌ Tu wallet no tiene ETH para pagar el gas de la votación.');
          setShowErrorModal(true);
          setVoting(null);
          setPendingVote(null);
          return;
        }
      }

      let tx;

      if (gaslessMode) {
        // Modo gasless: crear firma y enviar a través de votarGasless
        const message = `Voto en propuesta ${pendingVote.proposalId} tipo ${pendingVote.voteType}`;
        console.log('Mensaje a firmar:', message);
        const signature = await signer.signMessage(message);
        console.log('Firma obtenida:', signature.substring(0, 20) + '...');

        tx = await contract.votarGasless(
          userAddress,
          pendingVote.proposalId,
          pendingVote.voteType,
          signature
        );
      } else {
        // Modo normal: pagar gas directamente
        tx = await contract.votar(pendingVote.proposalId, pendingVote.voteType);
      }
      
      console.log('Transacción enviada:', tx.hash);
      
      // Esperar confirmación en blockchain ANTES de registrar
      const receipt = await tx.wait();
      
      if (receipt) {
        console.log('✅ Transacción confirmada en blockchain');
        // Voto confirmado en blockchain
        console.log('📝 Actualizando estado local de votación');
        setUserVotes(prev => {
          const updated = {
            ...prev,
            [pendingVote.proposalId]: { 
              votado: true, 
              voto: pendingVote.voteType 
            }
          };
          console.log('Nuevo userVotes:', updated);
          return updated;
        });
        
        // Recargar propuestas desde blockchain
        console.log('🔄 Recargando propuestas desde blockchain...');
        await loadData();
        
        setErrorMessage('✅ ¡Voto registrado exitosamente en la blockchain!');
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('❌ ERROR:', error);
      
      let mensajeError = '❌ Error desconocido';
      
      if (error.message?.includes('user rejected')) {
        mensajeError = '❌ Rechazaste la transacción en MetaMask.';
      } else if (error.reason) {
        mensajeError = `❌ ${error.reason}`;
      } else if (error.message) {
        mensajeError = `❌ ${error.message}`;
      }
      
      setErrorMessage(mensajeError);
      setShowErrorModal(true);
    } finally {
      setVoting(null);
      setPendingVote(null);
    }
  };

  // Propuestas vigentes (en votación y tiempo no expirado)
  const activeProposals = proposals.filter(p => isVotingActive(p));
  
  // Propuestas cerradas (todas excepto las en votación)
  const closedProposals = proposals.filter(p => !isVotingActive(p));

  const handleVote = async (proposalId: number, voteType: number) => {
    // Abre modal de confirmación en lugar de votar directamente
    await openVoteConfirmation(proposalId, voteType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin inline-flex items-center justify-center w-10 h-10 border-4 border-slate-700 border-t-cyan-400 rounded-full mb-4"></div>
          <p className="text-slate-400">Cargando propuestas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-10">
      {/* Información del Contrato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Fondos del Contrato</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{parseFloat(contractBalance).toFixed(4)} ETH</p>
          <p className="text-xs text-slate-500 mt-2">Para votar sin gas</p>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-5">
          <p className="text-slate-400 text-sm font-medium">Modo de Votación</p>
          <div className="mt-2 flex items-center space-x-3">
            <button
              onClick={() => setGasslessMode(true)}
              className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                gaslessMode
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sin Gas
            </button>
            <button
              onClick={() => setGasslessMode(false)}
              className={`flex-1 px-3 py-2 rounded-lg font-semibold transition-all ${
                !gaslessMode
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Normal
            </button>
          </div>
          {gaslessMode && (
            <p className="text-xs text-green-400 mt-2">✓ Los fondos del contrato pagan el gas</p>
          )}
        </div>
      </div>

      {/* Lista de Propuestas */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 border-b border-slate-700 pb-4 pt-3 items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="w-full h-3" aria-hidden />
            <button
              onClick={() => setActiveTab('vigentes')}
              className={`px-5 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'vigentes'
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Propuestas Vigentes
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-5 py-2 rounded-full font-semibold transition-all ${
                activeTab === 'historial'
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Historial de Votos
            </button>
            <div className="w-full h-3" aria-hidden />
          </div>
          {/* Botón de actualizar */}
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 rounded-full font-semibold transition-all flex items-center gap-2"
          >
            {loading ? '⟳ Actualizando...' : '⟳ Actualizar'}
          </button>
        </div>

        {activeTab === 'vigentes' ? (
          activeProposals.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
              <p className="text-slate-400 text-lg">No hay propuestas vigentes</p>
              <p className="text-slate-500 text-sm mt-2">Crea una para comenzar la votación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filtros en vigentes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de búsqueda */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    🔍 Buscar propuesta
                  </label>
                  <input
                    type="text"
                    placeholder="Por título o descripción..."
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {filtroBusqueda && (
                    <button
                      onClick={() => setFiltroBusqueda('')}
                      className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>

                {/* Filtro de número */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    # Número de propuesta
                  </label>
                  <input
                    type="number"
                    placeholder="Ej: 5"
                    value={filtroNumero}
                    onChange={(e) => setFiltroNumero(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {filtroNumero && (
                    <button
                      onClick={() => setFiltroNumero('')}
                      className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Limpiar número
                    </button>
                  )}
                </div>

                {/* Filtro de fecha */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    📅 Filtrar por fecha
                  </label>
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  {filtroFecha && (
                    <button
                      onClick={() => setFiltroFecha('')}
                      className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>
              </div>

              {/* Propuestas filtradas */}
              {activeProposals
                .filter(proposal => {
                  // Filtro de búsqueda
                  if (filtroBusqueda) {
                    const termino = filtroBusqueda.toLowerCase();
                    if (!(
                      proposal.titulo.toLowerCase().includes(termino) ||
                      proposal.descripcion.toLowerCase().includes(termino)
                    )) return false;
                  }
                  // Filtro de número
                  if (filtroNumero) {
                    if (Number(proposal.id) !== Number(filtroNumero)) return false;
                  }
                  // Filtro de fecha
                  if (filtroFecha) {
                    const propDate = new Date(Number(proposal.fechaFinVotacion) * 1000).toISOString().split('T')[0];
                    if (propDate !== filtroFecha) return false;
                  }
                  return true;
                })
                .length === 0 ? (
                <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                  <p className="text-slate-400 text-sm">No hay propuestas vigentes que coincidan con los filtros</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeProposals
                    .filter(proposal => {
                      // Filtro de búsqueda
                      if (filtroBusqueda) {
                        const termino = filtroBusqueda.toLowerCase();
                        if (!(
                          proposal.titulo.toLowerCase().includes(termino) ||
                          proposal.descripcion.toLowerCase().includes(termino)
                        )) return false;
                      }
                      // Filtro de número
                      if (filtroNumero) {
                        if (Number(proposal.id) !== Number(filtroNumero)) return false;
                      }
                      // Filtro de fecha
                      if (filtroFecha) {
                        const propDate = new Date(Number(proposal.fechaFinVotacion) * 1000).toISOString().split('T')[0];
                        if (propDate !== filtroFecha) return false;
                      }
                      return true;
                    })
                    .map((proposal) => (
                <div
                  key={`vigente-${Number(proposal.id)}`}
                  className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-slate-700/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{proposal.titulo}</h3>
                        <p className="text-slate-400 text-sm">Propuesta #{Number(proposal.id)}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2 ml-4 text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-blue-500/30 text-blue-300">
                          Votación Activa
                        </span>
                        <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/20 px-2 py-1 rounded">
                          ⏱ {getTimeRemaining(proposal.fechaFinVotacion)} restantes
                        </span>
                        {userAddress && userAddress.toLowerCase() === proposal.creador.toLowerCase() && (
                          <button
                            onClick={() => handleCancel(Number(proposal.id), proposal.creador)}
                            disabled={canceling === Number(proposal.id)}
                            className="text-xs font-semibold px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            {canceling === Number(proposal.id) ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-300">{proposal.descripcion}</p>
                  </div>

                  {/* Votos */}
                  <div className="px-6 py-4 bg-slate-900/30">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">A FAVOR</p>
                        <p className="text-2xl font-bold text-green-400">{Number(proposal.votosAFavor)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">EN CONTRA</p>
                        <p className="text-2xl font-bold text-red-400">{Number(proposal.votosEnContra)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-medium mb-2">ABSTENCIÓN</p>
                        <p className="text-2xl font-bold text-slate-400">{Number(proposal.votosAbstencion)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Votación */}
                  <div className="p-6 space-y-3">
                    <p className="text-sm text-slate-400 mb-4">Escoge tu opción y confirma tu voto</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((voteType) => (
                        <button
                          key={voteType}
                          onClick={() => handleVote(Number(proposal.id), voteType)}
                          disabled={voting === Number(proposal.id)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            voteType === 0
                              ? 'bg-green-500/30 hover:bg-green-500/50 text-green-300 border border-green-500/30'
                              : voteType === 1
                              ? 'bg-red-500/30 hover:bg-red-500/50 text-red-300 border border-red-500/30'
                              : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 border border-slate-600/30'
                          } disabled:opacity-50`}
                        >
                          {voting === Number(proposal.id) ? '...' : VOTE_LABELS[voteType]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                    ))}
                </div>
              )}
            </div>
          )
        ) : closedProposals.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-slate-400 text-lg">No hay propuestas cerradas</p>
            <p className="text-slate-500 text-sm mt-2">Las propuestas cerradas aparecerán aquí con su resumen de votos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filtros de búsqueda, número y fecha en historial */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro de búsqueda */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  🔍 Buscar propuesta
                </label>
                <input
                  type="text"
                  placeholder="Por título o descripción..."
                  value={filtroBusqueda}
                  onChange={(e) => setFiltroBusqueda(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {filtroBusqueda && (
                  <button
                    onClick={() => setFiltroBusqueda('')}
                    className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>

              {/* Filtro de número */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  # Número de propuesta
                </label>
                <input
                  type="number"
                  placeholder="Ej: 5"
                  value={filtroNumero}
                  onChange={(e) => setFiltroNumero(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {filtroNumero && (
                  <button
                    onClick={() => setFiltroNumero('')}
                    className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Limpiar número
                  </button>
                )}
              </div>

              {/* Filtro de fecha */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  📅 Filtrar por fecha
                </label>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
                {filtroFecha && (
                  <button
                    onClick={() => setFiltroFecha('')}
                    className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Limpiar filtro
                  </button>
                )}
              </div>
            </div>

            {/* Propuestas filtradas */}
            {closedProposals
              .filter(proposal => {
                // Filtro de búsqueda
                if (filtroBusqueda) {
                  const termino = filtroBusqueda.toLowerCase();
                  if (!(
                    proposal.titulo.toLowerCase().includes(termino) ||
                    proposal.descripcion.toLowerCase().includes(termino)
                  )) return false;
                }
                // Filtro de número
                if (filtroNumero) {
                  if (Number(proposal.id) !== Number(filtroNumero)) return false;
                }
                // Filtro de fecha
                if (filtroFecha) {
                  const propDate = new Date(Number(proposal.fechaFinVotacion) * 1000).toISOString().split('T')[0];
                  if (propDate !== filtroFecha) return false;
                }
                return true;
              })
              .length === 0 ? (
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 text-center">
                <p className="text-slate-400 text-sm">No hay propuestas cerradas que coincidan con los filtros</p>
              </div>
            ) : (
              <>
                {closedProposals
                  .filter(proposal => {
                    // Filtro de búsqueda
                    if (filtroBusqueda) {
                      const termino = filtroBusqueda.toLowerCase();
                      if (!(
                        proposal.titulo.toLowerCase().includes(termino) ||
                        proposal.descripcion.toLowerCase().includes(termino)
                      )) return false;
                    }
                    // Filtro de número
                    if (filtroNumero) {
                      if (Number(proposal.id) !== Number(filtroNumero)) return false;
                    }
                    // Filtro de fecha
                    if (filtroFecha) {
                      const propDate = new Date(Number(proposal.fechaFinVotacion) * 1000).toISOString().split('T')[0];
                      if (propDate !== filtroFecha) return false;
                    }
                    return true;
                  })
                  .map((proposal) => {
                    const voteRecord = userVotes[Number(proposal.id)];
                    const voteLabel = voteRecord?.voto !== undefined ? VOTE_LABELS[voteRecord.voto] : '—';
                    
                    // Determinar el resultado de la propuesta
                    let resultLabel = 'Rechazado';
                    let resultColor = 'bg-amber-500/20 text-amber-300';
                    
                    if (Number(proposal.votosAFavor) > Number(proposal.votosEnContra)) {
                      resultLabel = 'Favor';
                      resultColor = 'bg-green-500/20 text-green-300';
                    } else if (Number(proposal.votosEnContra) > Number(proposal.votosAFavor)) {
                      resultLabel = 'En Contra';
                      resultColor = 'bg-red-500/20 text-red-300';
                    }
                    
                    return (
                      <div key={`historial-${Number(proposal.id)}`} className="bg-slate-900/40 border border-slate-700 rounded-xl p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-400 text-sm">Propuesta #{Number(proposal.id)}</p>
                            <h3 className="text-lg font-semibold text-white">{proposal.titulo}</h3>
                          </div>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${resultColor}`}>
                            {resultLabel}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm mt-3">{proposal.descripcion}</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-400">
                    <div>
                      <p>A favor</p>
                      <p className="text-white font-semibold">{Number(proposal.votosAFavor)}</p>
                    </div>
                    <div>
                      <p>En contra</p>
                      <p className="text-white font-semibold">{Number(proposal.votosEnContra)}</p>
                    </div>
                    <div>
                      <p>Abstención</p>
                      <p className="text-white font-semibold">{Number(proposal.votosAbstencion)}</p>
                    </div>
                  </div>
                </div>
              );
                  })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de voto */}
      {showVoteModal && pendingVote && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md text-center space-y-5">
            <h3 className="text-xl font-semibold text-white">Confirma tu voto</h3>
            <p className="text-slate-300 text-sm">
              Estás a punto de votar <strong>{VOTE_LABELS[pendingVote.voteType]}</strong> en la propuesta #{pendingVote.proposalId}.
            </p>
            <p className="text-xs text-slate-500">
              El voto solo se registra cuando la transacción se confirme en la blockchain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmVote}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold rounded-lg"
              >
                Confirmar voto
              </button>
              <button
                onClick={() => {
                  setShowVoteModal(false);
                  setPendingVote(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-700 text-white font-semibold rounded-lg"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error/éxito */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50">
          <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border rounded-2xl p-6 w-full max-w-md text-center space-y-5 ${
            errorMessage.includes('exitosamente') ? 'border-emerald-700/50' : 'border-red-700/50'
          }`}>
            <h3 className={`text-xl font-semibold ${
              errorMessage.includes('exitosamente') ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {errorMessage.includes('exitosamente') ? '✓ Éxito' : '⚠️ Error'}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className={`w-full px-4 py-3 font-semibold rounded-lg transition-all ${
                errorMessage.includes('exitosamente') 
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600'
              }`}
            >
              {errorMessage.includes('exitosamente') ? 'Cerrar' : 'Entendido'}
            </button>
          </div>
        </div>
      )}
      
      {/* Notificación personalizada */}
      {notification && <Notification {...notification} />}
    </div>
  );
}
