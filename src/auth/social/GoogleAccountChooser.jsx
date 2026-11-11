import { useEffect, useId, useRef } from "react";
import styles from "./social.module.css";

export default function GoogleAccountChooser({
  role, mode, accounts, selectedAccount, email, password, busy, error,
  onCancel, onChoose, onUseAnother, onEmailChange, onEmailSubmit,
  onPasswordChange, onLinkSubmit, onRetry,
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => { cancelRef.current = onCancel; }, [onCancel]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const getFocusable = () => [...(dialog?.querySelectorAll("button:not(:disabled), input:not(:disabled)") || [])];
    getFocusable()[0]?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelRef.current();
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
    <section ref={dialogRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={styles.sheetHeader}>
        <div className={styles.googleMark} aria-hidden="true">G</div>
        <button className={styles.closeButton} type="button" onClick={onCancel} aria-label="Cancel Google sign-in" disabled={busy}>×</button>
      </div>
      <h2 id={titleId}>{mode === "link" ? "Confirm it’s you" : mode === "email" ? "Use another account" : "Choose an account"}</h2>
      <p className={styles.sheetSubtitle}>{mode === "link"
        ? "An account with this email exists. Confirm it's you to link Google."
        : mode === "email"
          ? "Enter the email address for your account."
          : `Continue to RentBridge ${role === "agent" ? "agent sign-in" : "account sign-in"}.`}</p>

      {mode === "choose" && <div className={styles.accountList}>
        {accounts.map((account) => <button className={styles.accountOption} type="button" key={account.id} onClick={() => onChoose(account)} disabled={busy}>
          <span className={styles.accountAvatar} aria-hidden="true">{account.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>
          <span><strong>{account.name}</strong><small>{account.email}</small></span>
        </button>)}
        <button className={styles.accountOption} type="button" onClick={onUseAnother} disabled={busy}>
          <span className={`${styles.accountAvatar} ${styles.otherAvatar}`} aria-hidden="true">+</span>
          <span><strong>Use another account</strong><small>Sign in with a different email address</small></span>
        </button>
      </div>}

      {mode === "email" && <form className={styles.dialogForm} onSubmit={onEmailSubmit}>
        <label htmlFor={`${titleId}-email`}>Email address</label>
        <input id={`${titleId}-email`} type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} required disabled={busy} autoFocus />
        <button className={styles.primaryAction} type="submit" disabled={busy}>{busy ? "Signing you in…" : "Continue"}</button>
      </form>}

      {mode === "link" && <form className={styles.dialogForm} onSubmit={onLinkSubmit}>
        <div className={styles.selectedEmail}>{selectedAccount?.email || email}</div>
        <label htmlFor={`${titleId}-password`}>Confirm with your account password</label>
        <input id={`${titleId}-password`} type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required disabled={busy} autoFocus />
        <button className={styles.primaryAction} type="submit" disabled={busy}>{busy ? "Signing you in…" : "Confirm and link Google"}</button>
      </form>}

      {busy && <p className={styles.loadingMessage} role="status">Signing you in…</p>}
      {error && <div className={styles.errorBlock} role="alert"><p>{error}</p><button type="button" onClick={onRetry} disabled={busy}>Try again</button></div>}
      <button className={styles.cancelAction} type="button" onClick={onCancel} disabled={busy}>Cancel</button>
    </section>
  </div>;
}
