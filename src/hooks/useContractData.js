// =============================================================
//  Live on-chain data for the dashboard + buy/sell module.
//  Auto-refreshes every 15 seconds (per the spec) and also
//  exposes a manual refresh() to call right after a transaction.
// =============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatUnits } from 'ethers';
import { useWallet } from '../context/WalletContext.jsx';
import { getReadProvider, getHmcContract, getTokenContract } from '../utils/contracts.js';
import { isAbiReady, ABIS, HMC_ADDRESS, HMC_DECIMALS, USD_DECIMALS, TOTAL_SUPPLY } from '../config/contracts.js';

const REFRESH_MS = 15000;

const EMPTY = {
  priceUSD: 0,
  priceRaw: 0n,
  soldHMC: 0,
  soldWei: 0n,
  progress: 0,
  reserveUSD: 0,
  reserveStrengthWei: 0n,
  maxSellPossibleHMC: 0,
  sellFeePercent: 0,
  paused: false,
  maxSellPerTxHMC: 0,
  maxBuyPerTxHMC: 0,
  dailyBuyLimitHMC: 0,
  cooldownSeconds: 0,
  dailyLimitHMC: 0,
  ownerSharePercent: 0,
  userHmcBalance: 0,
  userTokenBalance: 0,
  userAllowance: 0n,
  nextSellTime: 0,
  dailySoldHMC: 0,
  dailyBoughtHMC: 0,
  buyBlacklisted: false,
  sellBlacklisted: false,
  owner: null,
};

export function useContractData(selectedToken) {
  const { account } = useWallet();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [readError, setReadError] = useState(null);
  const abiReady = isAbiReady(ABIS.HMC);
  const tokenRef = useRef(selectedToken);
  tokenRef.current = selectedToken;

  const refresh = useCallback(async () => {
    if (!abiReady) return;
    const token = tokenRef.current;
    // Always read through getReadProvider (injected extension on desktop, or a
    // public RPC). NEVER read through the wallet `provider`: on mobile
    // WalletConnect every eth_call is relayed to the wallet app, which spams the
    // "Continue to MetaMask?" popup every 15s. Only buy/sell writes use the signer.
    const runner = getReadProvider();
    if (!runner || !token) return;

    const hmc = getHmcContract(runner);
    if (!hmc) return;

    try {
      setLoading(true);
      setReadError(null);

      // Global contract state (no account needed).
      // currentPrice + sold are the "canary" reads: if the provider/network is
      // actually broken these throw and we surface the error. Every other read
      // is wrapped with a default so a single missing/renamed function in a
      // particular deployment (e.g. no oracle toggle) can't blank the whole
      // dashboard.
      const [price, sold] = await Promise.all([hmc.currentPrice(), hmc.sold()]);
      // Reserve for a token = that token's balance held by the contract.
      // (The new contract removed reserveBalance(); it just holds the tokens.)
      const reserveToken = getTokenContract(token.address, token.abi || ABIS.USDT, runner);
      const [sellFee, paused, maxSellPerTx, cooldown, dailyLimit, owner, reserve, maxSellable, ownerShare, maxBuyPerTx, dailyBuyLimit, reserveStrength] =
        await Promise.all([
          hmc.getSellFee().catch(() => 0n),
          hmc.paused().catch(() => false),
          hmc.maxSellPerTx().catch(() => 0n),
          hmc.cooldownPeriod().catch(() => 0n),
          hmc.dailySellLimit().catch(() => 0n),
          hmc.owner().catch(() => null),
          reserveToken ? reserveToken.balanceOf(HMC_ADDRESS).catch(() => 0n) : Promise.resolve(0n),
          hmc.maxSellPossible(token.address).catch(() => 0n),
          hmc.ownerSharePercent().catch(() => 0n),
          hmc.maxBuyPerTx().catch(() => 0n),
          hmc.dailyBuyLimit().catch(() => 0n),
          hmc.reserveStrength().catch(() => 0n),
        ]);

      const soldHMC = Number(formatUnits(sold, HMC_DECIMALS));

      let userHmcBalance = 0;
      let userTokenBalance = 0;
      let userAllowance = 0n;
      let nextSellTime = 0;
      let dailySoldHMC = 0;
      let dailyBoughtHMC = 0;
      let buyBlacklisted = false;
      let sellBlacklisted = false;

      if (account) {
        const tokenContract = getTokenContract(token.address, token.abi || ABIS.USDT, runner);
        const [hmcBal, tokBal, allow, nextSell, dailySold, dailyBought, buyBL, sellBL] = await Promise.all([
          hmc.balanceOf(account).catch(() => 0n),
          tokenContract ? tokenContract.balanceOf(account).catch(() => 0n) : Promise.resolve(0n),
          tokenContract ? tokenContract.allowance(account, HMC_ADDRESS).catch(() => 0n) : Promise.resolve(0n),
          hmc.nextSellTime(account).catch(() => 0n),
          hmc.dailySoldAmount(account).catch(() => 0n),
          hmc.dailyBoughtAmount(account).catch(() => 0n),
          hmc.buyBlacklisted(account).catch(() => false),
          hmc.sellBlacklisted(account).catch(() => false),
        ]);
        userHmcBalance = Number(formatUnits(hmcBal, HMC_DECIMALS));
        userTokenBalance = Number(formatUnits(tokBal, token.decimals));
        userAllowance = allow;
        nextSellTime = Number(nextSell);
        dailySoldHMC = Number(formatUnits(dailySold, HMC_DECIMALS));
        dailyBoughtHMC = Number(formatUnits(dailyBought, HMC_DECIMALS));
        buyBlacklisted = buyBL;
        sellBlacklisted = sellBL;
      }

      setData({
        priceUSD: Number(formatUnits(price, USD_DECIMALS)),
        priceRaw: price,
        soldHMC,
        soldWei: sold,
        progress: Math.min(100, (soldHMC / TOTAL_SUPPLY) * 100),
        reserveUSD: Number(formatUnits(reserve, token.decimals)),
        reserveStrengthWei: reserveStrength,
        maxSellPossibleHMC: Number(formatUnits(maxSellable, HMC_DECIMALS)),
        sellFeePercent: Number(sellFee),
        paused,
        maxSellPerTxHMC: Number(formatUnits(maxSellPerTx, HMC_DECIMALS)),
        maxBuyPerTxHMC: Number(formatUnits(maxBuyPerTx, HMC_DECIMALS)),
        dailyBuyLimitHMC: Number(formatUnits(dailyBuyLimit, HMC_DECIMALS)),
        cooldownSeconds: Number(cooldown),
        dailyLimitHMC: Number(formatUnits(dailyLimit, HMC_DECIMALS)),
        ownerSharePercent: Number(ownerShare),
        userHmcBalance,
        userTokenBalance,
        userAllowance,
        nextSellTime,
        dailySoldHMC,
        dailyBoughtHMC,
        buyBlacklisted,
        sellBlacklisted,
        owner,
      });
      setLastUpdated(new Date());
    } catch (e) {
      setReadError(e?.message || 'Failed to read contract data');
    } finally {
      setLoading(false);
    }
  }, [abiReady, account]);

  // Initial load + whenever account / token changes.
  useEffect(() => {
    refresh();
  }, [refresh, selectedToken]);

  // 15-second auto refresh.
  useEffect(() => {
    if (!abiReady) return;
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh, abiReady]);

  return { data, loading, lastUpdated, readError, refresh, abiReady };
}
