import { useRef, useState } from "react";
import * as agentAuth from "../../agent/authService.js";
import * as userAuth from "../../user/userAuthService.js";
import { getGoogleAccountChoices } from "./socialService.js";
import GoogleAccountChooser from "./GoogleAccountChooser.jsx";
import styles from "./social.module.css";

const GOOGLE_SIGNIN_AVAILABLE = false;

function nameFromEmail(email) {
  return String(email || "").split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) || "RentBridge member";
}

function errorMessage(code) {
  if (code === "link_required") return "An account with this email exists. Confirm it's you to link Google.";
  if (code === "link_confirmation_failed") return "We couldn't confirm that account. Check your password and try again.";
  if (code === "network_error") return "You appear to be offline. Check your connection and retry.";
  if (code === "popup_blocked") return "Your browser blocked the sign-in window. Allow pop-ups for this site and retry.";
  if (code === "mock_account_unavailable") return "We couldn't find an account for that email. Check the address and try again.";
  if (code === "storage_unavailable") return "Your sign-in could not be saved in this browser. Please retry.";
  return "We couldn't sign you in. Please retry.";
}

export function SocialSignInDivider() {
  return <div className={styles.divider} aria-hidden="true"><span>or</span></div>;
}

export default function GoogleSignInButton({ role, onSuccess, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("choose");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const retryRef = useRef(null);
  const focusReturnRef = useRef(null);
  const auth = role === "agent" ? agentAuth : userAuth;

  const openChooser = () => {
    focusReturnRef.current = document.activeElement;
    setError("");
    setNotice("");
    setMode("choose");
    setOpen(true);
  };

  const closeChooser = () => {
    if (busy) return;
    setOpen(false);
    setPassword("");
    setNotice("Google sign-in cancelled. You can try again.");
    window.requestAnimationFrame(() => focusReturnRef.current?.focus?.());
  };

  const finish = async (result) => {
    const account = result?.agent || result?.user;
    if (!account) {
      setError("We couldn't open that account. Please retry.");
      setBusy(false);
      return;
    }
    setOpen(false);
    setPassword("");
    await onSuccess(account);
  };

  const performSignIn = async (account) => {
    setBusy(true);
    setError("");
    setSelectedAccount(account);
    retryRef.current = () => performSignIn(account);
    try {
      const result = await auth.signInWithGoogle({ email: account.email, name: account.name });
      if (result?.error === "link_required") {
        setMode("link");
        setPassword("");
        setBusy(false);
        return;
      }
      if (result?.error) {
        setError(errorMessage(result.error));
        setBusy(false);
        return;
      }
      await finish(result);
    } catch {
      setError(errorMessage("network_error"));
      setBusy(false);
    }
  };

  const selectManualEmail = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const account = { id: normalizedEmail, email: normalizedEmail, name: nameFromEmail(normalizedEmail) };
    await performSignIn(account);
  };

  const confirmLink = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const emailToLink = selectedAccount?.email || email.trim().toLowerCase();
    retryRef.current = () => confirmLink({ preventDefault() {} });
    try {
      const result = await auth.linkGoogleAccount({ email: emailToLink, password });
      if (result?.error) {
        setError(errorMessage(result.error));
        setBusy(false);
        return;
      }
      await finish(result);
    } catch {
      setError(errorMessage("network_error"));
      setBusy(false);
    }
  };

  const retry = () => retryRef.current?.();

  return <>
    <button className={styles.googleButton} type="button" onClick={openChooser} disabled={disabled || busy || !GOOGLE_SIGNIN_AVAILABLE} aria-label="Continue with Google">
      <svg className={styles.googleLogo} viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.47-4.73 7.16l7.65 5.93c4.47-4.13 7.15-10.2 7.15-17.56Z" />
        <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.96 23.96 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 5)" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.65-5.93c-2.13 1.43-4.86 2.27-8.25 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z" />
      </svg>
      <span>{busy ? "Signing you in…" : "Continue with Google"}</span>
    </button>
    {!GOOGLE_SIGNIN_AVAILABLE && <p className={styles.cancelNotice} role="status">Google sign-in will be available when connected.</p>}
    {notice && <p className={styles.cancelNotice} role="status">{notice}</p>}
    {open && <GoogleAccountChooser
      role={role}
      mode={mode}
      accounts={getGoogleAccountChoices()}
      selectedAccount={selectedAccount}
      email={email}
      password={password}
      busy={busy}
      error={error}
      onCancel={closeChooser}
      onChoose={performSignIn}
      onUseAnother={() => { setError(""); setMode("email"); }}
      onEmailChange={setEmail}
      onEmailSubmit={selectManualEmail}
      onPasswordChange={setPassword}
      onLinkSubmit={confirmLink}
      onRetry={retry}
    />}
  </>;
}
