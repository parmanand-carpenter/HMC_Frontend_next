// =============================================================
//  Wallet connection context — powered by Reown AppKit.
//  AppKit handles the connect modal, mobile deep-links, QR,
//  reconnection and return-to-dApp. We expose a small, stable
//  API (account, provider, signer, chainId, connect, …) so the
//  rest of the app doesn't need to know about AppKit.
// =============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetwork,
  useDisconnect,
} from '@reown/appkit/react';
import { NETWORK } from '../config/contracts.js';
import '../config/appkit.js'; // ensure the AppKit modal is created once

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');
  const { chainId } = useAppKitNetwork();
  const { disconnect: appkitDisconnect } = useDisconnect();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Build an ethers provider + signer whenever the connected wallet changes.
  useEffect(() => {
    let active = true;
    (async () => {
      if (walletProvider && address) {
        try {
          const prov = new BrowserProvider(walletProvider);
          const sgn = await prov.getSigner();
          if (active) {
            setProvider(prov);
            setSigner(sgn);
          }
        } catch {
          if (active) {
            setProvider(null);
            setSigner(null);
          }
        }
      } else if (active) {
        setProvider(null);
        setSigner(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [walletProvider, address]);

  const numericChainId = chainId ? Number(chainId) : null;
  const wrongNetwork = !!isConnected && numericChainId !== null && numericChainId !== NETWORK.chainId;

  const connect = useCallback(() => open(), [open]);
  const disconnect = useCallback(() => appkitDisconnect(), [appkitDisconnect]);
  const switchNetwork = useCallback(() => open({ view: 'Networks' }), [open]);

  const value = {
    account: address || null,
    provider,
    signer,
    chainId: numericChainId,
    connecting: false,
    error: null,
    wallets: [],
    hasMetaMask: true,
    wrongNetwork,
    isConnected: !!isConnected,
    connect,
    connectWith: connect, // back-compat aliases
    connectWalletConnect: connect,
    disconnect,
    switchNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
}
