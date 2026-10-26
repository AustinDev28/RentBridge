import "./LegalPages.css";

const UPDATED = "October 26, 2026";

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <article className="legal-page__inner">
        <p className="legal-page__eyebrow">RentBridge · Privacy</p>
        <h1>Privacy Policy</h1>
        <p className="legal-page__intro">
          We respect your privacy. This policy explains what information RentBridge
          collects, how it is used, and the choices available to you when you browse
          properties, use agent features, or contact an agent.
        </p>
        <p className="legal-page__updated">Last updated: {UPDATED}</p>

        <aside className="legal-page__notice">
          <strong>Account information:</strong> Information entered through agent account
          and dashboard features is stored in the browser on the device you use. It may
          be accessible to someone with access to that browser profile, is not automatically
          available on your other devices, and may be removed when you clear the browser’s
          site data. Please do not store confidential information in these features.
        </aside>

        <section className="legal-page__section">
          <h2>Information we collect</h2>
          <p>
            The information you provide may include your name, email address, password,
            phone number, agency details, profile description, property listing details,
            photographs, and messages. If you contact an agent through another service,
            that service may process information you choose to share there.
          </p>
          <p>
            When you browse the site, your browser and hosting provider may also process
            basic technical information needed to deliver and secure the website.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How information is stored</h2>
          <p>
            Agent session, account, profile, listing, settings, and message information
            is stored in your browser’s local storage. Anyone with access to that browser
            profile may be able to view or change it. Clearing RentBridge site data removes
            this information and may sign you out. Keep your device and browser profile
            secure, and avoid using shared devices for account access.
          </p>
          <p>
            Public property information may be supplied by RentBridge or by agents. Details
            entered in an agent dashboard are not necessarily published as a public listing.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>How we use information</h2>
          <p>
            We use information to operate account and agent features, display profiles and
            listing information, support communications, maintain the security of the site,
            and improve RentBridge. We do not ask you to provide passwords, one-time codes,
            or banking details to browse property listings.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>When information is shared</h2>
          <p>
            If you choose a contact option, your device may open WhatsApp or another
            third-party service. Information you send is handled by that provider under
            its own terms and privacy policy. RentBridge does not control those services
            or your conversations with agents. Review the recipient and message before
            sending, and avoid sharing sensitive information unnecessarily.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Your choices and privacy rights</h2>
          <ul>
            <li>You may choose not to create an agent account or provide optional profile details.</li>
            <li>You can update information through the dashboard where editing is available.</li>
            <li>You can remove browser-stored RentBridge information by clearing the site data in your browser; this also signs you out.</li>
            <li>You may make a request about personal information or ask a privacy question through RentBridge’s official contact channels.</li>
          </ul>
          <p>
            We aim to respect the privacy rights that apply to you, including rights under
            applicable Nigerian data protection law.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Security and children’s privacy</h2>
          <p>
            No method of storage or transmission is completely secure. Protect your
            credentials and device, and tell us through an official contact channel if
            you believe your account or information has been misused. RentBridge is intended
            for people seeking property and professional agents; children should not submit
            personal information through the service.
          </p>
        </section>

        <section className="legal-page__section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy when our services or information practices change.
            The date at the top of this page shows when it was most recently revised.
          </p>
        </section>
      </article>
    </main>
  );
}
