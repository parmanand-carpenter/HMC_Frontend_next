// =============================================================
//  Formatting helpers for on-chain values <-> human display.
// =============================================================

import { formatUnits, parseUnits } from 'ethers';

// Safe formatUnits that never throws on bad input.
export function fromUnits(value, decimals) {
  try {
    if (value === null || value === undefined) return '0';
    return formatUnits(value, decimals);
  } catch {
    return '0';
  }
}

// Safe parseUnits.
export function toUnits(value, decimals) {
  return parseUnits(String(value || '0'), decimals);
}

// Format a number with thousands separators and limited decimals.
export function formatNumber(value, maxDecimals = 4) {
  const n = Number(value);
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

// Format a USD amount (already a plain number) like "$1,234.56".
export function formatUSD(value, maxDecimals = 2) {
  const n = Number(value);
  if (!isFinite(n)) return '$0';
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: maxDecimals,
    })
  );
}

// Shorten an address: 0x1234...abcd
export function shortAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Seconds -> "2h 15m" style countdown.
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s === 0) return 'now';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
