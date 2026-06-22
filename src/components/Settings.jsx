// Contract config bar: HMC address (with copy), payment-token dropdown, oracle mode.
import { useState } from 'react';
import { HMC_ADDRESS, PAYMENT_TOKENS, explorerAddress } from '../config/contracts.js';
import { shortAddress } from '../utils/format.js';

export default function Settings({ token, setToken, tokens = PAYMENT_TOKENS, sellFeePercent = 0 }) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(HMC_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="settings card">
      <div className="settings-row">
        <span className="settings-label">HMC Contract</span>
        <span className="settings-addr">
          <a className="settings-value mono" href={explorerAddress(HMC_ADDRESS)} target="_blank" rel="noreferrer">
            {shortAddress(HMC_ADDRESS)} ↗
          </a>
          <button className="copy-btn" onClick={copyAddress} title="Copy contract address">
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </span>
      </div>

      <div className="settings-row">
        <span className="settings-label">Payment Token</span>
        <select
          className="token-select"
          value={token.address}
          onChange={(e) => {
            const next = tokens.find((t) => t.address === e.target.value);
            if (next) setToken(next);
          }}
        >
          {tokens.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="settings-row">
        <span className="settings-label">Sell Fee</span>
        <span className="pill pill-on">{sellFeePercent}%</span>
      </div>
    </div>
  );
}
