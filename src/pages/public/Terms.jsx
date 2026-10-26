import "./LegalPages.css";

const UPDATED = "October 26, 2026";

export default function Terms() {
  return (
    <main className="legal-page">
      <article className="legal-page__inner">
        <p className="legal-page__eyebrow">RentBridge · Terms</p>
        <h1>Terms and Conditions</h1>
        <p className="legal-page__intro">
          These terms govern your access to and use of RentBridge’s property discovery
          services and agent features. By using RentBridge, you agree to these terms.
        </p>
        <p className="legal-page__updated">Last updated: {UPDATED}</p>

        <aside className="legal-page__notice">
          <strong>Make informed decisions:</strong> Always independently confirm a listing,
          the agent’s authority, the property’s condition and availability, and all
          transaction terms before making a decision or payment.
        </aside>

        <section className="legal-page__section">
          <h2>Using RentBridge</h2>
          <p>
            RentBridge helps users discover property listings and connect with agents.
            You may use the service only in compliance with applicable laws and these terms.
            You are responsible for the decisions you make based on information found on
            the site.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Property listings and verification</h2>
          <p>
            Listings may be provided by RentBridge or by agents. Prices, availability,
            photographs, property descriptions, and agent details can change or contain
            errors. A verified label, when shown, means that a review has been carried
            out under RentBridge’s review process. It is not a guarantee of ownership,
            authority to rent or sell, property condition, availability, or transaction
            safety. Confirm important details independently and inspect the property
            before paying or signing an agreement.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Property transactions</h2>
          <p>
            Any tenancy, sale, agency, viewing, payment, or other agreement is between
            the people involved in that transaction. RentBridge is not a party to those
            agreements and does not collect or hold rent, deposits, or purchase funds.
            Users are responsible for checking identity, authority, property details,
            fees, and contract terms. Do not transfer money under pressure or before
            carrying out appropriate checks.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Contacting agents</h2>
          <p>
            Contact options may open WhatsApp or another third-party service. Your
            communications are between you and the recipient and are subject to the
            third party’s terms and privacy policy. Check the recipient before sharing
            information. RentBridge cannot control messages, representations, or conduct
            outside the service.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Agent accounts and listings</h2>
          <p>
            Agents are responsible for the accuracy and completeness of information they
            submit and must have permission to publish listing descriptions and images.
            Keep account credentials private. Account and dashboard information is stored
            in the browser used to access the service, may not be available on other devices,
            and may be removed when browser site data is cleared.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Acceptable use</h2>
          <p>You must not:</p>
          <ul>
            <li>Publish information that is false, misleading, fraudulent, or unauthorized.</li>
            <li>Impersonate another person or claim authority over a property without permission.</li>
            <li>Use RentBridge to harass, threaten, scam, or unlawfully discriminate against others.</li>
            <li>Attempt to disrupt the service or gain unauthorized access to another person’s information.</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Availability and changes</h2>
          <p>
            We work to keep RentBridge available and information useful, but we do not
            guarantee uninterrupted access or that every listing is current, complete,
            or error-free. We may update features and these terms from time to time. The
            date above shows when these terms were most recently revised.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Questions and reports</h2>
          <p>
            For questions about these terms or to report a listing, contact RentBridge
            through the official contact channels provided on the service.
          </p>
        </section>
      </article>
    </main>
  );
}
