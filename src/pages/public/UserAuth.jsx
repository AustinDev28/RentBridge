import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { loginUser, registerUser } from "../../user/userAuthService.js";
import { useUserPreferences } from "../../user/UserPreferences.jsx";
import "./UserAuth.css";

export default function UserAuth({ signup = false }) {
  const navigate = useNavigate();
  const { user, setUser } = useUserPreferences();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (signup) {
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      const result = registerUser({ name, email, password });
      if (result.error === "email_in_use") return setError("An account with this email already exists.");
      setUser(result.user);
      navigate("/user/profile", { replace: true });
      return;
    }

    const result = loginUser(email, password);
    if (result.error) return setError("We couldn’t find a user account with those details.");
    setUser(result.user);
    navigate("/user/profile", { replace: true });
  };

  if (user) return <Navigate to="/user/profile" replace />;

  return (
    <main className="user-auth-page">
      <section className="user-auth-card" aria-labelledby="user-auth-title">
        <Link className="user-auth-back" to="/" aria-label="Back to RentBridge feed"><ArrowLeft size={18} /></Link>
        <div className="user-auth-icon"><UserRound size={24} /></div>
        <p className="user-auth-eyebrow">RENTBRIDGE FOR HOME SEEKERS</p>
        <h1 id="user-auth-title">{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="user-auth-subtitle">{signup ? "Save homes and connect with trusted agents." : "Sign in to save homes and manage your profile."}</p>
        <form onSubmit={handleSubmit}>
          {signup && <><label htmlFor="user-name">Full name</label><input id="user-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required /></>}
          <label htmlFor="user-email">Email address</label>
          <input id="user-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          <label htmlFor="user-password">Password</label>
          <input id="user-password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signup ? "At least 8 characters" : "Enter your password"} required />
          {error && <p className="user-auth-error" role="alert">{error}</p>}
          <button className="user-auth-submit" type="submit">{signup ? "Create account" : "Sign in"}</button>
        </form>
        <p className="user-auth-switch">{signup ? "Already have an account?" : "New to RentBridge?"} <Link to={signup ? "/user/login" : "/user/signup"}>{signup ? "Sign in" : "Create a user account"}</Link></p>
        {!signup && <p className="user-auth-demo">Demo user: austin@demo.com · demo12345</p>}
        <p className="user-auth-agent">Are you an agent? <Link to="/agent/login">Agent sign in</Link></p>
      </section>
    </main>
  );
}
