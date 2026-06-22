// Live dashboard: price, sold, user balance, reserve, progress bar.
import { formatNumber, formatUSD } from '../utils/format.js';
import { TOTAL_SUPPLY } from '../config/contracts.js';
import SalesTiers from './SalesTiers.jsx';

export default function Dashboard({ data, lastUpdated, token, isConnected }) {
  const stats = [
    { label: 'Current Price', value: formatUSD(data.priceUSD), hint: 'per HMC' },
    { label: 'Total Sold', value: `${formatNumber(data.soldHMC, 2)} HMC`, hint: `of ${formatNumber(TOTAL_SUPPLY)}` },
    {
      label: 'Your HMC Balance',
      value: isConnected ? `${formatNumber(data.userHmcBalance, 4)} HMC` : '—',
      hint: isConnected ? '' : 'connect wallet',
    },
    {
      label: 'Liquidity Reserve',
      value: `${formatNumber(data.reserveUSD, 2)} ${token.symbol}`,
      hint: 'available for sells',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dash-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value">{s.value}</span>
            {s.hint && <span className="stat-hint">{s.hint}</span>}
          </div>
        ))}
      </div>

      <div className="progress-wrap">
        <div className="progress-head">
          <span>Sales Progress</span>
          <span className="gold">{data.progress.toFixed(2)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${data.progress}%` }} />
        </div>
        <div className="progress-foot">
          <span>{formatNumber(data.soldHMC, 0)} HMC sold</span>
          <span>{formatNumber(TOTAL_SUPPLY)} total</span>
        </div>
      </div>

      <SalesTiers soldHMC={data.soldHMC} />

      <div className="dash-meta">
        {data.paused && <span className="pill pill-warn">Trading Paused</span>}
        {lastUpdated && (
          <span className="updated">
            Updated {lastUpdated.toLocaleTimeString()} · auto-refresh 15s
          </span>
        )}
      </div>
    </div>
  );
}
