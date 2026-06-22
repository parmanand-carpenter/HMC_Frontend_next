// Extra landing sections for the Home page: Why HMC, How it works, CTA band.

const FEATURES = [
  { icon: '◆', title: 'Permanently Fixed Supply', text: 'Exactly 500,000 HMC — no future minting, no manipulation. Scarcity is built into the contract.' },
  { icon: '✦', title: 'Fully On-Chain', text: 'Every buy, sell, and price update is recorded on Ethereum and verifiable by anyone.' },
  { icon: '❖', title: 'Transparent Pricing', text: 'A formula-based market price that rises visibly with demand — no order books, no hidden control.' },
  { icon: '⬢', title: 'Built-in Protections', text: 'Reserve checks, cooldowns, and per-wallet limits keep the market orderly and fair.' },
];

const STEPS = [
  { n: '01', title: 'Connect Wallet', text: 'Connect MetaMask securely. Your keys always stay with you.' },
  { n: '02', title: 'Preview', text: 'See your exact cost or return before you confirm — no surprises.' },
  { n: '03', title: 'Trade', text: 'Approve and execute. Track the transaction live on Etherscan.' },
];

export default function HomeSections() {
  return (
    <>
      {/* Why HMC */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Why HMC</span>
            <h2 className="section-title">A platform built on trust</h2>
            <p className="section-lead">Everything about HMC is designed to be simple, transparent, and verifiable.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="card feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
