// Wallet chooser — lists installed browser wallets (EIP-6963) plus a
// "Mobile Wallet (WalletConnect)" option that deep-links to wallet apps.
import { useWallet } from '../context/WalletContext.jsx';
import { isMobileDevice } from '../utils/provider.js';

export default function WalletModal({ open, onClose }) {
  const { wallets, connectWith, connectWalletConnect } = useWallet();
  if (!open) return null;

  const handlePick = async (w) => {
    await connectWith(w.provider);
    onClose();
  };

  const handleWalletConnect = async () => {
    onClose();
    await connectWalletConnect();
  };

  const mobile = isMobileDevice();

  return (
    <div className="tx-overlay" onClick={onClose}>
      <div className="tx-modal wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tx-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="tx-title">Connect a Wallet</h3>

        <div className="wallet-list">
          {/* Installed browser wallets (desktop extensions / in-app browsers) */}
          {wallets.map((w) => (
            <button key={w.info.uuid} className="wallet-option" onClick={() => handlePick(w)}>
              {w.info.icon ? (
                <img src={w.info.icon} alt="" className="wallet-icon" />
              ) : (
                <span className="wallet-icon wallet-icon-fallback">{w.info.name[0]}</span>
              )}
              <span className="wallet-name">{w.info.name}</span>
            </button>
          ))}

          {/* WalletConnect — opens a chooser that deep-links to mobile apps */}
          <button className="wallet-option wallet-wc" onClick={handleWalletConnect}>
            <span className="wallet-icon wallet-icon-wc">⛓</span>
            <span className="wallet-name">
              {mobile ? 'Mobile Wallet (MetaMask, Trust…)' : 'WalletConnect / Mobile Wallet'}
            </span>
          </button>
        </div>

        {wallets.length === 0 && !mobile && (
          <p className="muted wallet-hint">
            No browser wallet detected. Install{' '}
            <a className="gold" href="https://metamask.io/download/" target="_blank" rel="noreferrer">MetaMask</a>{' '}
            or use WalletConnect above.
          </p>
        )}
      </div>
    </div>
  );
}
