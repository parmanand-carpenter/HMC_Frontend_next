// Whitepaper page — exact client-provided text. Header/footer from Layout.
const MARKET_ROWS = [
  ['10,000', '$8,450'],
  ['50,000', '$40,250'],
  ['100,000', '$80,000'],
  ['150,000', '$101,250'],
  ['200,000', '$122,500'],
  ['250,000', '$143,750'],
  ['300,000', '$165,000'],
  ['350,000', '$186,250'],
  ['400,000', '$207,500'],
  ['450,000', '$228,750'],
  ['500,000', '$250,000'],
];

export default function Whitepaper() {
  return (
    <section id="whitepaper" className="section section-alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Documentation</span>
          <h2 className="section-title">Whitepaper</h2>
          <p className="section-lead">Half Million Coins (HMC)</p>
        </div>

        <div className="paper">
          <article className="paper-block">
            <h3>1. Introduction</h3>
            <p>Half Million Coins (HMC) is a digital asset project focused on transparency, scarcity, and fast market growth.</p>
            <p>The project is designed to create a strong and transparent profit-driven environment by combining fixed supply with visible market progression.</p>
            <p>HMC aims to provide users with an accessible and straightforward crypto experience through a clean and user-friendly system while allowing the community to directly track growth, participation, and price progression in real time.</p>
            <p>The project starts from a market level of $500 and is structured to grow progressively up to $250,000 as all 500,000 HMC tokens become fully distributed.</p>
          </article>

          <article className="paper-block">
            <h3>2. Project Vision</h3>
            <p>Our vision is to build a transparent digital asset project focused on fast growth, strong market visibility, and community-driven value.</p>
            <p>We aim to create a project that combines:</p>
            <ul>
              <li>Transparency</li>
              <li>Simplicity</li>
              <li>Fast growth potential</li>
              <li>Profit-oriented market progression</li>
            </ul>
            <p>The long-term objective is to allow the market itself to drive value naturally through scarcity, open participation, and early positioning advantages.</p>
          </article>

          <article className="paper-block">
            <h3>3. Token Overview</h3>
            <ul>
              <li><strong>Token Name:</strong> Half Million Coins</li>
              <li><strong>Symbol:</strong> HMC</li>
              <li><strong>Token Type:</strong> ERC-20</li>
              <li><strong>Network:</strong> Ethereum</li>
              <li><strong>Total Supply:</strong> 500,000 HMC</li>
            </ul>
            <p>The project name itself represents the total token supply, which remains permanently fixed with no future increases or additional minting.</p>
            <ul>
              <li><strong>Starting Market Level:</strong> $500</li>
              <li><strong>Target Market Level:</strong> Up to $250,000 after full distribution of all 500,000 HMC tokens.</li>
            </ul>
            <p><strong>Purpose:</strong> HMC is designed to function as a transparent digital asset driven by scarcity, market participation, and visible growth progression.</p>
          </article>

          <article className="paper-block">
            <h3>4. Ecosystem Goals</h3>
            <p>The HMC project is planned to evolve gradually through multiple stages including:</p>
            <ul>
              <li>Community growth</li>
              <li>Platform expansion</li>
              <li>Increased accessibility</li>
              <li>Future utility integrations</li>
              <li>Long-term market development</li>
            </ul>
            <p>The project focuses on structured growth, transparent progression, and creating advantages for early participants through market expansion.</p>
          </article>

          <article className="paper-block">
            <h3>5. User Experience</h3>
            <p>The platform is designed to provide:</p>
            <ul>
              <li>Simple wallet connection</li>
              <li>Easy token purchase process</li>
              <li>Clear interface design</li>
              <li>Transparent interaction experience</li>
              <li>Accessible functionality for all users</li>
            </ul>
            <p>The objective is to reduce unnecessary complexity and create a smoother onboarding experience.</p>
          </article>

          <article className="paper-block">
            <h3>6. Roadmap</h3>
            <ol className="paper-roadmap">
              <li><strong>Phase 1:</strong> Project launch and initial deployment starting from a $500 market level.</li>
              <li><strong>Phase 2:</strong> Community growth, increased participation, and expanding market visibility.</li>
              <li><strong>Phase 3:</strong> Platform growth, wider accessibility, and continued market progression.</li>
              <li><strong>Phase 4:</strong> Full distribution of the 500,000 HMC supply with long-term market growth where earlier participation may provide stronger market advantages.</li>
            </ol>
            <p>The table below provides a clearer overview of the HMC pricing model and projected market progression across different supply levels.</p>
          </article>

          <article className="paper-block">
            <h3>HMC Market Growth Overview</h3>
            <div className="market-table-wrap">
              <table className="market-table">
                <thead>
                  <tr><th>HMC Sold</th><th>HMC Price</th></tr>
                </thead>
                <tbody>
                  {MARKET_ROWS.map(([sold, price]) => (
                    <tr key={sold}><td>{sold}</td><td className="gold">{price}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="paper-block">
            <h3>7. Security &amp; Transparency</h3>
            <p>The project prioritizes transparency and user clarity.</p>
            <p>All smart contract interactions are intended to remain visible and verifiable through blockchain explorers such as Etherscan.</p>
            <p>The platform aims to maintain a secure and transparent interaction environment for users.</p>
          </article>

          <article className="paper-block">
            <h3>8. Compliance &amp; Security Layer (Blacklist Mechanism)</h3>
            <p>To protect users and maintain the integrity of the protocol, HMC includes a blacklist module implemented at the smart-contract level.</p>
            <p>This mechanism is designed strictly to mitigate fraud, abuse, and malicious activity, and to support regulatory compliance. It allows specific wallet addresses to be restricted from buy, sell, or transfer actions where required for security enforcement.</p>
            <p>The blacklist serves <strong>no additional functional or discretionary purpose</strong> beyond security and compliance, and is used only to safeguard the protocol and its community.</p>
          </article>

          <article className="paper-block paper-disclaimer">
            <h3>9. Disclaimer</h3>
            <p>Half Million Coins (HMC) is a digital asset project currently under development.</p>
            <p>Nothing on this website or whitepaper should be considered financial advice, investment advice, or guarantees of future performance.</p>
            <p>Users should always conduct their own research before interacting with any blockchain-based project.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
