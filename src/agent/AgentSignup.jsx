// MOCK Data Embedded in the code snippet provided//
import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getCurrentAgent, registerAgent } from "./authService.js";
import "./AgentLogin.css";

export default function AgentSignup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getCurrentAgent()) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await registerAgent({ name, email, password });
      if (result.error === "email_in_use") {
        setError("An account with this email already exists.");
      } else if (result.error) {
        setError("Unable to create your account. Please try again.");
      } else {
        navigate("/agent/dashboard", { replace: true });
      }
    } catch {
      setError("Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="agent-login-page">
      <section className="agent-login-card" aria-labelledby="agent-signup-title">
        <div className="agent-login-icon"><ShieldCheck size={26} /></div>
        <p className="agent-login-eyebrow">RENTBRIDGE FOR AGENTS</p>
        <h1 id="agent-signup-title">Create your account</h1>
        <p className="agent-login-subtitle">Sign up to get started with your agent dashboard.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="agent-signup-name">Full name</label>
          <input
            id="agent-signup-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            required
          />

          <label htmlFor="agent-signup-email">Email address</label>
          <input
            id="agent-signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="agent-signup-password">Password</label>
          <div className="agent-password-field">
            <input
              id="agent-signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
            />
            <button
              type="button"
              className="agent-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <label htmlFor="agent-signup-confirm">Confirm password</label>
          <input
            id="agent-signup-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            required
          />

          {error && <p className="agent-login-error" role="alert">{error}</p>}

          <button className="agent-login-submit" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="agent-login-signup">
          Already have an account? <Link to="/agent/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}