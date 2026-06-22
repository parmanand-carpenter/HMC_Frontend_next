// Transaction status toast/modal: pending / success / failed + Etherscan link.
import { explorerTx } from '../config/contracts.js';

export default function TransactionStatus({ tx, onClose }) {
  if (!tx) return null;

  const { status, hash, message } = tx;

  return (
    <div className="tx-overlay" onClick={onClose}>
      <div className={`tx-modal tx-${status}`} onClick={(e) => e.stopPropagation()}>
        <button className="tx-close" onClick={onClose} aria-label="Close">×</button>

        <div className="tx-icon">
          {status === 'pending' && <span className="spinner" />}
          {status === 'success' && <span className="tx-check">✓</span>}
          {status === 'error' && <span className="tx-cross">!</span>}
        </div>

        <h3 className="tx-title">
          {status === 'pending' && 'Transaction Pending'}
          {status === 'success' && 'Transaction Successful'}
          {status === 'error' && 'Transaction Failed'}
        </h3>

        <p className="tx-message">{message}</p>

        {hash && (
          <a className="btn btn-outline" href={explorerTx(hash)} target="_blank" rel="noreferrer">
            View on Etherscan ↗
          </a>
        )}

        {status !== 'pending' && (
          <button className="btn btn-gold" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
