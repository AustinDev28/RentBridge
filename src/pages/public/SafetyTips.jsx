import "./SafetyTips.css";
import { useState } from "react";
import { getReportableListings, saveListingReport } from "./listingReports.js";

export default function SafetyTips() {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportListings, setReportListings] = useState([]);
  const [reportNotice, setReportNotice] = useState("");

  const openReportForm = () => {
    setReportListings(getReportableListings());
    setReportNotice("");
    setReportOpen(true);
  };

  const submitReport = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const listingId = form.get("listing");
    const listing = reportListings.find((item) => item.id === listingId);
    const listingTitle = String(form.get("listingTitle")).trim();
    const listingUrl = String(form.get("listingUrl")).trim();

    if (!listing && !listingTitle && !listingUrl) {
      setReportNotice("Add the listing title or its link so we can identify it.");
      return;
    }

    saveListingReport({
      listingId: listing?.id || "other",
      listingTitle: listing?.title || listingTitle,
      listingLocation: listing?.location || String(form.get("listingLocation")).trim(),
      agentName: listing?.agentName || String(form.get("agentName")).trim(),
      listingUrl,
      reason: String(form.get("reason")),
      details: String(form.get("details")).trim(),
      reporterEmail: String(form.get("reporterEmail")).trim(),
    });

    setReportOpen(false);
    setReportNotice("Your report has been saved in this browser.");
    event.currentTarget.reset();
  };

  return (
    <div className="safety-page">

      {/* Page introduction */}
      <section className="safety-hero">
        <span className="safety-icon">🛡️</span>

        <h1>Safety Tips</h1>

        <p>
          Finding a rental property should be exciting, but it's very important to remain cautious
          throughout the process.Take a moment to verify independently. Never pay under pressure and don't skip the neccesary checks.
          Stay informed, stay cautious, and rent with confidence.
        </p>
      </section>


    
      <section className="safetytips">

        <div className="safety-card">
          <span className="tip-icon">🔎</span>

          <h2>Verify the Agent</h2>

          <p>
            Look for the Verified Agent badge and check the
            agent's information before proceeding. Ask reasonable
            questions about their identity and authority to offer
            the property.Make sure you know who you are dealing with before proceeding with any rentals transactions.
          </p>
        </div>


        <div className="safety-card">
          <span className="tip-icon">🏠</span>

          <h2>Verify the Property</h2>

          <p>
            Confirm the property's location and important details.
            Whenever possible, inspect the property yourself before
            making a major financial commitment.Before making payment,signing agreement or sharing sensitive information,
            take time to confirm that the property actually exists, matches the listing,and is legitimately being offered
            for rent.
          </p>
        </div> 


        <div className="safety-card">
          <span className="tip-icon">💰</span>

          <h2>Don't Rush Into Payment</h2>

          <p>
            Never allow pressure or urgency to make you skip
            important checks. Understand the rent and additional
            charges before making any payment.Finding the right property can be exciting, but you should never feel pressured to 
            make payment before you're comfortable with the property, the agent and the terms of the rental.
          </p>
        </div>


        <div className="safety-card">
          <span className="tip-icon">📱</span>

          <h2>Be Careful on WhatsApp</h2>

          <p>
            We tried to make the effect of communication easy for agents and clients using whatsapp chat. 
            But Never share passwords, OTPs, or unnecessary sensitive
            information. Make sure you are communicating with the
            agent associated with the property listing,However once the conversation moves into a confidential question's or transactional
            before further verifaction do yourself the best by reporting the agent and his listing.
          </p>
        </div>

      </section>


      {/* Report section */}
      <section className="report-section">

        <span className="report-icon">🚨</span>

        <h2>Something doesn't look right?</h2>

        <p>
          If you believe an agent listing is fraudulent or misleading, share the listing
          and what concerned you. Do not send money while you investigate.
        </p>

        <button type="button" onClick={openReportForm}>
          Report a Listing
        </button>

        {reportNotice && <p className="report-success" role="status">{reportNotice}</p>}

        {reportOpen && (
          <form className="listing-report-form" onSubmit={submitReport}>
            <h3>Report a property listing</h3>
            <p className="listing-report-form__note">
              Reports are saved in this browser and are not sent to RentBridge’s team.
              Avoid including passwords, financial details, or identity documents.
            </p>

            <label htmlFor="report-listing">Select the listing</label>
            <select id="report-listing" name="listing" defaultValue="" required>
              <option value="" disabled>Choose an agent listing</option>
              {reportListings.map((listing) => (
                <option value={listing.id} key={listing.id}>
                  {listing.title} — {listing.agentName} ({listing.location})
                </option>
              ))}
              <option value="other">I can’t find the listing</option>
            </select>

            <div className="listing-report-form__manual">
              <label>Listing title<input name="listingTitle" type="text" placeholder="Property title" /></label>
              <label>Agent name, if known<input name="agentName" type="text" placeholder="Agent or agency" /></label>
              <label>Listing link, if available<input name="listingUrl" type="url" placeholder="https://…" /></label>
              <label>Property location<input name="listingLocation" type="text" placeholder="Area and city" /></label>
            </div>

            <label htmlFor="report-reason">What is the concern?</label>
            <select id="report-reason" name="reason" defaultValue="" required>
              <option value="" disabled>Select a reason</option>
              <option value="suspected-scam">Suspected scam or request for advance payment</option>
              <option value="false-information">False or misleading listing details</option>
              <option value="unauthorized">Agent may not be authorized to list the property</option>
              <option value="duplicate">Duplicate or already unavailable listing</option>
              <option value="other">Other concern</option>
            </select>

            <label htmlFor="report-details">What happened?</label>
            <textarea id="report-details" name="details" rows="4" required maxLength="2000" placeholder="Share the facts that led you to report this listing." />

            <label htmlFor="report-email">Your email (optional, if follow-up is needed)</label>
            <input id="report-email" name="reporterEmail" type="email" autoComplete="email" />

            <div className="listing-report-form__actions">
              <button type="button" className="report-cancel" onClick={() => setReportOpen(false)}>Cancel</button>
              <button type="submit">Save report</button>
            </div>
          </form>
        )}

      </section>

    </div>
  );
}
