'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getDAOContract } from '@/lib/web3';

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

interface ProposalListProps {
  userAddress?: string;
}

const PROPOSAL_STATES = ['Pendiente', 'Votación', 'Aprobada', 'Rechazada', 'Ejecutada', 'Cancelada'];
const VOTE_TYPES = ['Favor', 'Contra', 'Abstención'];

export default function ProposalList({ userAddress }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      const contract = getDAOContract();
      
      const total = await contract.obtenerTotalPropuestas();
      const proposalsList: Proposal[] = [];

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
      }

      setProposals(proposalsList);
    } catch (error) {
      console.error('Error cargando propuestas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: bigint, voteType: number) => {
    try {
      setVoting(Number(proposalId));
      
      if (!window.ethereum) {
        alert('MetaMask no está instalado');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getDAOContract(signer);

      // Aquí se haría la llamada al relayer para obtener la meta-transacción
      // Por ahora, lo hacemos directamente
      const tx = await contract.votar(proposalId, voteType);
      await tx.wait();

      alert('Voto emitido exitosamente');
      loadProposals();
    } catch (error) {
      console.error('Error al votar:', error);
      alert('Error al emitir el voto');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-cyan-500 rounded-full"></div>
        </div>
        <p className="text-slate-400 mt-2">Cargando propuestas...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-800 border border-slate-700 rounded-lg">
        <p className="text-slate-400">No hay propuestas aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={Number(proposal.id)} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{proposal.titulo}</h3>
              <p className="text-slate-400 text-sm">por {proposal.creador.substring(0, 6)}...{proposal.creador.substring(proposal.creador.length - 4)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              proposal.estado === 1 ? 'bg-blue-900 text-blue-300' :
              proposal.estado === 2 ? 'bg-green-900 text-green-300' :
              proposal.estado === 3 ? 'bg-red-900 text-red-300' :
              'bg-slate-700 text-slate-300'
            }`}>
              {PROPOSAL_STATES[proposal.estado]}
            </span>
          </div>

          <p className="text-slate-300 mb-4">{proposal.descripcion}</p>

          {/* Resultados de votación */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-sm">A Favor</p>
              <p className="text-lg font-semibold text-green-400">{Number(proposal.votosAFavor)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">En Contra</p>
              <p className="text-lg font-semibold text-red-400">{Number(proposal.votosEnContra)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Abstención</p>
              <p className="text-lg font-semibold text-yellow-400">{Number(proposal.votosAbstencion)}</p>
            </div>
          </div>

          {/* Botones de votación */}
          {proposal.estado === 1 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleVote(proposal.id, 0)}
                disabled={voting === Number(proposal.id)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
              >
                {voting === Number(proposal.id) ? 'Votando...' : 'Votar A Favor'}
              </button>
              <button
                onClick={() => handleVote(proposal.id, 1)}
                disabled={voting === Number(proposal.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
              >
                {voting === Number(proposal.id) ? 'Votando...' : 'Votar En Contra'}
              </button>
              <button
                onClick={() => handleVote(proposal.id, 2)}
                disabled={voting === Number(proposal.id)}
                className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
              >
                {voting === Number(proposal.id) ? 'Votando...' : 'Abstenerse'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
