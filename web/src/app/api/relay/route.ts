import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getServerSigner, getForwarderContract, getDAOContract } from '@/lib/web3';

/**
 * POST /api/relay
 * Endpoint del relayer para procesar meta-transacciones sin gas
 * 
 * Recibe:
 * {
 *   req: ForwardRequest,
 *   signature: string
 * }
 * 
 * Retorna:
 * {
 *   transactionHash: string,
 *   success: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { req, signature } = await request.json();

    // Validar que los datos sean válidos
    if (!req || !signature) {
      return NextResponse.json(
        { error: 'Solicitud mal formada' },
        { status: 400 }
      );
    }

    // Obtener el signer del servidor (relayer)
    const relayer = getServerSigner();
    
    // Obtener el contrato del forwarder
    const forwarder = getForwarderContract(relayer);

    // Enviar la meta-transacción
    // El forwarder validará la firma y reenviará la llamada al contrato DAO
    const tx = await forwarder.execute(req, signature, {
      gasLimit: req.gas,
    });

    const receipt = await tx.wait();

    return NextResponse.json({
      transactionHash: tx.hash,
      success: receipt?.status === 1,
      blockNumber: receipt?.blockNumber,
    });
  } catch (error: any) {
    console.error('Error en relayer:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la meta-transacción',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/relay/nonce/:address
 * Obtiene el nonce actual para una dirección
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    // Validar que sea una dirección válida
    if (!ethers.isAddress(address)) {
      return NextResponse.json(
        { error: 'Dirección inválida' },
        { status: 400 }
      );
    }

    const forwarder = getForwarderContract();
    const nonce = await forwarder.getNonce(address);

    return NextResponse.json({
      address,
      nonce: nonce.toString(),
    });
  } catch (error: any) {
    console.error('Error obteniendo nonce:', error);
    return NextResponse.json(
      { error: 'Error al obtener nonce' },
      { status: 500 }
    );
  }
}
