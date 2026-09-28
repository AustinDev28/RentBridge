import "./SafetyTips.css";

export default function SafetyTips() {
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
          If you believe a property or agent may be suspicious, stop communicating and
          report it to RentBridge so it can be reviewed and dealt with strictly.
        </p>

        <button type="button-1">
          Report a Listing
        </button>

      </section>

    </div>
  );
}
