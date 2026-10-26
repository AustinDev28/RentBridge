import "./LegalPages.css";

const UPDATED = "October 26, 2026";

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <article className="legal-page__inner">
        <p className="legal-page__eyebrow">RentBridge · Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="legal-page__intro">
          This page explains what information the current RentBridge website uses,
          where the prototype keeps it, and what happens when you contact an agent.
        </p>
        <p className="legal-page__updated">Last updated: {UPDATED}</p>

        <aside className="legal-page__notice">
          <strong>Prototype notice:</strong> Agent accounts, profile details, and listings
          are currently saved in the browser you use. They are not connected to a shared
          RentBridge server, so they may not appear on another device and can be removed
          when browser data is cleared. Do not enter passwords or sensitive personal
          information that you would not want stored on that device.
        </aside>

        <section className="legal-page__section">
          <h2>Information you provide</h2>
          <p>
            If you create or use an agent account in this prototype, you may enter your
            name, email address, password, phone number, agency details, profile text,
            property information, and client messages. Information you enter into a
            contact link or message is handled by the service you choose to use.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How the prototype stores information</h2>
          <p>
            The agent prototype uses your browser’s local storage for the session,
            account, profile, listing, settings, and message data. Anyone with access
            to that browser profile may be able to see or change this data. Clearing
            the browser’s site data removes it. This storage is not a secure account
            system and should not be used for real passwords or confidential client
            information.
          </p>
          <p>
            The public sample property cards are built into the website. In the current
            prototype they are separate from agent dashboard submissions.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How information is used</h2>
          <p>
            Information entered in the prototype supports its visible features, such as
            signing in, showing an agent profile, managing sample listings, and displaying
            messages in the dashboard. RentBridge currentlyhave a connected
            backend through which this prototype data is shared between users.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Contacting an agent and third-party services</h2>
          <p>
            When you choose a contact option, your device may open WhatsApp or another
            service. Information you share there is handled under that provider’s terms
            and privacy policy. RentBridge does not control that conversation. Review the
            recipient and message before sending, and avoid sharing passwords, one-time
            codes, banking details, or unnecessary identity documents.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Your choices</h2>
          <ul>
            <li>You can choose not to create an agent account or submit optional profile details.</li>
            <li>You can update information in the dashboard where editing is available.</li>
            <li>You can remove prototype data by clearing RentBridge site data in your browser. This also signs you out and cannot be undone.</li>
            <li>For privacy questions or a request about information held by RentBridge, contact the RentBridge team through its official contact channel when one is provided.</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Changes and applicable protections</h2>
          <p>
            We may update this notice as the service changes. If a shared account system,
            analytics, or other data processing is introduced, this page should be updated
            before that change is used with real users. RentBridge aims to handle personal
            information responsibly and to respect privacy rights that apply to you,
            including rights under applicable Nigerian data protection law.
          </p>
          <p>
            This notice describes the current prototype and is not a substitute for a
            legal review before the service is launched for production use.
          </p>
        </section>
      </article>
    </main>
  );
}
