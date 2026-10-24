import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { getCurrentAgent, login } from "./authService.js";
import "./AgentLogin.css";

export default function AgentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getCurrentAgent()) {
    return <Navigate to="/agent/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.error === "access_denied") {
        setError("Access denied. This account is not an agent account.");
      } else if (result.error) {
        setError("Invalid email or password");
      } else {
        navigate("/agent/dashboard", { replace: true });
      }
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="agent-login-page">
      <section className="agent-login-card" aria-labelledby="agent-login-title">
        <div className="agent-login-icon"><ShieldCheck size={26} /></div>
        <p className="agent-login-eyebrow">RENTBRIDGE FOR AGENTS</p>
        <h1 id="agent-login-title">Welcome back</h1>
        <p className="agent-login-subtitle">Sign in to your account.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="agent-email">Email address</label>
          <input
            id="agent-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="agent-password">Password</label>
          <div className="agent-password-field">
            <input
              id="agent-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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

          {error && <p className="agent-login-error" role="alert">{error}</p>}

          <button className="agent-login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="agent-login-signup">
          New to RentBridge? <Link to="/agent/signup">Create an agent account</Link>
        </p>
      </section>
    </main>
  );
}
