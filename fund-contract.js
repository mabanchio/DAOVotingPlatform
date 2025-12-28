const ethers = require('ethers');

const rpc = 'http://127.0.0.1:8545';
const provider = new ethers.JsonRpcProvider(rpc);
const privateKey = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const signer = new ethers.Wallet(privateKey, provider);
const contractAddress = '0x5b1869D9A4C187F2EAa108f3062412ecf0526b24';

const abi = [
  {
    "inputs": [],
    "name": "depositar",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const contract = new ethers.Contract(contractAddress, abi, signer);

async function fundContract() {
  try {
    console.log('📤 Depositando 0.1 ETH en el contrato...');
    const tx = await contract.depositar({ value: ethers.parseEther('0.1') });
    console.log('Hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Contrato cargado con 0.1 ETH');
    console.log('Bloque:', receipt.blockNumber);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fundContract();
