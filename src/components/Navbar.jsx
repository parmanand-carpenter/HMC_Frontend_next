// Top navigation with brand, page links, mobile menu, and the wallet button.
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Contract } from 'ethers';
import { useWallet } from '../context/WalletContext.jsx';
import { getReadProvider } from '../utils/contracts.js';
import { shortAddress } from '../utils/format.js';
import { NETWORK, ABIS, HMC_ADDRESS, isAbiReady } from '../config/contracts.js';

export default function Navbar() {
  const { isConnected, account, connect, disconnect, wrongNetwork, switchNetwork } = useWallet();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [owner, setOwner] = useState(null);

  // Read the live contract owner so we can show the Admin link only to them.
  useEffect(() => {
    if (!isAbiReady(ABIS.HMC)) return;
    const runner = getReadProvider();
    if (!runner) return;
    new Contract(HMC_ADDRESS, ABIS.HMC, runner).owner().then(setOwner).catch(() => {});
  }, []);

  const isOwner =
    isConnected && account && owner && account.toLowerCase() === owner.toLowerCase();

  const closeMenu = () => setMenuOpen(false);
  // Active-link helper (replaces react-router's NavLink active state).
  const cls = (href) => (router.pathname === href ? 'active' : undefined);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand" onClick={closeMenu}>
          <img src="/logo.jpeg" alt="HMC" className="brand-logo" />
          <span className="brand-text">Half Million Coins</span>
        </Link>

        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link href="/" className={cls('/')} onClick={closeMenu}>Home</Link>
          <Link href="/vision" className={cls('/vision')} onClick={closeMenu}>Vision</Link>
          <Link href="/whitepaper" className={cls('/whitepaper')} onClick={closeMenu}>Whitepaper</Link>
          <Link href="/buy-sell" className={cls('/buy-sell')} onClick={closeMenu}>Buy / Sell</Link>
        </nav>

        <div className="nav-actions">
          {wrongNetwork && isConnected && (
            <button className="btn btn-warn" onClick={switchNetwork}>
              Switch to {NETWORK.name}
            </button>
          )}
          {!isConnected ? (
            <button className="btn btn-gold" onClick={connect}>
              Connect Wallet
            </button>
          ) : (
            <button className="btn btn-outline" onClick={disconnect} title="Click to disconnect">
              <span className="dot-online" /> {shortAddress(account)}
            </button>
          )}

          {/* Admin link — visible only to the contract owner */}
          {isOwner && (
            <Link href="/admin" onClick={closeMenu} className="btn btn-outline nav-admin-btn">
              Admin
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className={`nav-toggle ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
