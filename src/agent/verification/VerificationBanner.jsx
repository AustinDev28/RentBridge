import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { USE_AGENT_VERIFICATION } from "./config.js";

export default function VerificationBanner({ level = 0, status, postsRemaining, dailyLimit }) {
  if (!USE_AGENT_VERIFICATION) return null;
  if (status?.suspended) return <section className="av-banner av-banner-danger" role="status"><AlertTriangle size={19} aria-hidden="true" /><span><strong>Account under review</strong><small>Your account is suspended from publishing while RentBridge reviews it.</small></span></section>;
  if (level < 2) return <section className="av-banner" role="status"><ShieldCheck size={19} aria-hidden="true" /><span><strong>Verify your identity to start posting</strong><small>Complete contact and identity verification to unlock publishing.</small></span><Link className="av-banner-link" to="/agent/verification">Start verification</Link></section>;
  if (postsRemaining === 0) return <section className="av-banner" role="status"><ShieldCheck size={19} aria-hidden="true" /><span><strong>Daily post limit reached</strong><small>You’ve used your {dailyLimit}-post allowance for the last 24 hours.</small></span></section>;
  return null;
}
