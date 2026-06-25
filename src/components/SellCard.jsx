// SELL HMC: amount input, client-side return preview, sell-protection UI.
// The new contract removed previewSell(), so we compute the payout locally
// from the bonding curve + reserve multiplier + dynamic sell fee — exactly
// matching the on-chain math (utils/bondingCurve.js).
import { useState, useEffect } from 'react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext.jsx';
import { ABIS, HMC_ADDRESS, HMC_DECIMALS, SLIPPAGE_PERCENT } from '../config/contracts.js';
import { getReadProvider, waitForTx } from '../utils/contracts.js';
import { costUSD, usdToStable, usdToToken, reserveMultiplier, adjustedSellFee } from '../utils/bondingCurve.js';
import { addTxHistory } from '../utils/txHistory.js';
import { formatNumber, formatCountdown } from '../utils/format.js';
import { parseError } from '../utils/errors.js';

// Available liquidity for a token = balance the contract holds of it.
function liqOf(t) {
  if (t.reserveRaw === undefined || t.reserveRaw === null) return null;
  try {
    return formatNumber(Number(formatUnits(t.reserveRaw, t.decimals)), 2);
  } catch {
    return null;
  }
}

export default function SellCard({ token, data, tokens = [], refresh, setTx }) {
  const { signer, account, isConnected, connect, wrongNetwork } = useWallet();
  const [amount, setAmount] = useState('');
  const [returnToken, setReturnToken] = useState(null);
  const [payoutWei, setPayoutWei] = useState(0n);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  const amt = Number(amount);

  // Debounced client-side return preview.
  useEffect(() => {
    if (!amount || !isFinite(amt) || amt <= 0) {
      setReturnToken(null);
      setPayoutWei(0n);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        setPreviewing(true);
        const amountWei = parseUnits(amount, HMC_DECIMALS);
        if (amountWei > data.soldWei) {
          if (!cancelled) { setReturnToken(null); setPayoutWei(0n); }
          return;
        }
        // Contract decrements sold first: baseOut = cost(sold - amt, sold)
        const baseUSD = costUSD(data.soldWei - amountWei, data.soldWei);
        let baseOut;
        if (token.kind === 'oracle') {
          const provider = getReadProvider();
          const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, provider);
          baseOut = await usdToToken(provider, hmc, token.address, baseUSD, {
            isStable: false, decimals: token.decimals, feed: token.feed,
          });
        } else {
          baseOut = usdToStable(baseUSD, token.decimals);
        }
        const tokenOut = (baseOut * reserveMultiplier(data.reserveStrengthWei)) / 100n;
        const feeBase = BigInt(Math.round(data.sellFeePercent || 0));
        const adjFee = adjustedSellFee(feeBase, data.reserveStrengthWei);
        const fee = (tokenOut * adjFee) / 100n;
        const payout = tokenOut - fee;
        if (!cancelled) {
          setPayoutWei(payout);
          setReturnToken(Number(formatUnits(payout, token.decimals)));
        }
      } catch {
        if (!cancelled) { setReturnToken(null); setPayoutWei(0n); }
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [amount, token, amt, data.soldWei, data.reserveStrengthWei, data.sellFeePercent]);

  // ---- Sell-protection evaluation (drives the disabled state + reason) ----
  const nowSec = Math.floor(Date.now() / 1000);
  const cooldownLeft = data.nextSellTime > nowSec ? data.nextSellTime - nowSec : 0;
  const dailyRemaining = Math.max(0, data.dailyLimitHMC - data.dailySoldHMC);

  let blockReason = null;
  if (isConnected && amt > 0) {
    if (data.sellBlacklisted) blockReason = 'This wallet is restricted from selling.';
    else if (data.paused) blockReason = 'Trading is currently paused.';
    else if (amt > data.userHmcBalance) blockReason = 'You do not have enough HMC.';
    else if (amt > data.maxSellPerTxHMC)
      blockReason = `Exceeds per-transaction limit of ${formatNumber(data.maxSellPerTxHMC, 0)} HMC.`;
    else if (amt > data.maxSellPossibleHMC)
      blockReason = `Reserve too low right now — max ${formatNumber(data.maxSellPossibleHMC, 4)} HMC sellable.`;
    else if (cooldownLeft > 0)
      blockReason = `Cooldown active — you can sell again in ${formatCountdown(cooldownLeft)}.`;
    else if (amt > dailyRemaining)
      blockReason = `Daily sell limit — ${formatNumber(dailyRemaining, 0)} HMC remaining today.`;
  }

  const canSell =
    isConnected && !wrongNetwork && !busy && amt > 0 && returnToken !== null && !blockReason;

  async function handleSell() {
    if (!signer) return connect();
    try {
      setBusy(true);
      const amountWei = parseUnits(amount, HMC_DECIMALS);
      const minReceive = (payoutWei * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
      const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, signer);

      setTx({ status: 'pending', message: `Selling ${amount} HMC…` });
      const sellTx = await hmc.sell(amountWei, token.address, minReceive);
      setTx({ status: 'pending', hash: sellTx.hash, message: 'Waiting for confirmation…' });
      await waitForTx(sellTx.hash);

      addTxHistory(account, { type: 'Sell', hmc: amount, token: token.symbol, hash: sellTx.hash });
      setTx({ status: 'success', hash: sellTx.hash, message: `You sold ${amount} HMC.` });
      setAmount('');
      setReturnToken(null);
      refresh();
    } catch (e) {
      setTx({ status: 'error', message: parseError(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="trade-card">
      <div className="trade-card-head">
        <h3>Sell HMC</h3>
        <span className="muted">Balance: {formatNumber(data.userHmcBalance, 4)} HMC</span>
      </div>

      <label className="field-label">Amount of HMC</label>
      <div className="input-row">
        <input
          className="amount-input"
          type="number"
          min="0"
          placeholder="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="input-suffix">HMC</span>
      </div>

      <div className="preview-box">
        <span>Estimated return</span>
        <span className="preview-value gold">
          {previewing ? 'Calculating…' : returnToken !== null ? `${formatNumber(returnToken, 2)} ${token.symbol}` : '—'}
        </span>
      </div>

      {/* Real-time liquidity available to receive, per token */}
      <div className="sell-liq">
        <span className="sell-liq-label">Available to receive</span>
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

      {/* Protection limits, always visible so users know the rules */}
      <div className="limits">
        <div className="limit"><span>Max / tx</span><strong>{formatNumber(data.maxSellPerTxHMC, 0)} HMC</strong></div>
        <div className="limit"><span>Sellable now</span><strong>{formatNumber(data.maxSellPossibleHMC, 2)} HMC</strong></div>
        <div className="limit"><span>Daily left</span><strong>{formatNumber(dailyRemaining, 0)} HMC</strong></div>
        <div className="limit"><span>Cooldown</span><strong>{cooldownLeft > 0 ? formatCountdown(cooldownLeft) : 'ready'}</strong></div>
      </div>

      {blockReason && <p className="form-error">{blockReason}</p>}

      {!isConnected ? (
        <button className="btn btn-gold btn-block" onClick={connect}>Sell HMC</button>
      ) : wrongNetwork ? (
        <button className="btn btn-warn btn-block" disabled>Wrong network</button>
      ) : (
        <button className="btn btn-gold btn-block" onClick={handleSell} disabled={!canSell}>
          {busy ? 'Processing…' : 'Sell HMC'}
        </button>
      )}
      <p className="trade-hint">Sell fee: {data.sellFeePercent}% · Slippage tolerance: {SLIPPAGE_PERCENT}%</p>
    </div>
  );
}
