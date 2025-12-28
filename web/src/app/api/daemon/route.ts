import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getServerSigner, getDAOContract } from '@/lib/web3';

/**
 * GET /api/daemon/execute
 * Daemon que monitorea y ejecuta propuestas aprobadas automáticamente
 * 
 * Este endpoint debería ser llamado periódicamente por una tarea cron
 * Ej: cada 5 minutos
 */
export async function GET() {
  try {
    const signer = getServerSigner();
    const daoContract = getDAOContract(signer);

    // Obtener total de propuestas
    const totalProposals = await daoContract.obtenerTotalPropuestas();
    
    let executedCount = 0;
    const executionResults = [];

    // Iterar sobre todas las propuestas
    for (let i = 0; i < totalProposals; i++) {
      try {
        const proposal = await daoContract.obtenerPropuesta(i);

        // Verificar si es elegible para ejecutar
        // Estado 2 = Aprobada, no ejecutada, y tiempo de ejecución llegó
        if (
          proposal.estado === 2 &&
          !proposal.ejecutada &&
          BigInt(proposal.tiempoEjecucion) <= BigInt(Math.floor(Date.now() / 1000))
        ) {
          console.log(`Ejecutando propuesta ${i}: ${proposal.titulo}`);

          const tx = await daoContract.ejecutarPropuesta(i);
          const receipt = await tx.wait();

          if (receipt?.status === 1) {
            executedCount++;
            executionResults.push({
              proposalId: i,
              titulo: proposal.titulo,
              transactionHash: tx.hash,
              status: 'success',
            });
          }
        }
      } catch (error: any) {
        // Continuar con la siguiente propuesta si una falla
        console.error(`Error ejecutando propuesta ${i}:`, error.message);
        executionResults.push({
          proposalId: i,
          status: 'error',
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalProposals,
      executedCount,
      executionResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error en daemon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al ejecutar daemon',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/daemon/execute
 * Permite ejecutar manualmente el daemon
 */
export async function POST() {
  return GET();
}
