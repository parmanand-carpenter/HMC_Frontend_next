// =============================================================
//  Live list of tokens the HMC contract accepts (for buy & sell).
//
//  The new contract exposes availableTokensForSell() — its own registry of
//  every token the admin has enabled, plus each token's live balance held by
//  the contract (the sell liquidity). We read that directly (one call, no
//  eth_getLogs), then enrich each token with its kind (stablecoin / oracle),
//  Chainlink feed, symbol and decimals.
//
//  A token is shown only if it can actually be priced:
//    • stablecoin  (allowedStablecoins), or
//    • oracle      (allowedTokens AND a price feed is set).
//  Refreshes every 30s so admin changes appear automatically.
// =============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Contract, getAddress } from 'ethers';
import { getReadProvider } from '../utils/contracts.js';
import { ABIS, HMC_ADDRESS, PAYMENT_TOKENS, ERC20_ABI, isAbiReady } from '../config/contracts.js';
import { shortAddress } from '../utils/format.js';

const REFRESH_MS = 30000;
const ZERO = '0x0000000000000000000000000000000000000000';

export function usePaymentTokens() {
  const [tokens, setTokens] = useState(PAYMENT_TOKENS);
  const [loading, setLoading] = useState(false);
  const metaRef = useRef(new Map()); // address(lower) -> { symbol, decimals }

  const scan = useCallback(async () => {
    if (!isAbiReady(ABIS.HMC)) return;
    const provider = getReadProvider();
    if (!provider) return;

    try {
      setLoading(true);
      const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, provider);

      // The contract's own registry of tradable tokens + their liquidity.
      const [addrs, balances] = await hmc.availableTokensForSell();
      if (!addrs || addrs.length === 0) return; // keep base fallback

      const list = [];
      for (let i = 0; i < addrs.length; i++) {
        const addr = addrs[i];
        const low = addr.toLowerCase();

        const [isStable, isOracle, feed] = await Promise.all([
          hmc.allowedStablecoins(addr).catch(() => false),
          hmc.allowedTokens(addr).catch(() => false),
          hmc.priceFeeds(addr).catch(() => ZERO),
        ]);
        const hasFeed = !!feed && feed !== ZERO;
        const kind = isStable ? 'stablecoin' : isOracle && hasFeed ? 'oracle' : null;
        if (!kind) continue; // not priceable -> skip

        let meta = metaRef.current.get(low);
        if (!meta) {
          const erc = new Contract(addr, ERC20_ABI, provider);
          const [sym, dec] = await Promise.all([
            erc.symbol().catch(() => null),
            erc.decimals().catch(() => 18),
          ]);
          meta = { symbol: sym || shortAddress(addr), decimals: Number(dec) };
          metaRef.current.set(low, meta);
        }

        list.push({
          symbol: meta.symbol,
          address: getAddress(addr),
          decimals: meta.decimals,
          abi: ERC20_ABI,
          kind,
          feed: hasFeed ? feed : undefined,
          reserveRaw: balances[i],
        });
      }

      if (list.length) setTokens(list);
    } catch {
      /* keep whatever we had (base fallback) */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    scan();
    const iv = setInterval(scan, REFRESH_MS);
    return () => clearInterval(iv);
  }, [scan]);

  return { tokens, loading };
}
