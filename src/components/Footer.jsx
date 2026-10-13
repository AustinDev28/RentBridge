import "./Footer.css";
import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <section className="footer">
      <div className="footer-container">

        <div className="footer-brand">
          <h2>RentBridge</h2>
          <p>
            Find trusted properties for sale and rents
            with verified agents.
          </p>
        </div>

        <div className="footer-links">

          <div className="footer-column">
            <h3>Explore</h3>
            <Link to="/properties">Properties</Link>
            <Link to="/safetytips">SafetyTips</Link>
          </div>

          <div className="footer-column">
            <h3>For Agents</h3>
            <Link to="/agents-login">Agent Login</Link>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <Link to="/about">About Us</Link>
            <Link to="/contacts">Contact Us</Link>
          </div>

        </div>

        <div className="footer-bottom">
          <p>© 2026 RentBridge</p>

          <div className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms">Terms and Conditions</Link>
          </div>
        </div>

      </div>
    </section>
  );
}