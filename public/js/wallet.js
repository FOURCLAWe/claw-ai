// CLAW token contract address on BSC (replace after deployment)
const CLAW_CONTRACT = '0x0000000000000000000000000000000000000000';
const REQUIRED_BALANCE = 200000;
const BSC_CHAIN_ID = '0x38'; // 56

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

let provider = null;
let signer = null;
let userAddress = null;
let clawBalance = 0;

async function connectWallet() {
  if (!window.ethereum) {
    alert('Please install MetaMask or a Web3 wallet.');
    return;
  }

  try {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);

    // Switch to BSC
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }]
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BSC_CHAIN_ID,
            chainName: 'BNB Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
      }
    }

    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Update button
    const btn = document.getElementById('btn-connect');
    btn.textContent = shortAddr(userAddress);
    btn.classList.remove('bg-accent-500', 'hover:bg-accent-600');
    btn.classList.add('bg-dark-700', 'border', 'border-white/10');

    // Check CLAW balance
    await checkBalance();
  } catch (e) {
    console.error('Wallet connect error:', e);
  }
}

async function checkBalance() {
  if (CLAW_CONTRACT === '0x0000000000000000000000000000000000000000') {
    // Token not deployed yet, allow access for demo
    clawBalance = REQUIRED_BALANCE;
    showDashboard();
    return;
  }

  try {
    const contract = new ethers.Contract(CLAW_CONTRACT, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const raw = await contract.balanceOf(userAddress);
    clawBalance = parseFloat(ethers.utils.formatUnits(raw, decimals));

    if (clawBalance >= REQUIRED_BALANCE) {
      showDashboard();
    } else {
      showInsufficientModal();
    }
  } catch (e) {
    console.error('Balance check error:', e);
    // Fallback: allow access for demo
    clawBalance = REQUIRED_BALANCE;
    showDashboard();
  }
}

function showDashboard() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('wallet-addr').textContent = shortAddr(userAddress);
  document.getElementById('wallet-balance').textContent = formatNum(clawBalance) + ' CLAW';
}

function showInsufficientModal() {
  document.getElementById('modal-insufficient').classList.remove('hidden');
  document.getElementById('modal-balance').textContent = 'Your balance: ' + formatNum(clawBalance) + ' CLAW';
}

function closeModal() {
  document.getElementById('modal-insufficient').classList.add('hidden');
}

function shortAddr(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

// Listen for account/chain changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => location.reload());
  window.ethereum.on('chainChanged', () => location.reload());
}
