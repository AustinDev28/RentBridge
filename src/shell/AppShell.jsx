import { Link, NavLink, useLocation } from "react-router-dom";
import { Search } from "lucide-react";
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

export default function AppShell({ children, legacyNavbar = false }) {
  const { pathname } = useLocation();
  const { theme: legacyTheme } = useUserPreferences();
  const { resolvedTheme } = useTheme();
  const theme = USE_THEME_SYSTEM ? resolvedTheme : legacyTheme;
  return <div className={`shell-root${legacyNavbar ? " shell-with-legacy-navbar" : ""}`} data-theme={theme}>
    <aside className="shell-sidebar"><Link className="shell-brand" to="/" aria-label="RentBridge home"><img src={logo} alt="" /><span>RentBridge</span></Link><ShellNavigation /></aside>
    <div className="shell-frame">
      {!legacyNavbar && <header className="shell-topbar"><Link className="shell-mobile-brand" to="/" aria-label="RentBridge home"><img src={logo} alt="" /><span>RentBridge</span></Link>{pathname === "/" && <div className="shell-topbar-actions"><Link className="shell-icon-button" to="/agents" aria-label="Search agents or areas"><Search size={20} /></Link></div>}</header>}
      <div className="shell-content">{children}</div>
    </div>
    <ShellNavigation mobile />
  </div>;
}
