import { Link, useNavigate } from "react-router-dom";
import { Building2, LayoutDashboard, LogOut, Megaphone, ShieldCheck } from "lucide-react";
import { getCurrentAgent, logout } from "../agent/authService.js";
import { USE_AGENT_VERIFICATION } from "../agent/verification/config.js";
import { useVerification } from "../agent/verification/useVerification.js";
import VerificationBanner from "../agent/verification/VerificationBanner.jsx";
import "../agent/AgentDashboard.css";
import "../agent/verification/verification.css";
import CreatePostForm from "./components/CreatePostForm.jsx";
import MyPosts from "./components/MyPosts.jsx";
import "./feed.css";

export default function AgentPosts() {
  const agent = getCurrentAgent();
  const navigate = useNavigate();
  const verification = useVerification(agent?.id);
  const leave = () => { logout(); navigate("/agent/login", { replace: true }); };

  return <main className="agent-workspace rb-agent-workspace">
    <aside className="agent-sidebar">
      <div className="agent-sidebar-brand"><span className="agent-brand-mark"><Building2 size={19} /></span><span>RentBridge <small>AGENT PORTAL</small></span></div>
      <div className="agent-sidebar-profile"><span className="agent-avatar">{agent?.name?.slice(0, 1) || "A"}</span><span><strong>{agent?.name || "Agent"}</strong><small>Independent agent</small></span></div>
      <p className="agent-nav-label">WORKSPACE</p>
      <nav className="agent-side-nav" aria-label="Agent dashboard sections">
        <Link to="/agent/dashboard"><LayoutDashboard size={18} /><span>Dashboard</span></Link>
        <Link to="/agent/posts" className="is-active" aria-current="page"><Megaphone size={18} /><span>Posts</span></Link>
        {USE_AGENT_VERIFICATION && <Link to="/agent/verification"><ShieldCheck size={18} /><span>Verification</span><span className={`av-side-dot ${verification.status?.suspended ? "is-suspended" : verification.level >= 3 ? "is-approved" : "is-pending"}`} role="img" aria-label={verification.status?.suspended ? "Account under review" : verification.level >= 3 ? "Business verified" : "Verification incomplete"} /></Link>}
      </nav>
      <div className="agent-sidebar-bottom"><button type="button" className="agent-logout-link" onClick={leave}><LogOut size={17} /> Log out</button></div>
    </aside>
    <section className="agent-main">
      <header className="agent-topbar"><div className="agent-breadcrumb"><span>Agent workspace</span><span>/</span><strong>Posts</strong></div><Link className="agent-secondary-button" to="/agent/dashboard">Back to dashboard</Link></header>
      <div className="agent-main-content">
        <VerificationBanner level={verification.level} status={verification.status} postsRemaining={verification.postsRemaining} dailyLimit={verification.dailyLimit} />
        <div className="rb-agent-heading"><div><p className="agent-dashboard-eyebrow">AGENT WORKSPACE</p><h1>Your posts</h1><p>Share property updates and track how people respond.</p></div></div>
        <CreatePostForm onCreated={() => window.dispatchEvent(new Event("rentbridge-feed-updated"))} />
        <MyPosts />
      </div>
    </section>
  </main>;
}
