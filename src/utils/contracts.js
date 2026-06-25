// =============================================================
//  Helpers to build ethers.js Contract instances.
// =============================================================

import { Contract, JsonRpcProvider, Network } from 'ethers';
import { ABIS, HMC_ADDRESS, NETWORK } from '../config/contracts.js';

let rpcProvider = null;

// A read-only provider for dashboard data. Always reads from the CONFIGURED
// network's public RPC — never the wallet's injected provider — so the
// dashboard shows correct data regardless of which chain the user's wallet is
// on, and so reads never trigger a mobile WalletConnect popup.
//
// We use a SINGLE reliable, CORS-friendly RPC with a static network. A static
// network tells ethers the chain id up front, so it never enters the
// "failed to detect network, retry in 1s" loop if a request hiccups — which
// also avoids flooding the console when an RPC is briefly unavailable.
export function getReadProvider() {
  if (rpcProvider) return rpcProvider;
  if (!NETWORK.rpc) return null;
  const staticNetwork = Network.from(NETWORK.chainId);
  rpcProvider = new JsonRpcProvider(NETWORK.rpc, staticNetwork, { staticNetwork });
  return rpcProvider;
}

// Wait for a transaction to confirm using our reliable RPC (Alchemy), NOT the
// wallet's provider. On mobile WalletConnect the wallet's provider is slow/
// flaky at reporting receipts, which leaves the UI stuck on "pending" even
// after the user has paid. Polling our own RPC confirms reliably and fast.
export async function waitForTx(hash, confirmations = 1, timeoutMs = 180000) {
  const p = getReadProvider();
  if (!p) return null;
  return p.waitForTransaction(hash, confirmations, timeoutMs);
}

export function getHmcContract(runner) {
  if (!runner) return null;
  return new Contract(HMC_ADDRESS, ABIS.HMC, runner);
}

export function getTokenContract(address, abi, runner) {
  if (!runner || !address) return null;
  return new Contract(address, abi, runner);
}
