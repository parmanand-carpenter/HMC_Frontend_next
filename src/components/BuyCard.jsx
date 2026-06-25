// BUY HMC: amount input, client-side cost preview, approve + execute.
// The new contract removed previewBuy(), so we compute the cost from the
// bonding curve locally (utils/bondingCurve.js) — exact same math as on-chain.
import { useState, useEffect } from 'react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext.jsx';
import { ABIS, HMC_ADDRESS, HMC_DECIMALS, SLIPPAGE_PERCENT } from '../config/contracts.js';
import { getReadProvider, waitForTx } from '../utils/contracts.js';
import { costUSD, usdToStable, usdToToken } from '../utils/bondingCurve.js';
import { addTxHistory } from '../utils/txHistory.js';
import { formatNumber } from '../utils/format.js';
import { parseError } from '../utils/errors.js';

export default function BuyCard({ token, data, refresh, setTx }) {
  const { signer, account, isConnected, connect, wrongNetwork } = useWallet();
  const [amount, setAmount] = useState('');
  const [costToken, setCostToken] = useState(null); // human number in token units
  const [costWei, setCostWei] = useState(0n);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);

  const amt = Number(amount);

  // Debounced client-side cost preview.
  useEffect(() => {
    if (!amount || !isFinite(amt) || amt <= 0) {
      setCostToken(null);
      setCostWei(0n);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        setPreviewing(true);
        const amountWei = parseUnits(amount, HMC_DECIMALS);
        const usd = costUSD(data.soldWei, data.soldWei + amountWei); // 6dp USD
        let tokenCost;
        if (token.kind === 'oracle') {
          const provider = getReadProvider();
          const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, provider);
          tokenCost = await usdToToken(provider, hmc, token.address, usd, {
            isStable: false,
            decimals: token.decimals,
            feed: token.feed,
          });
        } else {
          tokenCost = usdToStable(usd, token.decimals);
        }
        if (!cancelled) {
          setCostWei(tokenCost);
          setCostToken(Number(formatUnits(tokenCost, token.decimals)));
        }
      } catch {
        if (!cancelled) {
          setCostToken(null);
          setCostWei(0n);
        }
      } finally {
        if (!cancelled) setPreviewing(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [amount, token, amt, data.soldWei]);

  // ---- Buy-limit / blacklist evaluation ----
  const dailyBuyRemaining = Math.max(0, data.dailyBuyLimitHMC - data.dailyBoughtHMC);
  let blockReason = null;
  if (isConnected && amt > 0) {
    if (data.buyBlacklisted) blockReason = 'This wallet is restricted from buying.';
    else if (data.paused) blockReason = 'Trading is currently paused.';
    else if (amt > data.maxBuyPerTxHMC)
      blockReason = `Exceeds per-transaction buy limit of ${formatNumber(data.maxBuyPerTxHMC, 0)} HMC.`;
    else if (amt > dailyBuyRemaining)
      blockReason = `Daily buy limit — ${formatNumber(dailyBuyRemaining, 0)} HMC remaining today.`;
  }

  const canBuy = isConnected && !wrongNetwork && !busy && amt > 0 && costToken !== null && !blockReason;

  async function handleBuy() {
    if (!signer) return connect();
    try {
      setBusy(true);
      const amountWei = parseUnits(amount, HMC_DECIMALS);
      // maxSpend = preview cost + slippage buffer
      const maxSpend = (costWei * BigInt(100 + SLIPPAGE_PERCENT)) / 100n;

      const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, signer);

      // 1) Approve if needed
      const tokenContract = new Contract(token.address, token.abi || ABIS.USDT, signer);
      if (data.userAllowance < maxSpend) {
        setTx({ status: 'pending', message: `Approving ${token.symbol} spending…` });
        const approveTx = await tokenContract.approve(HMC_ADDRESS, maxSpend);
        await waitForTx(approveTx.hash);
      }

      // 2) Buy
      setTx({ status: 'pending', message: `Buying ${amount} HMC…` });
      const buyTx = await hmc.buy(amountWei, token.address, maxSpend);
      setTx({ status: 'pending', hash: buyTx.hash, message: 'Waiting for confirmation…' });
      await waitForTx(buyTx.hash);

      addTxHistory(account, { type: 'Buy', hmc: amount, token: token.symbol, hash: buyTx.hash });
      setTx({ status: 'success', hash: buyTx.hash, message: `You bought ${amount} HMC.` });
      setAmount('');
      setCostToken(null);
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
        <h3>Buy HMC</h3>
        <span className="muted">Balance: {formatNumber(data.userTokenBalance, 2)} {token.symbol}</span>
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
        <span>Estimated cost</span>
        <span className="preview-value gold">
          {previewing ? 'Calculating…' : costToken !== null ? `${formatNumber(costToken, 2)} ${token.symbol}` : '—'}
        </span>
      </div>

      {/* Buy limits, always visible */}
      <div className="limits">
        <div className="limit"><span>Max / tx</span><strong>{formatNumber(data.maxBuyPerTxHMC, 0)} HMC</strong></div>
        <div className="limit"><span>Daily left</span><strong>{formatNumber(dailyBuyRemaining, 0)} HMC</strong></div>
      </div>

      {blockReason && <p className="form-error">{blockReason}</p>}

      {!isConnected ? (
        <button className="btn btn-gold btn-block" onClick={connect}>Buy HMC</button>
      ) : wrongNetwork ? (
        <button className="btn btn-warn btn-block" disabled>Wrong network</button>
      ) : (
        <button className="btn btn-gold btn-block" onClick={handleBuy} disabled={!canBuy}>
          {busy ? 'Processing…' : 'Buy (Approve + Execute)'}
        </button>
      )}
      <p className="trade-hint">Slippage tolerance: {SLIPPAGE_PERCENT}%</p>
    </div>
  );
}
