// =============================================================
//  Client-side bonding-curve math — mirrors the on-chain contract EXACTLY.
//
//  The new contract removed previewBuy()/previewSell(), so we compute the
//  USD cost/return here using the same integer math (BigInt) the contract uses,
//  then convert USD → token amount (stablecoin: by decimals; oracle: via feed).
//  All USD values are 6-decimals (micro-dollars), matching the contract.
// =============================================================

import { Contract } from 'ethers';

const E18 = 10n ** 18n;
const PHASE1_START = 500n * 1_000_000n; //   $500   (6dp)
const PHASE1_END = 80_000n * 1_000_000n; //  $80,000
const PHASE2_END = 250_000n * 1_000_000n; // $250,000
const PHASE1_CAP = 100_000n * E18; //        100k HMC (wei)
const TOTAL_SUPPLY = 500_000n * E18; //      500k HMC (wei)

// _priceAt(s): price (6dp USD) at a given sold amount (wei).
export function priceAt(s) {
  if (s < PHASE1_CAP) {
    return PHASE1_START + (s * (PHASE1_END - PHASE1_START)) / PHASE1_CAP;
  }
  const ps = s - PHASE1_CAP;
  return PHASE1_END + (ps * (PHASE2_END - PHASE1_END)) / (TOTAL_SUPPLY - PHASE1_CAP);
}

// _cost(s0, s1): USD (6dp) to move sold from s0 -> s1 (s1 > s0). Both in wei.
export function costUSD(s0, s1) {
  if (s1 <= s0) return 0n;
  return (((priceAt(s0) + priceAt(s1)) / 2n) * (s1 - s0)) / E18;
}

// _usdToStable: USD (6dp) -> stablecoin amount, scaling by the token's decimals.
export function usdToStable(usd, decimals) {
  if (decimals === 6) return usd;
  if (decimals > 6) return usd * 10n ** BigInt(decimals - 6);
  return usd / 10n ** BigInt(6 - decimals);
}

// _reserveMultiplier(): payout multiplier (%) based on reserveStrength (wei).
export function reserveMultiplier(reserveStrength) {
  const r = reserveStrength;
  if (r === 0n || r < 10_000n * E18) return 100n;
  if (r < 50_000n * E18) return 105n;
  if (r < 100_000n * E18) return 110n;
  return 120n;
}

// adjusted sell fee: contract shaves 1% when reserve is strong and fee > 3.
export function adjustedSellFee(feeBase, reserveStrength) {
  return reserveStrength > 50_000n * E18 && feeBase > 3n ? feeBase - 1n : feeBase;
}

// Convert a USD (6dp) amount into a token amount, handling both paths:
//   • stablecoin  -> scale by token decimals
//   • oracle      -> read the Chainlink feed (priceFeeds[token]) and convert
// `info` may carry { isStable, decimals, feed } to skip extra reads.
const AGG_ABI = ['function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)'];
export async function usdToToken(provider, hmc, token, usd, info = {}) {
  let { isStable, decimals, feed } = info;
  if (isStable === undefined) isStable = await hmc.allowedStablecoins(token).catch(() => false);
  if (decimals === undefined) {
    const erc = new Contract(token, ['function decimals() view returns (uint8)'], provider);
    decimals = Number(await erc.decimals().catch(() => 18));
  }
  if (isStable) return usdToStable(usd, decimals);

  // oracle path
  if (!feed) feed = await hmc.priceFeeds(token).catch(() => null);
  if (!feed || feed === '0x0000000000000000000000000000000000000000') return 0n;
  const agg = new Contract(feed, AGG_ABI, provider);
  const [, answer] = await agg.latestRoundData();
  const p6 = BigInt(answer) / 100n; // feed (8dp) -> 6dp
  if (p6 <= 0n) return 0n;
  return (usd * 10n ** BigInt(decimals)) / p6;
}

export const CURVE = { TOTAL_SUPPLY, PHASE1_CAP, PHASE1_START, PHASE1_END, PHASE2_END };
