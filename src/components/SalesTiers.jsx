// Sales tiers display — highlights the current phase based on sold amount.
import { SALES_TIERS } from '../config/contracts.js';

export default function SalesTiers({ soldHMC }) {
  // Phase boundaries by tokens sold: P1 < 100k, P2 100k-500k, P3 = 500k.
  let activeIndex = 0;
  if (soldHMC >= 100_000) activeIndex = 1;
  if (soldHMC >= 500_000) activeIndex = 2;

  return (
    <div className="tiers">
      {SALES_TIERS.map((t, i) => (
        <div key={t.phase} className={`tier ${i === activeIndex ? 'tier-active' : ''}`}>
          <div className="tier-top">
            <span className="tier-phase">{t.phase}</span>
            {i === activeIndex && <span className="tier-badge">Current</span>}
          </div>
          <div className="tier-price gold">{t.price}</div>
          <div className="tier-cap">{t.cap}</div>
        </div>
      ))}
    </div>
  );
}
