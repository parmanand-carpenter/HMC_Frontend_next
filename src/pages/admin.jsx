// Hidden, owner-only admin route (/admin).
// Access is gated by comparing the connected wallet to the contract owner.
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Contract } from 'ethers';
import { useWallet } from '../context/WalletContext.jsx';
import { getReadProvider } from '../utils/contracts.js';
import { ABIS, HMC_ADDRESS, OWNER_ADDRESS, NETWORK, isAbiReady } from '../config/contracts.js';
import { shortAddress } from '../utils/format.js';
import AdminPanel from '../components/admin/AdminPanel.jsx';
import AbiNotice from '../components/AbiNotice.jsx';

export default function Admin() {
  const { account, isConnected, connect, wrongNetwork, switchNetwork } = useWallet();
  const [owner, setOwner] = useState(OWNER_ADDRESS);
  const abiReady = isAbiReady(ABIS.HMC);

  // Read the live owner from the contract when possible.
  useEffect(() => {
    if (!abiReady) return;
    const runner = getReadProvider();
    if (!runner) return;
    const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, runner);
    hmc.owner().then((o) => setOwner(o)).catch(() => {});
  }, [abiReady]);

  const isOwner = isConnected && account && owner && account.toLowerCase() === owner.toLowerCase();

  return (
    <section className="section">
      <Head>
        <title>Admin · Half Million Coins</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Restricted</span>
          <h2 className="section-title">Admin Panel</h2>
          <p className="section-lead">Owner-only contract management dashboard.</p>
        </div>

        {!abiReady ? (
          <AbiNotice />
        ) : !isConnected ? (
          <div className="card center-card">
            <p>Connect the owner wallet to access the admin panel.</p>
            <button className="btn btn-gold" onClick={connect}>Connect Wallet</button>
          </div>
        ) : wrongNetwork ? (
          <div className="card center-card">
            <p>Please switch to {NETWORK.name}.</p>
            <button className="btn btn-warn" onClick={switchNetwork}>Switch Network</button>
          </div>
        ) : !isOwner ? (
          <div className="card center-card">
            <h3 className="gold">Access Denied</h3>
            <p>This wallet ({shortAddress(account)}) is not the contract owner.</p>
            <p className="muted">Owner: {shortAddress(owner)}</p>
            <Link className="btn btn-outline" href="/">Back to site</Link>
          </div>
        ) : (
          <AdminPanel />
        )}
      </div>
    </section>
  );
}
