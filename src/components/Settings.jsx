// Contract config bar: HMC address (with copy), payment-token dropdown,
// sell fee, and per-token sell liquidity ("what's available to receive").
import { useState } from 'react';
import { formatUnits } from 'ethers';
import { HMC_ADDRESS, PAYMENT_TOKENS, explorerAddress } from '../config/contracts.js';
import { shortAddress, formatNumber } from '../utils/format.js';

// Available liquidity for a token = balance the contract holds of it.
function liqOf(t) {
  if (t.reserveRaw === undefined || t.reserveRaw === null) return null;
  try {
    return formatNumber(Number(formatUnits(t.reserveRaw, t.decimals)), 2);
  } catch {
    return null;
  }
}

export default function Settings({ token, setToken, tokens = PAYMENT_TOKENS }) {
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
          {tokens.map((t) => {
            const liq = liqOf(t);
            return (
              <option key={t.address} value={t.address}>
                {t.symbol}{liq !== null ? ` · ${liq} available` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="settings-row">
        <span className="settings-label">Oracle</span>
        <span className="pill pill-on">Activated</span>
      </div>

      {/* Real-time liquidity available to receive, per token */}
      <div className="settings-row settings-liq-row">
        <span className="settings-label">Available to receive</span>
        <span className="liq-chips">
          {tokens.map((t) => {
            const liq = liqOf(t);
            const hasLiq = liq !== null && Number(t.reserveRaw) > 0;
            return (
              <span key={t.address} className={`liq-chip ${hasLiq ? 'liq-on' : 'liq-off'}`}>
                {t.symbol}: <strong>{liq !== null ? liq : '—'}</strong>
              </span>
            );
          })}
        </span>
      </div>
    </div>
  );
}
