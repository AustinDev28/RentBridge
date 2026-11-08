import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/public/Home.jsx";
import SafetyTips from "./pages/public/SafetyTips.jsx";
import Properties from "./components/Properties.jsx";
import About from "./pages/public/About.jsx";
import AgentLogin from "./agent/AgentLogin.jsx";
import AgentSignup from "./agent/AgentSignup.jsx";
import AgentDashboard from "./agent/AgentDashboard.jsx";
import AgentRouteGuard from "./agent/AgentRouteGuard.jsx";
import PrivacyPolicy from "./pages/public/PrivacyPolicy.jsx";
import Terms from "./pages/public/Terms.jsx";
import UserAuth from "./pages/public/UserAuth.jsx";
import UserProfile from "./pages/public/UserProfile.jsx";
import AgentPosts from "./feed/AgentPosts.jsx";
import StatusAgentPage from "./status/components/StatusAgentPage.jsx";
import { USE_NEW_SHELL } from "./shell/config.js";
import AppShell from "./shell/AppShell.jsx";
import AgentsPage from "./shell/pages/AgentsPage.jsx";
import AccountPage from "./shell/pages/AccountPage.jsx";
import MapPage from "./shell/pages/MapPage.jsx";
import AgentVerificationSignupPage from "./agent/verification/AgentSignupPage.jsx";
import VerificationPage from "./agent/verification/VerificationPage.jsx";
import AdminVerificationPage from "./agent/verification/AdminVerificationPage.jsx";
import { USE_AGENT_VERIFICATION } from "./agent/verification/config.js";

function App() {
  const { pathname } = useLocation();
  const isHomeFeed = pathname === "/";
  const isAgentRoute = pathname === "/agent" || pathname.startsWith("/agent/");
  const showShell = USE_NEW_SHELL && !isAgentRoute;
  const showNavbar = !isHomeFeed;

  const routes = <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/agents" element={<AgentsPage />} />
    <Route path="/account" element={<AccountPage />} />
    {USE_NEW_SHELL && <Route path="/map" element={<MapPage />} />}
    <Route path="/safetytips" element={<SafetyTips />} />
    <Route path="/properties" element={<Properties />} />
    <Route path="/about" element={<About />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/agent/login" element={<AgentLogin />} />
    <Route path="/agent/signup" element={USE_AGENT_VERIFICATION ? <AgentVerificationSignupPage /> : <AgentSignup />} />
    <Route path="/agent/verification" element={USE_AGENT_VERIFICATION ? <AgentRouteGuard><VerificationPage /></AgentRouteGuard> : <AgentRouteGuard><Navigate to="/agent/dashboard" replace /></AgentRouteGuard>} />
    {USE_AGENT_VERIFICATION && import.meta.env.DEV && <Route path="/admin/verification" element={<AdminVerificationPage />} />}
    <Route path="/user/login" element={<UserAuth />} />
    <Route path="/user/signup" element={<UserAuth signup />} />
    <Route path="/user/profile" element={<UserProfile />} />
    <Route path="/agent/dashboard" element={<AgentRouteGuard><AgentDashboard /></AgentRouteGuard>} />
    <Route path="/agent/posts" element={<AgentRouteGuard><AgentPosts /></AgentRouteGuard>} />
    <Route path="/agent/status" element={<AgentRouteGuard><StatusAgentPage /></AgentRouteGuard>} />
  </Routes>;

  return <>
    {showNavbar && <div className={showShell ? "shell-legacy-navbar-wrap" : undefined}><Navbar /></div>}
    {showShell ? <AppShell legacyNavbar={showNavbar}>{routes}{!isHomeFeed && <Footer />}</AppShell> : <>{routes}{!isHomeFeed && <Footer />}</>}
  </>;
}

export default App;
