// Vision page — exact client-provided text. Header/footer from Layout.
export default function Vision() {
  return (
    <section id="vision" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Our Direction</span>
          <h2 className="section-title">Vision</h2>
        </div>

        <div className="paper">
          <article className="paper-block">
            <p>
              The vision of Half Million Coins is to build a transparent digital asset ecosystem
              based on scarcity, simplicity, and community-driven growth.
            </p>
          </article>
          <article className="paper-block">
            <p>
              HMC is designed with a fixed supply structure to maintain clarity and prevent future
              supply manipulation, allowing users to openly track progress and market development.
            </p>
          </article>
          <article className="paper-block">
            <p>
              The project aims to create an accessible environment where value is shaped naturally
              through participation, visibility, and market demand.
            </p>
          </article>
          <article className="paper-block">
            <p>
              As the ecosystem grows, HMC seeks to expand its presence as a recognizable digital
              asset focused on transparency, long-term growth, and user confidence.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
