import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleDot, FlaskConical } from "lucide-react";
import { getCurrentAgent } from "../../agent/authService.js";
import { getAgentProfile, simulateNewPostFromFollowedAgent } from "../statusService.js";
import { USE_THEME_SYSTEM } from "../../theme/config.js";
import { useTheme } from "../../theme/useTheme.js";
import StatusPostForm from "./StatusPostForm.jsx";
import MyStatus from "./MyStatus.jsx";
import "../status.css";

export default function StatusAgentPage() {
  const agent = getCurrentAgent();
  const { resolvedTheme } = useTheme();
  const [notice, setNotice] = useState("");
  const simulate = async () => {
    const result = await simulateNewPostFromFollowedAgent();
    if (result.error) setNotice("Could not simulate a status update.");
    else setNotice(`Simulated a new update from ${getAgentProfile(result.agentId).name}. Open the bell to test the notification.`);
  };
  return <main className="status-agent-page" data-theme={USE_THEME_SYSTEM ? resolvedTheme : "light"}>
    <header className="status-agent-page-header"><Link to="/agent/dashboard" aria-label="Back to agent dashboard"><ArrowLeft size={18} /> Dashboard</Link><span><CircleDot size={18} /> Agent status</span></header>
    <div className="status-agent-content"><div className="status-agent-title"><div><p>AGENT WORKSPACE</p><h1>Status updates</h1><span>Post a property photo or video. Each status stays visible for 24 hours.</span></div><span className="status-agent-name">{agent?.name}</span></div>
      {import.meta.env.DEV && <section className="status-dev-helper"><div><FlaskConical size={18} /><span><strong>Development helper</strong><small>Send a test notification from a followed agent.</small></span></div><button type="button" onClick={simulate}>Simulate new post from followed agent</button></section>}
      {notice && <p className="status-dev-notice" role="status">{notice}</p>}
      <StatusPostForm />
      <MyStatus />
    </div>
  </main>;
}
