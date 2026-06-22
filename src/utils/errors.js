// =============================================================
//  Turns raw wallet / contract errors into clear, human messages.
//  Covers: wallet rejection, gas estimation, slippage, reverts,
//  network errors, and the contract's own require() strings.
// =============================================================

export function parseError(err) {
  if (!err) return 'Something went wrong. Please try again.';

  // ethers v6 puts useful info in several places
  const code = err.code;
  const reason =
    err.reason ||
    err.shortMessage ||
    err.info?.error?.message ||
    err.error?.message ||
    err.data?.message ||
    err.message ||
    '';

  const text = String(reason).toLowerCase();

  // ---- Wallet rejection ----
  if (
    code === 'ACTION_REJECTED' ||
    code === 4001 ||
    text.includes('user rejected') ||
    text.includes('user denied')
  ) {
    return 'You rejected the request in your wallet.';
  }

  // ---- Network / connection ----
  if (code === 'NETWORK_ERROR' || text.includes('network') || text.includes('failed to fetch')) {
    return 'Network error. Check your connection and the selected network.';
  }

  // ---- Gas estimation / funds ----
  if (
    code === 'INSUFFICIENT_FUNDS' ||
    text.includes('insufficient funds') ||
    text.includes('gas required exceeds')
  ) {
    return 'Not enough ETH for gas, or the transaction would fail. Check your balance.';
  }
  if (code === 'UNPREDICTABLE_GAS_LIMIT' || text.includes('cannot estimate gas')) {
    return 'Could not estimate gas — the transaction would likely revert. Check your inputs.';
  }

  // ---- Contract-specific require() messages (friendly versions) ----
  const map = [
    ['slippage: cost exceeds maxspend', 'Price moved up beyond your slippage limit. Try again.'],
    ['slippage: payout below minreceive', 'Payout dropped below your slippage limit. Try again.'],
    ['reserve insufficient', 'The liquidity reserve cannot cover this sell right now. Try a smaller amount.'],
    ['insufficient liquidity in reserve', 'Not enough liquidity in the reserve for this sell.'],
    ['exceeds max sell per transaction', 'Amount exceeds the per-transaction sell limit.'],
    ['cooldown: wait 24h', 'You are in the cooldown period. Please wait before selling again.'],
    ['daily sell limit reached', 'You have reached your daily sell limit. Try again tomorrow.'],
    ['insufficient hmc balance', 'You do not have enough HMC for this.'],
    ['stablecoin not allowed', 'This payment token is not enabled on the contract.'],
    ['token not allowed', 'This token is not allowed in the current mode.'],
    ['exceeds total supply', 'Not enough HMC supply left for this purchase.'],
    ['contract is paused', 'The contract is currently paused by the owner.'],
    ['not owner', 'Only the contract owner can do this.'],
    ['allowance exceeded', 'Token allowance too low — approve a higher amount first.'],
    ['oracle price is stale', 'The price feed is stale. Please try again shortly.'],
  ];
  for (const [needle, friendly] of map) {
    if (text.includes(needle)) return friendly;
  }

  // ---- Fallback: surface the revert reason if we have one ----
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  return 'Transaction failed. Please try again.';
}
