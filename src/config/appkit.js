// =============================================================
//  Reown AppKit (Web3Modal) setup — reliable wallet connection
//  modal that handles desktop extensions, mobile deep-links,
//  QR codes, reconnection, and the return-to-dApp flow.
// =============================================================

import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia } from '@reown/appkit/networks';
import { WALLETCONNECT_PROJECT_ID, ACTIVE_NETWORK_KEY } from './contracts.js';

const isMainnet = ACTIVE_NETWORK_KEY === 'mainnet';
// Only expose the active network. This prevents AppKit from ever defaulting to
// (or restoring a cached session on) the wrong chain — on mainnet builds the
// user can ONLY use Ethereum mainnet, matching their wallet.
const activeNetwork = isMainnet ? mainnet : sepolia;
const networks = [activeNetwork];
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Guard: in Next.js this module is evaluated on the server too, where browser
// APIs don't exist. Only create the modal in the browser.
export const appKit = typeof window === 'undefined' ? null : createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  defaultNetwork: activeNetwork,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: 'Half Million Coins (HMC)',
    description: 'Buy and sell HMC directly on-chain.',
    url: origin,
    icons: [`${origin}/logo.jpeg`],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#d4af37',
    '--w3m-color-mix': '#0b0710',
    '--w3m-color-mix-strength': 24,
    '--w3m-border-radius-master': '3px',
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});
