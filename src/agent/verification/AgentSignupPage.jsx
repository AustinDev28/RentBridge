import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getCurrentAgent, registerVerifiedAgent } from "../authService.js";
import { USE_SOCIAL_SIGNIN } from "../../auth/social/config.js";
import GoogleSignInButton, { SocialSignInDivider } from "../../auth/social/GoogleSignInButton.jsx";
import { getStatus } from "./verificationService.js";
import "./verification.css";

function passwordStrength(password) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  return score < 2 ? "Weak" : score < 4 ? "Fair" : "Strong";
}

export default function AgentSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", agencyName: "", acceptedTerms: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (getCurrentAgent()) return <Navigate to="/agent/verification" replace />;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await registerVerifiedAgent(form);
      if (result.error) {
        setError("We couldn't create your account. Check your details or try a different email and phone number.");
        return;
      }
      await getStatus(result.agent.id);
      navigate("/agent/verification", { replace: true });
    } catch {
      setError("We couldn't create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="av-auth-page">
    <section className="av-auth-card" aria-labelledby="av-signup-title">
      <div className="av-auth-icon"><ShieldCheck size={25} aria-hidden="true" /></div>
      <p className="av-eyebrow">RENTBRIDGE FOR AGENTS</p>
      <h1 id="av-signup-title">Create your agent account</h1>
      <p className="av-muted">Your agent account and verification details are saved in this browser.</p>
      {USE_SOCIAL_SIGNIN && <><GoogleSignInButton role="agent" onSuccess={async (newAgent) => { await getStatus(newAgent.id); navigate("/agent/verification", { replace: true }); }} /><SocialSignInDivider /></>}
      <form className="av-form" onSubmit={submit}>
        <label htmlFor="av-name">Full name</label>
        <input id="av-name" name="name" autoComplete="name" value={form.name} onChange={update} required />
        <label htmlFor="av-email">Email address</label>
        <input id="av-email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />
        <label htmlFor="av-phone">Phone number</label>
        <input id="av-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update} required />
        <label htmlFor="av-password">Password</label>
        <input id="av-password" name="password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={update} required aria-describedby="av-password-hint" />
        <small id="av-password-hint" className="av-muted" aria-live="polite">Strength: {form.password ? passwordStrength(form.password) : "Use at least 8 characters"}</small>
        <label htmlFor="av-agency">Agency name <span>(optional)</span></label>
        <input id="av-agency" name="agencyName" autoComplete="organization" value={form.agencyName} onChange={update} />
        <label className="av-checkbox-row"><input name="acceptedTerms" type="checkbox" checked={form.acceptedTerms} onChange={update} required /><span>I accept the <Link to="/terms" target="_blank" rel="noreferrer">Terms</Link> and <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span></label>
        {error && <p className="av-error" role="alert">{error}</p>}
        <button className="av-primary" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="av-auth-footer">Already have an account? <Link to="/agent/login">Sign in</Link></p>
    </section>
  </main>;
}
