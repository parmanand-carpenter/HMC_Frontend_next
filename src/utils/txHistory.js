// =============================================================
//  Simple per-wallet transaction history (localStorage).
//
//  Saves each buy/sell the user makes THROUGH the dApp so they can see their
//  history with Etherscan links. Reliable and instant — no RPC/log-scan limits.
//  (For a full on-chain history beyond this device, users can open Etherscan.)
// =============================================================

const KEY = 'hmc_tx_history_v1';
const MAX = 50;

function loadAll() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function getTxHistory(account) {
  if (!account) return [];
  return loadAll()[account.toLowerCase()] || [];
}

export function addTxHistory(account, entry) {
  if (!account || typeof window === 'undefined') return;
  const all = loadAll();
  const key = account.toLowerCase();
  const list = all[key] || [];
  list.unshift({ ...entry, ts: Date.now() });
  all[key] = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    // notify any open history view to refresh
    window.dispatchEvent(new Event('hmc-tx-added'));
  } catch {
    /* storage full / unavailable */
  }
}
