// =============================================================
//  Multi-wallet discovery (EIP-6963) + legacy fallback.
//  Lets the dApp list every installed wallet (MetaMask, Trust,
//  Coinbase, …) so the user can pick which one to connect.
// =============================================================

// uuid -> { info: {uuid, name, icon, rdns}, provider }
const discovered = new Map();
let listeners = [];

function notify() {
  const list = getDiscoveredWallets();
  listeners.forEach((l) => l(list));
}

if (typeof window !== 'undefined') {
  window.addEventListener('eip6963:announceProvider', (event) => {
    const detail = event.detail;
    if (detail?.info?.uuid) {
      discovered.set(detail.info.uuid, detail);
      notify();
    }
  });
  // Ask all wallets to announce themselves.
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

// Legacy fallback: build pseudo-entries from window.ethereum when a
// wallet doesn't support EIP-6963.
function legacyWallets() {
  if (typeof window === 'undefined' || !window.ethereum) return [];
  const eth = window.ethereum;
  const list = Array.isArray(eth.providers) && eth.providers.length ? eth.providers : [eth];
  return list.map((p, i) => ({
    info: {
      uuid: `legacy-${i}`,
      name: p.isMetaMask
        ? 'MetaMask'
        : p.isTrust || p.isTrustWallet
        ? 'Trust Wallet'
        : p.isCoinbaseWallet
        ? 'Coinbase Wallet'
        : 'Injected Wallet',
      icon: '',
      rdns: 'legacy',
    },
    provider: p,
  }));
}

export function getDiscoveredWallets() {
  const eip6963 = Array.from(discovered.values());
  if (eip6963.length) return eip6963;
  return legacyWallets();
}

export function subscribeWallets(cb) {
  listeners.push(cb);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }
  cb(getDiscoveredWallets());
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

// Convenience: find MetaMask among discovered wallets (or null).
export function findMetaMask() {
  const wallets = getDiscoveredWallets();
  return (
    wallets.find((w) => /metamask/i.test(w.info.name)) ||
    wallets.find((w) => w.provider?.isMetaMask) ||
    null
  );
}

export function hasMetaMaskInstalled() {
  return !!findMetaMask();
}

// True on phones/tablets (used to tailor the wallet chooser copy).
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
}
