// Section 5 - Footer. Real legal links (modal), contact, copyright.
import { useState } from 'react';
import { HMC_ADDRESS, NETWORK, explorerAddress } from '../config/contracts.js';
import { CONTACT_EMAIL, COPYRIGHT } from '../content/legal.js';
import LegalModal from './LegalModal.jsx';

export default function Footer() {
  const [legalDoc, setLegalDoc] = useState(null);

  return (
    <footer id="contact" className="footer">
      <div className="container footer-inner">
        <div className="footer-col footer-brand">
          <div className="brand">
            <img src="/logo.jpeg" alt="HMC" className="footer-logo" />
            <span className="brand-text">Half Million Coins</span>
          </div>
          <p className="footer-note">
            A transparent, fixed-supply digital asset.
          </p>
          <a className="footer-contract" href={explorerAddress(HMC_ADDRESS)} target="_blank" rel="noreferrer">
            Contract: {HMC_ADDRESS}
          </a>
          <span className="footer-network">Network: {NETWORK.name}</span>
        </div>

        <div className="footer-right">
          <div className="footer-col">
            <h4>Contact</h4>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href="https://x.com/Halfmillioncoin" target="_blank" rel="noreferrer">Twitter / X</a>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <button className="footer-link" onClick={() => setLegalDoc('privacy')}>Privacy Policy</button>
            <button className="footer-link" onClick={() => setLegalDoc('disclaimer')}>Disclaimer</button>
            <button className="footer-link" onClick={() => setLegalDoc('terms')}>Terms of Use</button>
          </div>
        </div>
      </div>

      <div className="footer-copyright">{COPYRIGHT}</div>

      <LegalModal docKey={legalDoc} onClose={() => setLegalDoc(null)} />
    </footer>
  );
}
