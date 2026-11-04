import "./LegalPages.css";

const UPDATED = "November 3, 2026";

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <article className="legal-page__inner">
        <p className="legal-page__eyebrow">RentBridge · Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="legal-page__intro">
          This notice explains what information you may provide through RentBridge,
          how it is used, and what choices are available to you.
        </p>
        <p className="legal-page__updated">Last updated: {UPDATED}</p>

        <aside className="legal-page__notice">
          Account details, preferences, and listing information are stored in the
          browser where you use RentBridge and are not synced across devices. Anyone
          with access to that browser profile may be able to view its saved data. Avoid
          using a password you use elsewhere, and do not enter confidential information.
        </aside>

        <section className="legal-page__section">
          <h2>Information you provide</h2>
          <p>
            When you use an account, you may provide your name, email address, password,
            phone number, agency details, profile text, property information, and client
            messages. Information you share through a contact link or message is handled
            by the service you choose to use.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How information is stored</h2>
          <p>
            RentBridge saves account, profile, listing, settings, and message information
            in your browser. Your sign-in session is kept for the current browser session.
            Clearing RentBridge site data removes saved information and signs you out.
            Use a private device and sign out when you finish on a shared device.
          </p>
          <p>
            Public property information displayed on the site may be provided separately
            from information entered in an agent account.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How information is used</h2>
          <p>
            RentBridge uses information to manage your account, display agent profiles
            and properties, save your preferences, support status updates, and show
            account messages. Information you enter is not synced to other devices.
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
            <li>You can choose which optional profile details to provide.</li>
            <li>You can update your name, notification preferences, and saved items in Account settings.</li>
            <li>You can clear RentBridge site data in your browser to remove saved information and sign out. This cannot be undone.</li>
            <li>For privacy questions, contact the RentBridge team through its official contact channel.</li>
          </ul>
        </section>

        <section className="legal-page__section">
          <h2>Changes and applicable protections</h2>
          <p>
            We may update this notice as RentBridge changes. We aim to handle personal
            information responsibly and to respect privacy rights that apply to you,
            including rights under applicable Nigerian data protection law.
          </p>
        </section>
      </article>
    </main>
  );
}
