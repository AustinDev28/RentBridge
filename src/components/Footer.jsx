import "./Footer.css";
export default function Footer() {
  return (
    <section className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <h2>RentBridge</h2>
          <p>
            Find trusted rental properties and connect directly
            with verified agents.
          </p>
        </div>

        <div className="footer-links">

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="./properties">Properties</a>
            <a href="./rentals">Rentals</a>
            <a href="./locations">Locations</a>
          </div>

          <div className="footer-column">
            <h3>For Agents</h3>
            <a href="./agents-login">Agent Login</a>
            <a href="./add-listing">Add Listing</a>
            <a href="./agents-dashboard">Dashboard</a>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <a href="./about">About Us</a>
            <a href="./contacts">Contact</a>
            <a href="./faqs">FAQs</a>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2026 RentBridge</p>

          <div className="footer-legal">
            <a href="./privacy">Privacy Policy</a>
            <span>|</span>
            <a href="./terms">Terms and Conditions</a>
          </div>
        </div>

      </div>
    </section>
  );
}