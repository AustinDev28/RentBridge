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
            <Link to="./safetytips">SafetyTips</Link>
          </div>

          <div className="footer-column">
            <h3>For Agents</h3>
            <Link to="./agents-login">Agent Login</Link>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <a href="./about">About Us</a>
            <a href="./contacts">Contact Us</a>
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