import "./Navbar.css";
import logo from "../assets/logo.jpg"
import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Building2, Users, Info, ShieldCheck } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <section className="navbar">
        <div className="logo">
         <img src={logo} alt="RentBridge" />
            </div>
            
        <div className="navbar-links">
            <a href="./">
              <Home size="{12}" /> Home
               </a>
               <a href="./properties">
              <Building2 size="{12}" /> Properties
               </a>
               <a href="./agents">
              <Users size="{12px}" /> Agents
               </a>
               <a href="./about">
              <Info size="{12}" /> About
               </a>
               <a href="./safetytips">
              <ShieldCheck size="{16}" /> Safety-Tips
               </a>
             </div>
        <div className="navbar-button">
        <button className="navbar-button-1">Sign in</button>
        <button className="navbar-button-2">Sign up</button>
        </div>
         {/* Hamburger button - mobile only */}
      <button
        className="hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile menu */}
      {isOpen && (
        <ul className="mobile-menu">
          <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
          <li><Link to="/properties" onClick={() => setIsOpen(false)}>Properties</Link></li>
          <li><Link to="/agents" onClick={() => setIsOpen(false)}>Agents</Link></li>
          <li><Link to="/about" onClick={() => setIsOpen(false)}>About</Link></li>
          <li><Link to="/safetytips" onClick={() => setIsOpen(false)}>Safety-Tips</Link></li>
          <li><button className="mobile-signin">Sign in</button></li>
          <li><button className="mobile-signup">Sign up</button></li>
        </ul>
      )}
        </section>
    );
}