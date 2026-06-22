// Section 4 - the main dApp module: settings + dashboard + buy/sell.
import { useState, useEffect } from 'react';
import { PAYMENT_TOKENS } from '../config/contracts.js';
import { useContractData } from '../hooks/useContractData.js';
import { usePaymentTokens } from '../hooks/usePaymentTokens.js';
import Settings from './Settings.jsx';
import Dashboard from './Dashboard.jsx';
import BuyCard from './BuyCard.jsx';
import SellCard from './SellCard.jsx';
import TransactionStatus from './TransactionStatus.jsx';
import AbiNotice from './AbiNotice.jsx';
import { useWallet } from '../context/WalletContext.jsx';

export default function Trade() {
  const { tokens } = usePaymentTokens();
  const [token, setToken] = useState(PAYMENT_TOKENS[0]);
  const [tx, setTx] = useState(null);
  const { data, lastUpdated, refresh, abiReady, readError } = useContractData(token);
  const { isConnected } = useWallet();

  // Keep the selected token in sync with the live list (e.g. if metadata
  // loads, or the selected token gets removed by the admin).
  useEffect(() => {
    const match = tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase());
    if (match) {
      if (match !== token) setToken(match);
    } else if (tokens.length) {
      setToken(tokens[0]);
    }
  }, [tokens]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="trade" className="section section-alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Live dApp</span>
          <h2 className="section-title">Buy &amp; Sell HMC</h2>
          <p className="section-lead">
            Connect your wallet, preview the cost or return, and trade directly with the contract.
          </p>
        </div>

        {!abiReady && <AbiNotice />}

        {abiReady && (
          <>
            <Settings token={token} setToken={setToken} tokens={tokens} sellFeePercent={data.sellFeePercent} />

            <Dashboard data={data} lastUpdated={lastUpdated} token={token} isConnected={isConnected} />

            {readError && (
              <p className="form-error center">
                Could not read contract data. Check the network and contract address.
              </p>
            )}

            <div className="trade-grid">
              <BuyCard token={token} data={data} refresh={refresh} setTx={setTx} />
              <SellCard token={token} data={data} refresh={refresh} setTx={setTx} />
            </div>
          </>
        )}
      </div>

      <TransactionStatus tx={tx} onClose={() => setTx(null)} />
    </section>
  );
}
