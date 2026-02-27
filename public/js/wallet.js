const BSC_CHAIN_ID = '0x38'; // 56

let provider = null;
let signer = null;
let userAddress = null;

function showWalletModal() {
  document.getElementById('modal-wallet').classList.remove('hidden');
}

function closeWalletModal() {
  document.getElementById('modal-wallet').classList.add('hidden');
}

async function connectWith(type) {
  closeWalletModal();
  let ethereum = null;

  if (type === 'metamask') {
    if (window.ethereum?.isMetaMask) {
      ethereum = window.ethereum;
    } else if (window.ethereum?.providers) {
      ethereum = window.ethereum.providers.find(p => p.isMetaMask);
    }
    if (!ethereum) { alert('MetaMask not detected. Please install MetaMask extension.'); return; }
  } else if (type === 'okx') {
    if (window.okxwallet) {
      ethereum = window.okxwallet;
    } else if (window.ethereum?.isOkxWallet) {
      ethereum = window.ethereum;
    } else if (window.ethereum?.providers) {
      ethereum = window.ethereum.providers.find(p => p.isOkxWallet);
    }
    if (!ethereum) { alert('OKX Wallet not detected. Please install OKX Wallet extension.'); return; }
  } else {
    ethereum = window.ethereum;
    if (!ethereum) { alert('No Web3 wallet detected. Please install MetaMask or OKX Wallet.'); return; }
  }

  try {
    provider = new ethers.providers.Web3Provider(ethereum);
    await provider.send('eth_requestAccounts', []);

    // Switch to BSC
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_CHAIN_ID }] });
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

    provider = new ethers.providers.Web3Provider(ethereum);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    // Update nav button
    const btn = document.getElementById('btn-connect');
    btn.textContent = shortAddr(userAddress);
    btn.onclick = null;
    btn.className = 'px-5 py-2 rounded-xl text-sm font-bold bg-anime-card border border-anime-glow/20 text-anime-glow';

    // Go to dashboard directly - no token check needed
    showDashboard();

    ethereum.on('accountsChanged', () => location.reload());
    ethereum.on('chainChanged', () => location.reload());
  } catch (e) {
    console.error('Wallet connect error:', e);
    alert('Failed to connect wallet: ' + (e.message || e));
  }
}

function connectWallet() { showWalletModal(); }

function showDashboard() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('wallet-addr').textContent = shortAddr(userAddress);
}

function shortAddr(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatNum(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}
