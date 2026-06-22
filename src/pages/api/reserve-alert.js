// =============================================================
//  Reserve-alert API route (runs on the SERVER).
//
//  Reads the HMC liquidity reserve on-chain and emails an alert when the
//  reserve "health" drops below the threshold (default 20%).
//
//  Health = total stablecoin reserve (USD) ÷ value needed to buy back all
//  sold HMC at the current price. If nothing has been sold yet, health = 100%.
//
//  Trigger it on a schedule (Vercel Cron via vercel.json, or an external cron
//  service hitting the URL). Protected by CRON_SECRET.
//
//  Query params:
//    ?secret=...   required if CRON_SECRET is set (Vercel Cron sends it as a
//                  Bearer token automatically)
//    ?test=1       send a test email regardless of the reserve level
// =============================================================

import nodemailer from 'nodemailer';
import { JsonRpcProvider, Contract, Network, formatUnits } from 'ethers';
import { ABIS, HMC_ADDRESS, NETWORK, PAYMENT_TOKENS } from '../../config/contracts.js';

const THRESHOLD = Number(process.env.RESERVE_THRESHOLD_PCT || 20);

export default async function handler(req, res) {
  // --- auth: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"; an
  //     external cron can pass ?secret=<CRON_SECRET> instead. ---
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const okHeader = req.headers.authorization === `Bearer ${secret}`;
    const okQuery = req.query.secret === secret;
    if (!okHeader && !okQuery) return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const net = Network.from(NETWORK.chainId);
    const provider = new JsonRpcProvider(NETWORK.rpc, net, { staticNetwork: net });
    const hmc = new Contract(HMC_ADDRESS, ABIS.HMC, provider);

    const [priceRaw, soldRaw] = await Promise.all([hmc.currentPrice(), hmc.sold()]);
    const price = Number(formatUnits(priceRaw, 6)); // USD per HMC (6dp)
    const sold = Number(formatUnits(soldRaw, 18)); // HMC

    // Total reserve across the project's stablecoins. The new contract holds
    // the tokens directly (no reserveBalance()), so we read each stablecoin's
    // balance held by the contract. (6-decimal stablecoins ≈ USD 1:1.)
    const ERC20_BAL = ['function balanceOf(address) view returns (uint256)'];
    let reserveUSD = 0;
    for (const t of PAYMENT_TOKENS) {
      const erc = new Contract(t.address, ERC20_BAL, provider);
      const r = await erc.balanceOf(HMC_ADDRESS).catch(() => 0n);
      reserveUSD += Number(formatUnits(r, t.decimals));
    }

    const requiredUSD = sold * price; // USD to buy back all sold HMC
    const healthPct = requiredUSD > 0 ? (reserveUSD / requiredUSD) * 100 : 100;

    const test = req.query.test === '1';
    const low = healthPct < THRESHOLD;

    let emailed = false;
    if (low || test) {
      await sendEmail({ healthPct, reserveUSD, requiredUSD, sold, price, test });
      emailed = true;
    }

    return res.status(200).json({
      ok: true,
      healthPct: Number(healthPct.toFixed(2)),
      reserveUSD: Number(reserveUSD.toFixed(2)),
      requiredUSD: Number(requiredUSD.toFixed(2)),
      threshold: THRESHOLD,
      low,
      emailed,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'failed' });
  }
}

async function sendEmail(d) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  const subject = d.test
    ? '✅ HMC Reserve Monitor — setup test'
    : `⚠️ HMC Liquidity Reserve low — ${d.healthPct.toFixed(1)}% (action needed)`;

  await transporter.sendMail({
    from: `HMC Reserve Monitor <${process.env.GMAIL_USER}>`,
    to: process.env.ALERT_EMAIL_TO || process.env.GMAIL_USER,
    subject,
    text: buildText(d),
    html: buildHtml(d),
  });
}

// Plain-text fallback (for clients that don't render HTML).
function buildText(d) {
  return [
    'HALF MILLION COINS (HMC) — Liquidity Reserve Alert',
    '',
    d.test
      ? 'This is a TEST email — your alert setup is working correctly.'
      : `The liquidity reserve has dropped to ${d.healthPct.toFixed(1)}%, below the ${THRESHOLD}% threshold.`,
    '',
    `Reserve health:              ${d.healthPct.toFixed(1)}%  (threshold ${THRESHOLD}%)`,
    `Reserve balance:             $${fmt(d.reserveUSD)}`,
    `Needed to back all sold HMC: $${fmt(d.requiredUSD)}`,
    `HMC sold:                    ${fmt(d.sold)} HMC`,
    `Current price:               $${fmt(d.price)}`,
    '',
    d.test
      ? ''
      : 'ACTION: Open the Admin panel and use "Add Liquidity" to top up the reserve so users can keep selling.',
    '',
    `Checked at ${new Date().toUTCString()}`,
    'Automated message from the HMC Reserve Monitor.',
  ].filter((l) => l !== null).join('\n');
}

// Branded HTML email (email-client-safe: tables + inline styles only).
function buildHtml(d) {
  const accent = '#d4af37';
  const bg = '#0b0710';
  const card = '#15101c';
  const border = '#2a2335';
  const textMain = '#ece7f2';
  const textDim = '#9a90a8';
  const danger = '#ff6b6b';

  const pct = Math.max(0, Math.min(100, d.healthPct));
  const barColor = d.test ? '#39d98a' : pct < THRESHOLD ? danger : accent;

  const bannerColor = d.test ? '#39d98a' : danger;
  const bannerBg = d.test ? 'rgba(57,217,138,0.12)' : 'rgba(255,107,107,0.12)';
  const bannerBorder = d.test ? 'rgba(57,217,138,0.4)' : 'rgba(255,107,107,0.4)';
  const bannerTitle = d.test ? '✅ Reserve Monitor — Test Email' : '⚠️ Liquidity Reserve Low';
  const bannerText = d.test
    ? 'Your reserve-alert setup is working correctly. You will receive an email like this whenever the reserve drops below the threshold.'
    : `The liquidity reserve has dropped to <b style="color:${textMain}">${d.healthPct.toFixed(1)}%</b>, below the ${THRESHOLD}% threshold. Please top it up so users can continue selling.`;

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${border};color:${textDim};font-size:14px;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${border};color:${textMain};font-size:14px;font-weight:bold;text-align:right;">${value}</td>
    </tr>`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const button = siteUrl
    ? `<a href="${siteUrl}/admin" style="display:inline-block;background:${accent};color:#1a1206;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:8px;">Open Admin → Add Liquidity</a>`
    : '';

  return `
  <div style="margin:0;padding:24px 12px;background:${bg};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${card};border:1px solid ${border};border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid ${border};">
          <span style="color:${accent};font-size:18px;font-weight:bold;letter-spacing:0.3px;">Half Million Coins</span>
          <span style="color:${textDim};font-size:12px;"> &nbsp;·&nbsp; HMC Reserve Monitor</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <div style="background:${bannerBg};border:1px solid ${bannerBorder};border-radius:10px;padding:16px 18px;">
            <div style="color:${bannerColor};font-size:18px;font-weight:bold;">${bannerTitle}</div>
            <div style="color:${textDim};font-size:14px;line-height:1.5;margin-top:6px;">${bannerText}</div>
          </div>

          <div style="margin:22px 0 8px;color:${textDim};font-size:12px;text-transform:uppercase;letter-spacing:1px;">Reserve Health</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="height:14px;background:${barColor};width:${pct}%;font-size:0;line-height:0;">&nbsp;</td>
              <td style="height:14px;background:${border};width:${100 - pct}%;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
          </table>
          <div style="margin-top:6px;color:${textMain};font-size:22px;font-weight:bold;">${d.healthPct.toFixed(1)}% <span style="color:${textDim};font-size:13px;font-weight:normal;">/ alert at ${THRESHOLD}%</span></div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
            ${row('Reserve balance', '$' + fmt(d.reserveUSD))}
            ${row('Needed to back all sold HMC', '$' + fmt(d.requiredUSD))}
            ${row('HMC sold', fmt(d.sold) + ' HMC')}
            ${row('Current price', '$' + fmt(d.price))}
          </table>

          ${d.test ? '' : `<div style="margin-top:22px;">${button}</div>`}
          ${d.test ? '' : `<div style="margin-top:14px;color:${textDim};font-size:13px;line-height:1.5;">Action: open the Admin panel and use <b style="color:${textMain}">Add Liquidity</b> to top up the reserve.</div>`}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-top:1px solid ${border};color:${textDim};font-size:11px;line-height:1.5;">
          Automated message from the HMC Reserve Monitor · checked ${new Date().toUTCString()}<br/>
          You receive this whenever the reserve is below ${THRESHOLD}% (checked every 30 minutes).
        </td>
      </tr>
    </table>
  </div>`;
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
