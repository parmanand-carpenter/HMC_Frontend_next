// Modal that displays a legal document (terms / privacy / disclaimer).
import { LEGAL } from '../content/legal.js';

export default function LegalModal({ docKey, onClose }) {
  if (!docKey) return null;
  const doc = LEGAL[docKey];
  if (!doc) return null;

  return (
    <div className="tx-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="tx-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="legal-title">{doc.title}</h3>
        <p className="legal-effective">{doc.effective}</p>
        <p className="legal-intro">{doc.intro}</p>
        <div className="legal-body">
          {doc.sections.map(([heading, text]) => (
            <div key={heading} className="legal-section">
              <h4>{heading}</h4>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
