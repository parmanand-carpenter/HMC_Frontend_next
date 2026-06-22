// Landing hero — left: live dashboard card, right: content. Layout adds header/footer.
import Link from 'next/link';
import { useWallet } from '../context/WalletContext.jsx';
import { useContractData } from '../hooks/useContractData.js';
import { PAYMENT_TOKENS } from '../config/contracts.js';
import { formatNumber, formatUSD } from '../utils/format.js';

export default function Hero() {
  const { isConnected, connect, connecting } = useWallet();
  // Live on-chain data (auto-refreshes every 15s) for the hero card.
  const { data, abiReady } = useContractData(PAYMENT_TOKENS[0]);

  const price = abiReady && data.priceUSD ? formatUSD(data.priceUSD) : '$500';
  const progress = abiReady ? data.progress : 0;
  const sold = abiReady ? data.soldHMC : 0;

  return (
    <section id="about" className="section landing-hero">
      <div className="hero-glow" />
      <div className="container hero-2col">
        {/* LEFT — live dashboard card */}
        <div className="hero-visual">
          <div className="orb orb-gold" />
          <div className="orb orb-violet" />

          <div className="dash-wrap">
          <div className="dash-card">
            <div className="dash-card-head">
              <div className="dc-brand">
                <img src="/logo.jpeg" alt="HMC" className="dc-logo" />
                <div>
                  <div className="dc-name">Half Million Coins</div>
                  <div className="dc-sym">HMC · ERC-20</div>
                </div>
              </div>
              <span className="dc-live"><span className="dc-dot" /> Live</span>
            </div>

            <div className="dc-target">
              <span className="muted">Target</span>
              <span className="gold dc-target-val">$250,000</span>
            </div>

            <div className="dc-price">
              <span className="muted">Current Price</span>
              <div className="dc-price-val gold">{price}</div>
            </div>

            {/* decorative equity-style chart */}
            <svg className="dc-chart" viewBox="0 0 320 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgba(212,175,55,0.35)" />
                  <stop offset="1" stopColor="rgba(212,175,55,0)" />
                </linearGradient>
              </defs>
              <path d="M0,62 C40,54 60,40 92,44 S150,22 190,30 250,12 320,20 L320,80 L0,80 Z" fill="url(#gfill)" />
              <path d="M0,62 C40,54 60,40 92,44 S150,22 190,30 250,12 320,20" fill="none" stroke="#f5d479" strokeWidth="2" />
            </svg>

            <div className="dc-progress">
              <div className="dc-progress-head">
                <span>Sales Progress</span>
                <span className="gold">{progress.toFixed(2)}%</span>
              </div>
              <div className="dc-bar"><i style={{ width: `${Math.max(progress, 1.5)}%` }} /></div>
              <div className="dc-foot">
                <span>Sold {formatNumber(sold, 0)} HMC</span>
                <span>auto-refresh 15s</span>
              </div>
            </div>
          </div>

          <div className="float-chip chip-1">◆ Fixed Supply · 500k</div>
          <div className="float-chip chip-2">✦ Verified on-chain</div>
          </div>
        </div>

        {/* RIGHT — content */}
        <div className="hero-content">
          <span className="eyebrow badge">Transparent · Fixed Supply · On-Chain</span>
          <h1 className="hero-title">
            The <span className="gold">Half Million Coins</span> Standard
          </h1>
          <p className="hero-sub">
            A transparent digital asset built around scarcity and a permanently fixed supply of{' '}
            <span className="gold">500,000 HMC</span>. Buy and sell directly on-chain as the market
            climbs from <span className="gold">$500</span> toward{' '}
            <span className="gold">$250,000</span> — openly and community-driven.
          </p>

          <div className="hero-cta">
            <Link href="/buy-sell" className="btn btn-gold btn-lg">Buy / Sell HMC</Link>
            {!isConnected ? (
              <button className="btn btn-outline btn-lg" onClick={connect} disabled={connecting}>
                {connecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            ) : (
              <Link href="/whitepaper" className="btn btn-outline btn-lg">Read Whitepaper</Link>
            )}
          </div>

          <div className="hero-trust">
            <div className="trust-item"><strong>Half Million <span className="gold" style={{ fontSize: '1.08em', fontWeight: 800 }}>Coins</span></strong><span>Total supply</span></div>
            <div className="trust-divider" />
            <div className="trust-item"><strong>$500 → $250k</strong><span>Market range</span></div>
            <div className="trust-divider" />
            <div className="trust-item"><strong>Verified</strong><span>On-chain</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
