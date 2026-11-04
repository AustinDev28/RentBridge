import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { loginUser, registerUser, resetUserPassword } from "../../user/userAuthService.js";
import PasswordField from "../../user/PasswordField.jsx";
import { useUserPreferences } from "../../user/UserPreferences.jsx";
import "./UserAuth.css";

export default function UserAuth({ signup = false }) {
  const navigate = useNavigate();
  const { user, setUser } = useUserPreferences();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [confirmRecoveryPassword, setConfirmRecoveryPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryComplete, setRecoveryComplete] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    if (signup) {
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      const result = registerUser({ name, email, password });
      if (result.error === "email_in_use") return setError("An account with this email already exists.");
      setUser(result.user);
      navigate("/account", { replace: true });
      return;
    }

    const result = loginUser(email, password);
    if (result.error) return setError("We couldn't find a user account with those details.");
    setUser(result.user);
    navigate("/account", { replace: true });
  };

  const openRecovery = () => {
    setRecoveryEmail(email);
    setRecovering(true);
    setRecoveryComplete(false);
    setRecoveryError("");
  };

  const handleRecovery = (event) => {
    event.preventDefault();
    setRecoveryError("");
    if (recoveryPassword !== confirmRecoveryPassword) {
      setRecoveryError("The new passwords do not match.");
      return;
    }
    const result = resetUserPassword({ email: recoveryEmail, newPassword: recoveryPassword });
    if (result.error === "account_not_found") {
      setRecoveryError("We couldn't find an account with that email address.");
      return;
    }
    if (result.error === "password_too_short") {
      setRecoveryError("Password must be at least 8 characters.");
      return;
    }
    if (result.error) {
      setRecoveryError("Your password couldn't be changed. Please try again.");
      return;
    }
    setRecoveryComplete(true);
  };

  if (user) return <Navigate to="/account" replace />;

  return (
    <main className="user-auth-page">
      <section className="user-auth-card" aria-labelledby="user-auth-title">
        <Link className="user-auth-back" to="/" aria-label="Back to RentBridge feed"><ArrowLeft size={18} /></Link>
        <div className="user-auth-icon"><UserRound size={24} /></div>
        <p className="user-auth-eyebrow">RENTBRIDGE FOR HOME SEEKERS</p>
        <h1 id="user-auth-title">{recovering ? recoveryComplete ? "Password updated" : "Reset your password" : signup ? "Create your account" : "Welcome back"}</h1>
        <p className="user-auth-subtitle">{recovering ? recoveryComplete ? "You can now sign in with your new password." : "Enter your account email and choose a new password." : signup ? "Save homes and connect with trusted agents." : "Sign in to save homes and manage your profile."}</p>

        {recovering ? recoveryComplete ? <div className="user-auth-recovery-success" role="status"><p>Your password has been changed.</p><button type="button" className="user-auth-submit" onClick={() => { setEmail(recoveryEmail); setPassword(""); setRecovering(false); setRecoveryComplete(false); }}>Return to sign in</button></div> : <form onSubmit={handleRecovery}>
          <label htmlFor="recovery-email">Email address</label>
          <input id="recovery-email" type="email" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="you@example.com" required />
          <PasswordField id="recovery-password" label="New password" autoComplete="new-password" minLength={8} value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} placeholder="At least 8 characters" />
          <PasswordField id="recovery-password-confirm" label="Confirm new password" autoComplete="new-password" minLength={8} value={confirmRecoveryPassword} onChange={(event) => setConfirmRecoveryPassword(event.target.value)} placeholder="Enter your new password again" />
          {recoveryError && <p className="user-auth-error" role="alert">{recoveryError}</p>}
          <button className="user-auth-submit" type="submit">Update password</button>
          <button className="user-auth-text-button" type="button" onClick={() => setRecovering(false)}>Back to sign in</button>
        </form> : <form onSubmit={handleSubmit}>
          {signup && <><label htmlFor="user-name">Full name</label><input id="user-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required /></>}
          <label htmlFor="user-email">Email address</label>
          <input id="user-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          <PasswordField id="user-password" label="Password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={signup ? "At least 8 characters" : "Enter your password"} />
          {!signup && <button className="user-auth-forgot" type="button" onClick={openRecovery}>Forgot password?</button>}
          {error && <p className="user-auth-error" role="alert">{error}</p>}
          <button className="user-auth-submit" type="submit">{signup ? "Create account" : "Sign in"}</button>
        </form>}

        {!recovering && <>
          <p className="user-auth-switch">{signup ? "Already have an account?" : "New to RentBridge?"} <Link to={signup ? "/user/login" : "/user/signup"}>{signup ? "Sign in" : "Create a user account"}</Link></p>
          <p className="user-auth-agent">Are you an agent? <Link to="/agent/login">Agent sign in</Link></p>
        </>}
      </section>
    </main>
  );
}
