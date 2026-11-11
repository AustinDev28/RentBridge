import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getCurrentAgent, login, resetAgentPassword } from "./authService.js";
import { USE_AGENT_VERIFICATION } from "./verification/config.js";
import { USE_SOCIAL_SIGNIN } from "../auth/social/config.js";
import GoogleSignInButton, { SocialSignInDivider } from "../auth/social/GoogleSignInButton.jsx";
import "./AgentLogin.css";

function AgentPasswordField({ id, label, value, onChange, autoComplete, placeholder }) {
  const [visible, setVisible] = useState(false);
  return <>
    <label htmlFor={id}>{label}</label>
    <div className="agent-password-field">
      <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} onChange={onChange} placeholder={placeholder} minLength={8} required />
      <button type="button" className="agent-password-toggle" onClick={() => setVisible((shown) => !shown)} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  </>;
}

export default function AgentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState("");

  if (getCurrentAgent()) return <Navigate to="/agent/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.error === "access_denied") setError("Access denied. This account is not an agent account.");
      else if (result.error) setError("Invalid email or password");
      else navigate("/agent/dashboard", { replace: true });
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecovering(true);
    setRecoveryError("");
    setRecoverySuccess("");
  };

  const handleRecovery = async (event) => {
    event.preventDefault();
    setRecoveryError("");
    setRecoverySuccess("");
    if (newPassword !== confirmPassword) {
      setRecoveryError("The new passwords do not match.");
      return;
    }
    const result = await resetAgentPassword(recoveryEmail, newPassword);
    if (result.error === "account_not_found") setRecoveryError("We couldn't find an agent account with that email address.");
    else if (result.error === "password_too_short") setRecoveryError("Password must be at least 8 characters.");
    else if (result.error) setRecoveryError("Your password couldn't be changed. Please try again.");
    else {
      setEmail(recoveryEmail);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setRecovering(false);
      setRecoverySuccess("Password updated. Sign in with your new password.");
    }
  };

  return <main className="agent-login-page">
    <section className="agent-login-card" aria-labelledby="agent-login-title">
      <div className="agent-login-icon"><ShieldCheck size={26} /></div>
      <p className="agent-login-eyebrow">RENTBRIDGE FOR AGENTS</p>
      <h1 id="agent-login-title">{recovering ? "Reset your password" : "Welcome back"}</h1>
      <p className="agent-login-subtitle">{recovering ? "Enter your account email and choose a new password." : "Sign in to your account."}</p>
      {!recovering && USE_SOCIAL_SIGNIN && <><GoogleSignInButton role="agent" onSuccess={() => navigate(USE_AGENT_VERIFICATION ? "/agent/verification" : "/agent/dashboard", { replace: true })} /><SocialSignInDivider /></>}
      {recovering ? <form onSubmit={handleRecovery}>
        <label htmlFor="agent-recovery-email">Email address</label>
        <input id="agent-recovery-email" type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="you@example.com" required />
        <AgentPasswordField id="agent-new-password" label="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
        <AgentPasswordField id="agent-confirm-password" label="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Enter your new password again" />
        {recoveryError && <p className="agent-login-error" role="alert">{recoveryError}</p>}
        <button className="agent-login-submit" type="submit">Update password</button>
        <button className="agent-login-back" type="button" onClick={() => setRecovering(false)}>Back to sign in</button>
      </form> : <form onSubmit={handleSubmit}>
        <label htmlFor="agent-email">Email address</label>
        <input id="agent-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        <label htmlFor="agent-password">Password</label>
        <div className="agent-password-field">
          <input id="agent-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required />
          <button type="button" className="agent-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} title={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        </div>
        <button className="agent-login-forgot" type="button" onClick={openRecovery}>Forgot password?</button>
        {error && <p className="agent-login-error" role="alert">{error}</p>}
        {recoverySuccess && <p className="agent-login-success" role="status">{recoverySuccess}</p>}
        <button className="agent-login-submit" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>}
      {!recovering && <p className="agent-login-signup">New to RentBridge? <Link to="/agent/signup">Create an agent account</Link></p>}
    </section>
  </main>;
}
