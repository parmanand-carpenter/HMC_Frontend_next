// Owner-only admin dashboard (hidden /admin route).
// Contract monitoring + management: pause, oracle, tokens, price feeds,
// liquidity top-up, limits, and surplus withdrawal.
import { useState } from 'react';
import { Contract, parseUnits, formatUnits } from 'ethers';
import { useWallet } from '../../context/WalletContext.jsx';
import { useContractData } from '../../hooks/useContractData.js';
import { waitForTx } from '../../utils/contracts.js';
import {
  ABIS,
  HMC_ADDRESS,
  PAYMENT_TOKENS,
  HMC_DECIMALS,
  explorerTx,
} from '../../config/contracts.js';
import { formatNumber, formatUSD, shortAddress } from '../../utils/format.js';
import { parseError } from '../../utils/errors.js';

export default function AdminPanel() {
  const { signer, account } = useWallet();
  const [token, setToken] = useState(PAYMENT_TOKENS[0]);
  const { data, refresh } = useContractData(token);
  const [status, setStatus] = useState(null); 
  const [busy, setBusy] = useState(false);

  // form fields
  const [liqAmount, setLiqAmount] = useState('');
  const [tokenAddr, setTokenAddr] = useState('');
  const [tokenStatus, setTokenStatus] = useState('true');
  const [feedAddr, setFeedAddr] = useState('');
  const [sharePct, setSharePct] = useState('');
  const [maxTx, setMaxTx] = useState('');
  const [dailyLim, setDailyLim] = useState('');
  const [maxBuyTx, setMaxBuyTx] = useState('');
  const [dailyBuyLim, setDailyBuyLim] = useState('');
  const [cooldown, setCooldown] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [blAddr, setBlAddr] = useState('');
  const [blStatus, setBlStatus] = useState('true');

  function hmcWrite() {
    return new Contract(HMC_ADDRESS, ABIS.HMC, signer);
  }

  async function run(label, fn) {
    if (!signer) return;
    try {
      setBusy(true);
      setStatus({ type: 'pending', msg: `${label}…` });
      const tx = await fn();
      setStatus({ type: 'pending', msg: 'Waiting for confirmation…', hash: tx.hash });
      await waitForTx(tx.hash);
      setStatus({ type: 'success', msg: `${label} — done.`, hash: tx.hash });
      refresh();
    } catch (e) {
      setStatus({ type: 'error', msg: parseError(e) });
    } finally {
      setBusy(false);
    }
  }

  // ---- actions ----
  const togglePause = () => run(data.paused ? 'Unpausing' : 'Pausing', () => hmcWrite().setPaused(!data.paused));

  const addLiquidity = async () => {
    if (!liqAmount) return;
    const amt = parseUnits(liqAmount, token.decimals);
    // approve then addLiquidity
    await run('Approving', () => new Contract(token.address, token.abi || ABIS.USDT, signer).approve(HMC_ADDRESS, amt));
    await run(`Adding ${liqAmount} ${token.symbol} liquidity`, () => hmcWrite().addLiquidity(token.address, amt));
    setLiqAmount('');
  };

  const statusBool = tokenStatus === 'true';
  const setStablecoin = () =>
    run(`${statusBool ? 'Enabling' : 'Disabling'} stablecoin`, () => hmcWrite().setStablecoin(tokenAddr, statusBool));
  const setOracleToken = () =>
    run(`${statusBool ? 'Allowing' : 'Disallowing'} oracle token`, () => hmcWrite().setAllowedToken(tokenAddr, statusBool));
  const setPriceFeed = () =>
    run('Setting price feed', () => hmcWrite().setPriceFeed(tokenAddr, feedAddr));

  const updateShare = () => {
    if (sharePct === '') return;
    run('Updating owner share', () => hmcWrite().setOwnerSharePercent(BigInt(sharePct)));
  };

  const updateMaxSellPerTx = () => {
    if (!maxTx) return;
    run('Updating max sell / tx', () => hmcWrite().setMaxSellPerTx(parseUnits(maxTx, HMC_DECIMALS)));
    setMaxTx('');
  };
  const updateDailyLimit = () => {
    if (!dailyLim) return;
    run('Updating daily sell limit', () => hmcWrite().setDailySellLimit(parseUnits(dailyLim, HMC_DECIMALS)));
    setDailyLim('');
  };
  const updateCooldown = () => {
    if (cooldown === '') return;
    // Admin enters hours; the contract stores seconds.
    const seconds = BigInt(Math.round(Number(cooldown) * 3600));
    run('Updating cooldown', () => hmcWrite().setCooldownPeriod(seconds));
    setCooldown('');
  };
  const updateMaxBuyPerTx = () => {
    if (!maxBuyTx) return;
    run('Updating max buy / tx', () => hmcWrite().setMaxBuyPerTx(parseUnits(maxBuyTx, HMC_DECIMALS)));
    setMaxBuyTx('');
  };
  const updateDailyBuyLimit = () => {
    if (!dailyBuyLim) return;
    run('Updating daily buy limit', () => hmcWrite().setDailyBuyLimit(parseUnits(dailyBuyLim, HMC_DECIMALS)));
    setDailyBuyLim('');
  };

  // ---- Blacklist (compliance/security) ----
  const blOn = blStatus === 'true';
  const runBlacklist = (kind, fn) => {
    if (!blAddr) return;
    run(`${blOn ? 'Blacklisting' : 'Un-blacklisting'} ${kind} · ${shortAddress(blAddr)}`, fn);
  };
  const setBuyBL = () => runBlacklist('buy', () => hmcWrite().setBuyBlacklist(blAddr, blOn));
  const setSellBL = () => runBlacklist('sell', () => hmcWrite().setSellBlacklist(blAddr, blOn));
  const setTransferBL = () => runBlacklist('transfer', () => hmcWrite().setTransferBlacklist(blAddr, blOn));
  const setFullBL = () => runBlacklist('all', () => hmcWrite().setFullBlacklist(blAddr, blOn));

  const transferOwnership = () => {
    if (!newOwner) return;
    if (!window.confirm(`Transfer ownership to ${newOwner}? This is permanent and you will lose admin access.`)) return;
    run('Transferring ownership', () => hmcWrite().transferOwnership(newOwner));
    setNewOwner('');
  };

  const withdrawExcess = () =>
    run('Withdrawing surplus', () => hmcWrite().withdrawExcessUSDT(token.address));

  return (
    <div className="admin">
      {/* Monitoring */}
      <div className="admin-grid">
        <Stat label="Owner" value={shortAddress(data.owner)} />
        <Stat label="Current Price" value={formatUSD(data.priceUSD)} />
        <Stat label="Total Sold" value={`${formatNumber(data.soldHMC, 2)} HMC`} />
        <Stat label={`Reserve (${token.symbol})`} value={formatNumber(data.reserveUSD, 2)} />
        <Stat label="Sell Fee" value={`${data.sellFeePercent}%`} />
        <Stat label="Status" value={data.paused ? 'Paused' : 'Active'} />
        <Stat label="Max Buy / tx" value={`${formatNumber(data.maxBuyPerTxHMC, 0)} HMC`} />
        <Stat label="Daily Buy" value={`${formatNumber(data.dailyBuyLimitHMC, 0)} HMC`} />
        <Stat label="Max Sell / tx" value={`${formatNumber(data.maxSellPerTxHMC, 0)} HMC`} />
        <Stat label="Daily Sell" value={`${formatNumber(data.dailyLimitHMC, 0)} HMC`} />
        <Stat label="Owner share" value={`${data.ownerSharePercent}%`} />
        <Stat label="Cooldown" value={`${(data.cooldownSeconds / 3600).toFixed(1)}h`} />
      </div>

      {status && (
        <div className={`admin-status admin-${status.type}`}>
          {status.msg}
          {status.hash && (
            <a href={explorerTx(status.hash)} target="_blank" rel="noreferrer"> · View ↗</a>
          )}
        </div>
      )}

      <div className="admin-token-pick">
        <span>Working token:</span>
        <select value={token.symbol} onChange={(e) => setToken(PAYMENT_TOKENS.find((t) => t.symbol === e.target.value))}>
          {PAYMENT_TOKENS.map((t) => <option key={t.symbol}>{t.symbol}</option>)}
        </select>
      </div>

      {/* Controls */}
      <div className="admin-actions">
        <AdminCard title="Contract Status">
          <button className="btn btn-outline btn-block" disabled={busy} onClick={togglePause}>
            {data.paused ? 'Unpause Trading' : 'Pause Trading'}
          </button>
        </AdminCard>

        <AdminCard title="Liquidity Reserve">
          <p className="muted">Top up the reserve so users can sell. Current: {formatNumber(data.reserveUSD, 2)} {token.symbol}</p>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Amount" value={liqAmount} onChange={(e) => setLiqAmount(e.target.value)} />
            <span className="input-suffix">{token.symbol}</span>
          </div>
          <button className="btn btn-gold btn-block" disabled={busy || !liqAmount} onClick={addLiquidity}>
            Add Liquidity
          </button>
          <button className="btn btn-outline btn-block" disabled={busy} onClick={withdrawExcess}>
            Withdraw Surplus
          </button>
        </AdminCard>

        <AdminCard title="Token Support">
          <input className="text-input" placeholder="Token address (0x…)" value={tokenAddr} onChange={(e) => setTokenAddr(e.target.value)} />
          <div className="admin-token-pick">
            <span>Status:</span>
            <select value={tokenStatus} onChange={(e) => setTokenStatus(e.target.value)}>
              <option value="true">Enable</option>
              <option value="false">Disable</option>
            </select>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !tokenAddr} onClick={setStablecoin}>
            {statusBool ? 'Enable' : 'Disable'} as Stablecoin
          </button>
          <button className="btn btn-outline btn-block" disabled={busy || !tokenAddr} onClick={setOracleToken}>
            {statusBool ? 'Allow' : 'Disallow'} as Oracle Token
          </button>
          <input className="text-input" placeholder="Chainlink feed address (0x…)" value={feedAddr} onChange={(e) => setFeedAddr(e.target.value)} />
          <button className="btn btn-outline btn-block" disabled={busy || !tokenAddr || !feedAddr} onClick={setPriceFeed}>
            Set Price Feed
          </button>
        </AdminCard>

        <AdminCard title="Buy Limits">
          <p className="muted">Max / tx: {formatNumber(data.maxBuyPerTxHMC, 0)} HMC · Daily: {formatNumber(data.dailyBuyLimitHMC, 0)} HMC</p>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Max buy / tx (1–10000)" value={maxBuyTx} onChange={(e) => setMaxBuyTx(e.target.value)} />
            <span className="input-suffix">HMC</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !maxBuyTx} onClick={updateMaxBuyPerTx}>
            Update Max Buy / Tx
          </button>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Daily buy limit (1–50000)" value={dailyBuyLim} onChange={(e) => setDailyBuyLim(e.target.value)} />
            <span className="input-suffix">HMC</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !dailyBuyLim} onClick={updateDailyBuyLimit}>
            Update Daily Buy Limit
          </button>
        </AdminCard>

        <AdminCard title="Sell Limits & Cooldown">
          <p className="muted">Max / tx: {formatNumber(data.maxSellPerTxHMC, 0)} HMC · Daily: {formatNumber(data.dailyLimitHMC, 0)} HMC · Cooldown: {(data.cooldownSeconds / 3600).toFixed(1)}h</p>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Max sell / tx (1–5000)" value={maxTx} onChange={(e) => setMaxTx(e.target.value)} />
            <span className="input-suffix">HMC</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !maxTx} onClick={updateMaxSellPerTx}>
            Update Max Sell / Tx
          </button>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Daily sell limit (1–10000)" value={dailyLim} onChange={(e) => setDailyLim(e.target.value)} />
            <span className="input-suffix">HMC</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !dailyLim} onClick={updateDailyLimit}>
            Update Daily Limit
          </button>
          <div className="input-row">
            <input className="amount-input" type="number" placeholder="Cooldown (hours, e.g. 8)" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
            <span className="input-suffix">hrs</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || cooldown === ''} onClick={updateCooldown}>
            Update Cooldown
          </button>
        </AdminCard>

        <AdminCard title="Blacklist (Compliance & Security)">
          <p className="muted">Restrict a wallet from buy, sell, or transfer. For fraud/abuse prevention and regulatory compliance only.</p>
          <input className="text-input" placeholder="Wallet address (0x…)" value={blAddr} onChange={(e) => setBlAddr(e.target.value)} />
          <div className="admin-token-pick">
            <span>Action:</span>
            <select value={blStatus} onChange={(e) => setBlStatus(e.target.value)}>
              <option value="true">Blacklist</option>
              <option value="false">Un-blacklist</option>
            </select>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || !blAddr} onClick={setBuyBL}>
            {blOn ? 'Blacklist' : 'Un-blacklist'} — Buy
          </button>
          <button className="btn btn-outline btn-block" disabled={busy || !blAddr} onClick={setSellBL}>
            {blOn ? 'Blacklist' : 'Un-blacklist'} — Sell
          </button>
          <button className="btn btn-outline btn-block" disabled={busy || !blAddr} onClick={setTransferBL}>
            {blOn ? 'Blacklist' : 'Un-blacklist'} — Transfer
          </button>
          <button className="btn btn-warn btn-block" disabled={busy || !blAddr} onClick={setFullBL}>
            {blOn ? 'Blacklist' : 'Un-blacklist'} — All actions
          </button>
        </AdminCard>

        <AdminCard title="Owner Share">
          <p className="muted">Percentage of each buy sent to the owner (max 60%).</p>
          <div className="input-row">
            <input className="amount-input" type="number" min="0" max="60" placeholder="e.g. 60" value={sharePct} onChange={(e) => setSharePct(e.target.value)} />
            <span className="input-suffix">%</span>
          </div>
          <button className="btn btn-outline btn-block" disabled={busy || sharePct === ''} onClick={updateShare}>
            Update Owner Share
          </button>
        </AdminCard>

        <AdminCard title="Danger Zone">
          <p className="muted">Transfer contract ownership. This is <strong>permanent</strong> — the new owner gains full admin control and you lose it.</p>
          <input className="text-input" placeholder="New owner address (0x…)" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
          <button className="btn btn-warn btn-block" disabled={busy || !newOwner} onClick={transferOwnership}>
            Transfer Ownership
          </button>
        </AdminCard>
      </div>

      <p className="admin-foot">Signed in as {shortAddress(account)} (owner)</p>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value sm">{value}</span>
    </div>
  );
}

function AdminCard({ title, children }) {
  return (
    <div className="card admin-card">
      <h4>{title}</h4>
      {children}
    </div>
  );
}
