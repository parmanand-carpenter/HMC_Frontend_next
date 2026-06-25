// Transaction history — the user's buy/sell actions made through the dApp,
// with links to Etherscan. Stored locally per wallet (see utils/txHistory.js).
import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext.jsx';
import { getTxHistory } from '../utils/txHistory.js';
import { explorerTx, explorerAddress } from '../config/contracts.js';

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function TransactionHistory() {
  const { account, isConnected } = useWallet();
  const [list, setList] = useState([]);

  useEffect(() => {
    const reload = () => setList(getTxHistory(account));
    reload();
    window.addEventListener('hmc-tx-added', reload);
    return () => window.removeEventListener('hmc-tx-added', reload);
  }, [account]);

  if (!isConnected) return null;

  return (
    <div className="tx-history card">
      <div className="tx-history-head">
        <h3>Transaction History</h3>
        {account && (
          <a href={explorerAddress(account)} target="_blank" rel="noreferrer" className="tx-history-all">
            View all on Etherscan ↗
          </a>
        )}
      </div>

      {list.length === 0 ? (
        <p className="muted tx-history-empty">No transactions yet. Your buys and sells will appear here.</p>
      ) : (
        <ul className="tx-list">
          {list.map((t) => (
            <li key={t.hash} className="tx-row">
              <span className={`tx-type tx-${t.type.toLowerCase()}`}>{t.type}</span>
              <span className="tx-amount">{t.hmc} HMC · {t.token}</span>
              <span className="tx-time">{timeAgo(t.ts)}</span>
              <a href={explorerTx(t.hash)} target="_blank" rel="noreferrer" className="tx-link">View ↗</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
