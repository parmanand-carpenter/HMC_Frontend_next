// =============================================================
//  Central configuration: networks, addresses, tokens.
//  Values come from .env (VITE_*) with sensible Sepolia defaults.
// =============================================================

import HMC_ABI from './abis/HMC.json';
import USDT_ABI from './abis/TestUSDT.json';
import USDC_ABI from './abis/TestUSDC.json';


// ---- Network definitions ----
export const NETWORKS = {
  sepolia: {
    key: 'sepolia',
    name: 'Sepolia',
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    explorer: 'https://sepolia.etherscan.io',
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    rpcLabel: 'Sepolia Test Network',
  },
  mainnet: {
    key: 'mainnet',
    name: 'Ethereum',
    chainId: 1,
    chainIdHex: '0x1',
    explorer: 'https://etherscan.io',
    // Read RPC: must be reliable AND browser-CORS-friendly. A dedicated Alchemy
    // key (VITE_MAINNET_RPC) is best; publicnode is the public fallback.
    // (Avoid eth.llamarpc.com / cloudflare-eth.com here — they block browser
    // CORS or go down, which floods the console with failed requests.)
    rpc: process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://ethereum-rpc.publicnode.com',
    rpcLabel: 'Ethereum Mainnet',
    // Block the HMC contract was deployed at — used as the starting point for
    // scanning token-whitelist events (so we don't scan all of history).
    deployBlock: 25316749,
  },
};

// Default to MAINNET. Only switch to Sepolia if explicitly set. This prevents
// a missing env var (e.g. on a fresh Netlify deploy) from silently falling back
// to the test network.
export const ACTIVE_NETWORK_KEY = process.env.NEXT_PUBLIC_NETWORK === 'sepolia' ? 'sepolia' : 'mainnet';
export const NETWORK = NETWORKS[ACTIVE_NETWORK_KEY];

// ---- Addresses (defaults are the live MAINNET values) ----
export const HMC_ADDRESS =
  process.env.NEXT_PUBLIC_HMC_ADDRESS || '0x4cAd32c961d86cDD7225B3dD9DDF929140Be3b86';
export const USDT_ADDRESS =
  process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7';
export const USDC_ADDRESS =
  process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const OWNER_ADDRESS =
  process.env.NEXT_PUBLIC_OWNER_ADDRESS || '0xeccD20F79Df0103e3BA6A1E039D97B439872E7D0';

export const SLIPPAGE_PERCENT = Number(process.env.NEXT_PUBLIC_SLIPPAGE_PERCENT || 2);

// WalletConnect project id (free from https://cloud.reown.com).
// Required for connecting mobile wallets from a normal mobile browser.
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// ---- ABIs (paste the real ABI JSON into the files under src/config/abis/) ----
export const ABIS = {
  HMC: HMC_ABI,
  USDT: USDT_ABI,
  USDC: USDC_ABI,
};

// ---- Base payment tokens (always shown in the dropdown) ----
// HMC is 18 decimals; stablecoins on this project are 6 decimals.
// Any extra tokens the admin whitelists on-chain are discovered live and
// appended to this list (see usePaymentTokens).
export const PAYMENT_TOKENS = [
  { symbol: 'USDT', address: USDT_ADDRESS, decimals: 6, abi: USDT_ABI },
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: 6, abi: USDC_ABI },
];

// Minimal ERC-20 ABI used to read metadata (symbol/decimals) and trade with
// any token the admin whitelists on-chain.
export const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

// Candidate tokens the admin might whitelist on-chain. The dropdown point-reads
// each one's status (no eth_getLogs — Alchemy's free tier caps that at 10
// blocks). Add any token here that the project may accept.
export const CANDIDATE_TOKENS = [
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT (6)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC (6)
  '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', // PYUSD (6)
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI (18)
  '0x0000000000085d4780B73119b644AE5ecd22b376', // TUSD (18)
  '0x853d955aCEf822Db058eb8505911ED77F175b99e', // FRAX (18)
  '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3', // USDe (18)
  '0xdC035D45d973E3EC169d2276DDab16f1e407384F', // USDS (18)
  '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd', // GUSD (2)
  '0x8E870D67F660D95d5be530380D0eC0bd388289E1', // USDP (18)
  '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', // LUSD (18)
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH (18, oracle)
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC (8, oracle)
];

export const HMC_DECIMALS = 18;
// On-chain prices use 6 implied decimals (USDT micro-units), matching the contract.
export const USD_DECIMALS = 6;

// Total HMC supply (500,000) - used for the sales progress bar.
export const TOTAL_SUPPLY = 500_000;

// Sales tiers shown in the UI (matches the bonding curve in the contract).
export const SALES_TIERS = [
  { phase: 'Phase 1', price: '$500', cap: '0 - 100k', note: 'Starting price' },
  { phase: 'Phase 2', price: '$80,000', cap: '100k sold', note: 'Mid curve' },
  { phase: 'Phase 3', price: '$250,000', cap: '500k sold', note: 'Full supply' },
];

export function isAbiReady(abi) {
  return Array.isArray(abi) && abi.length > 0;
}

export function explorerTx(hash) {
  return `${NETWORK.explorer}/tx/${hash}`;
}

export function explorerAddress(addr) {
  return `${NETWORK.explorer}/address/${addr}`;
}
