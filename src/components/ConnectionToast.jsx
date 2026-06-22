// Shows a brief "Wallet connected" success toast when a wallet connects.
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '../context/WalletContext.jsx';
import { shortAddress } from '../utils/format.js';

export default function ConnectionToast() {
  const { account } = useWallet();
  const [show, setShow] = useState(false);
  const prev = useRef(null);

  useEffect(() => {
    if (account && prev.current !== account) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 4000);
      prev.current = account;
      return () => clearTimeout(t);
    }
    prev.current = account;
  }, [account]);

  if (!show || !account) return null;

  return (
    <div className="connect-toast" onClick={() => setShow(false)}>
      <span className="connect-toast-check">✓</span>
      <div className="connect-toast-text">
        <strong>Wallet connected successfully</strong>
        <span>{shortAddress(account)}</span>
      </div>
    </div>
  );
}
