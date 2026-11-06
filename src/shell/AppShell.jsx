import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import logo from "../assets/logo.jpg";
import { useUserPreferences } from "../user/UserPreferences.jsx";
import { USE_THEME_SYSTEM } from "../theme/config.js";
import { useTheme } from "../theme/useTheme.js";
import { NAV_ITEMS } from "./navItems.js";
import "./shell.css";
import "../status/status.css";

function ShellNavigation({ mobile = false, vertical = false }) {
  const location = useLocation();
  return <nav className={vertical ? "shell-inline-nav" : mobile ? "shell-mobile-tabs" : "shell-sidebar-nav"} aria-label={vertical ? "Page links" : "Main navigation"}>
    {NAV_ITEMS.map(({ label, to, Icon }) => {
      const active = location.pathname === to || (to === "/properties" && location.pathname.startsWith("/properties/")) || (to === "/account" && location.pathname.startsWith("/account/"));
      return <NavLink to={to} key={to} aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}>
        <Icon size={20} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>;
    })}
  </nav>;
}

function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const submit = (event) => {
    event.preventDefault();
    navigate(`/agents?search=${encodeURIComponent(query)}`);
    onClose();
  };
  useEffect(() => {
    const keyHandler = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);
  return <div className="shell-search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="shell-search-dialog" role="dialog" aria-modal="true" aria-labelledby="shell-search-title"><div><h2 id="shell-search-title">Search RentBridge</h2><button type="button" onClick={onClose} aria-label="Close search"><X size={21} /></button></div><form onSubmit={submit}><label htmlFor="shell-search-input">Agent or area</label><input id="shell-search-input" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Lekki or an agent name" /><button className="shell-primary-button" type="submit">Search agents</button></form></section></div>;
}

export default function AppShell({ children, legacyNavbar = false }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme: legacyTheme } = useUserPreferences();
  const { resolvedTheme } = useTheme();
  const theme = USE_THEME_SYSTEM ? resolvedTheme : legacyTheme;
  return <div className={`shell-root${legacyNavbar ? " shell-with-legacy-navbar" : ""}`} data-theme={theme}>
    <aside className="shell-sidebar"><Link className="shell-brand" to="/" aria-label="RentBridge home"><img src={logo} alt="" /><span>RentBridge</span></Link><ShellNavigation /></aside>
    <div className="shell-frame">
      <header className="shell-topbar"><Link className="shell-mobile-brand" to="/" aria-label="RentBridge home"><img src={logo} alt="" /><span>RentBridge</span></Link><div className="shell-topbar-actions"><button className="shell-icon-button" type="button" aria-label="Search agents or areas" onClick={() => setSearchOpen(true)}><Search size={20} /></button></div></header>
      <div className="shell-content">{children}</div>
    </div>
    <ShellNavigation mobile />
    {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
  </div>;
}
