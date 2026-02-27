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

function showWalletModal() {
  document.getElementById('modal-wallet').classList.remove('hidden');
}

function closeWalletModal() {
  document.getElementById('modal-wallet').classList.add('hidden');
}

function closeInsufficientModal() {
  document.getElementById('modal-insufficient').classList.add('hidden');
}

async function connectWith(type) {
  closeWalletModal();
  let ethereum = null;

  if (type === 'metamask') {
    // MetaMask injects window.ethereum
    if (window.ethereum?.isMetaMask) {
      ethereum = window.ethereum;
    } else if (window.ethereum?.providers) {
      ethereum = window.ethereum.providers.find(p => p.isMetaMask);
    }
    if (!ethereum) {
      alert('MetaMask not detected. Please install MetaMask extension.');
      return;
    }
  } else if (type === 'okx') {
    // OKX Wallet injects window.okxwallet
    if (window.okxwallet) {
      ethereum = window.okxwallet;
    } else if (window.ethereum?.isOkxWallet) {
      ethereum = window.ethereum;
    } else if (window.ethereum?.providers) {
      ethereum = window.ethereum.providers.find(p => p.isOkxWallet);
    }
    if (!ethereum) {
      alert('OKX Wallet not detected. Please install OKX Wallet extension.');
      return;
    }
  } else {
    // Any wallet - use default window.ethereum
    ethereum = window.ethereum;
    if (!ethereum) {
      alert('No Web3 wallet detected. Please install MetaMask or OKX Wallet.');
      return;
    }
  }

  try {
    provider = new ethers.providers.Web3Provider(ethereum);
    await provider.send('eth_requestAccounts', []);

    // Switch to BSC
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BSC_CHAIN_ID }]
      });
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await ethereum.request({
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

    // Re-init provider after chain switch
    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Update nav button
    const btn = document.getElementById('btn-connect');
    btn.textContent = shortAddr(userAddress);
    btn.onclick = null;
    btn.classList.remove('from-accent-500', 'to-purple-500');
    btn.classList.add('bg-dark-700', 'border', 'border-white/10');

    // Check CLAW balance
    await checkBalance();

    // Listen for changes
    ethereum.on('accountsChanged', () => location.reload());
    ethereum.on('chainChanged', () => location.reload());
  } catch (e) {
    console.error('Wallet connect error:', e);
    alert('Failed to connect wallet: ' + (e.message || e));
  }
}

// Legacy function for backward compat
async function connectWallet() {
  showWalletModal();
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
  document.getElementById('wallet-balance').textContent = formatNum(clawBalance) + ' FCLAW';
}

function showInsufficientModal() {
  document.getElementById('modal-insufficient').classList.remove('hidden');
  document.getElementById('modal-balance').textContent = 'Your balance: ' + formatNum(clawBalance) + ' FCLAW';
}

function shortAddr(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}
