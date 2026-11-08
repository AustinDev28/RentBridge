import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, ShieldCheck, Upload } from "lucide-react";
import { getCurrentAgent } from "../authService.js";
import { saveDraft, submitBusiness, submitIdentity, VERIFICATION_DOCUMENT_MAX_BYTES, VERIFICATION_DOCUMENT_TYPES, VERIFICATION_ID_TYPES } from "./verificationService.js";
import { useVerification } from "./useVerification.js";
import VerificationBanner from "./VerificationBanner.jsx";
import "./verification.css";

function useFilePreview(file) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setUrl(""); return undefined; }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return url;
}

function StepStatus({ value }) {
  const label = value === "pending_review" ? "Pending review" : value === "not_started" ? "Not started" : value[0].toUpperCase() + value.slice(1);
  return <span className={`av-status av-status-${value}`}>{label}</span>;
}

function FileField({ id, label, file, onChange, accept = VERIFICATION_DOCUMENT_TYPES.join(","), capture, types = VERIFICATION_DOCUMENT_TYPES }) {
  const preview = useFilePreview(file);
  const [error, setError] = useState("");
  const select = (event) => {
    const next = event.target.files?.[0] || null;
    if (next && (!types.includes(next.type) || next.size > VERIFICATION_DOCUMENT_MAX_BYTES)) {
      setError(`Choose an allowed file type up to 5 MB.`);
      event.target.value = "";
      return;
    }
    setError("");
    onChange(next);
  };
  return <div className="av-file-field">
    <label htmlFor={id}>{label}</label>
    <span className="av-file-control"><Upload size={17} aria-hidden="true" /><span>{file?.name || "Choose a file"}</span><input id={id} type="file" accept={accept} capture={capture} aria-describedby={error ? `${id}-error` : undefined} onChange={select} /></span>
    {preview && <img className="av-file-preview" src={preview} alt={`${label} preview`} />}
    {error && <small id={`${id}-error`} className="av-error" role="alert">{error}</small>}
  </div>;
}

export default function VerificationPage() {
  const agent = getCurrentAgent();
  const { level, status, refresh } = useVerification(agent?.id);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [identity, setIdentity] = useState({ idType: VERIFICATION_ID_TYPES[0], idNumber: "", frontFile: null, backFile: null, selfieFile: null });
  const [business, setBusiness] = useState({ agencyName: agent?.agency || "", registrationNumber: "", officeAddress: "", membershipNumber: "", website: "", documentFile: null });
  const contact = status?.contact || {};
  const identityStatus = status?.identity || { status: "not_started" };
  const businessStatus = status?.business || { status: "not_started" };
  const currentStep = level === 0 ? 1 : level === 1 ? 2 : level === 2 ? 3 : 4;
  const tracker = useMemo(() => [
    { title: "Signed up", unlocks: "Access to your agent workspace", done: true },
    { title: "Contact verified", unlocks: "Submit identity documents", done: level >= 1 },
    { title: "Identity verified", unlocks: "Publish up to 2 posts per day", done: level >= 2 },
    { title: "Business verified", unlocks: "Publish up to 5 posts per day and show a verified badge", done: level >= 3 },
  ], [level]);

  useEffect(() => {
    if (!status) return;
    setBusiness((current) => ({ ...current, agencyName: status.business?.agencyName || current.agencyName, registrationNumber: status.business?.registrationNumber || current.registrationNumber, officeAddress: status.business?.officeAddress || current.officeAddress, membershipNumber: status.business?.membershipNumber || current.membershipNumber, website: status.business?.website || current.website }));
    setIdentity((current) => ({ ...current, idType: status.identity?.idType || current.idType }));
  }, [status]);

  const run = async (action, successMessage) => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await action();
      if (result?.error) {
        const messages = {
          duplicate_id: "This ID number has already been submitted for another account.",
          contact_required: "Verify your email and phone before submitting identity documents.",
          identity_required: "Identity verification must be approved before business verification.",
          storage_unavailable: "Progress could not be saved in this browser. Please try again.",
          invalid_submission: "Complete the required fields and choose valid files up to 5 MB.",
        };
        setError(messages[result.error] || "We couldn't save this step. Check your entries and try again.");
      } else {
        setNotice(successMessage);
        await refresh();
      }
      return result;
    } catch {
      setError("We couldn't save this step. Please try again.");
      return { error: "failed" };
    } finally { setBusy(false); }
  };

  const changeFile = (key, file) => setIdentity((current) => ({ ...current, [key]: file }));
  const submitIdentityForm = (event) => {
    event.preventDefault();
    run(async () => {
      const result = await submitIdentity({ agentId: agent.id, ...identity });
      if (!result.error) setIdentity((current) => ({ ...current, idNumber: "" }));
      return result;
    }, "Identity documents submitted. Review usually takes up to 24 hours.");
  };
  const submitBusinessForm = (event) => {
    event.preventDefault();
    run(() => submitBusiness({ agentId: agent.id, ...business }), "Business documents submitted. Review usually takes up to 24 hours.");
  };
  const saveForLater = (step, data) => run(() => saveDraft({ agentId: agent.id, step, data }), "Saved. You can continue later; reselect documents before submitting.");

  return <main className="av-page">
    <header className="av-page-header"><div><p className="av-eyebrow">AGENT WORKSPACE</p><h1>Agent verification</h1><p>Complete each level to unlock more tools and build trust with renters and buyers.</p></div><Link className="av-secondary" to="/agent/dashboard">Back to dashboard</Link></header>
    {status?.suspended && <VerificationBanner suspended />}

    <section className="av-card av-progress-card" aria-labelledby="av-progress-title">
      <div className="av-card-heading"><div><h2 id="av-progress-title">Your verification progress</h2><p>Current level: <strong>Level {level} — {tracker[level]?.title || "Signed up"}</strong></p></div><span className="av-review-time">Usually within 24 hours</span></div>
      <ol className="av-progress-list" aria-label="Verification levels">{tracker.map((step, index) => <li key={step.title} className={step.done ? "is-complete" : index + 1 === currentStep ? "is-current" : ""} aria-current={index + 1 === currentStep ? "step" : undefined}><span className="av-step-mark">{step.done ? <Check size={16} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}</span><span><strong>Level {index} · {step.title}</strong><small>{step.unlocks}</small></span></li>)}</ol>
    </section>

    <p className="av-feedback" aria-live="polite">{notice || error}</p>

    <section className="av-card" aria-labelledby="av-contact-title">
      <div className="av-card-heading"><div><p className="av-step-kicker">STEP 1</p><h2 id="av-contact-title">Confirm your contact details</h2><p>Confirm your email and the phone number supplied at sign-up.</p></div><StepStatus value={contact.status || "not_started"} /></div>
      {contact.status === "rejected" && <p className="av-rejection">{contact.reason || "Contact verification was rejected."}</p>}
      <div className="av-contact-actions">
        <div><strong>Email confirmation</strong><p>{contact.emailVerified ? "Email confirmed." : "Email and phone confirmation are required before identity verification."}</p></div>
        <div><strong>Phone confirmation</strong><p>{contact.phoneVerified ? "Phone number confirmed." : "Phone confirmation is required before identity verification."}</p></div>
      </div>
      <div className="av-card-footer"><button className="av-secondary" type="button" onClick={() => run(() => refresh(), "Your progress is saved. You can continue later.")}>Save and continue later</button>{contact.emailVerified && contact.phoneVerified && <StepStatus value="approved" />}</div>
    </section>

    <section className="av-card" aria-labelledby="av-identity-title">
      <div className="av-card-heading"><div><p className="av-step-kicker">STEP 2</p><h2 id="av-identity-title">Verify your identity</h2><p>Review usually takes up to 24 hours.</p></div><StepStatus value={identityStatus.status || "not_started"} /></div>
      {identityStatus.status === "rejected" && <div className="av-rejection"><p>{identityStatus.reason || "Identity verification was rejected."}</p><button className="av-secondary" type="button" onClick={() => document.getElementById("av-id-type")?.focus()}>Resubmit</button></div>}
      <p className="av-privacy-note"><ShieldCheck size={18} aria-hidden="true" /><span>Why we ask: identity checks help protect clients from impersonation and scams. Verification details, document file names, and a one-way duplicate-check fingerprint are saved in this browser. Raw ID numbers and document contents are not saved.</span></p>
      {identityStatus.status === "approved" ? <p className="av-success-note" role="status">Your identity is approved. You can publish up to 2 posts per day.</p> : <form className="av-form" onSubmit={submitIdentityForm}>
        <label htmlFor="av-id-type">ID type</label><select id="av-id-type" value={identity.idType} onChange={(event) => setIdentity((current) => ({ ...current, idType: event.target.value }))} disabled={busy || identityStatus.status === "pending_review"}>{VERIFICATION_ID_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
        <label htmlFor="av-id-number">ID number <small>(used only to check for duplicates; never saved as entered)</small></label><input id="av-id-number" autoComplete="off" value={identity.idNumber} onChange={(event) => setIdentity((current) => ({ ...current, idNumber: event.target.value }))} disabled={busy || identityStatus.status === "pending_review"} required />
        <div className="av-file-grid"><FileField id="av-id-front" label="ID front" file={identity.frontFile} onChange={(file) => changeFile("frontFile", file)} /><FileField id="av-id-back" label="ID back" file={identity.backFile} onChange={(file) => changeFile("backFile", file)} /></div>
        <div className="av-file-grid"><FileField id="av-selfie-camera" label="Take selfie (camera on supported devices)" file={identity.selfieFile} onChange={(file) => changeFile("selfieFile", file)} accept="image/jpeg,image/png,image/webp" capture="user" types={["image/jpeg", "image/png", "image/webp"]} /><FileField id="av-selfie-upload" label="Or upload a selfie" file={identity.selfieFile} onChange={(file) => changeFile("selfieFile", file)} accept="image/jpeg,image/png,image/webp" types={["image/jpeg", "image/png", "image/webp"]} /></div>
        <small className="av-muted">ID files: JPG, PNG, WebP, or PDF up to 5 MB each. Selfie: JPG, PNG, or WebP up to 5 MB.</small>
        <div className="av-card-footer"><button className="av-secondary" type="button" disabled={busy} onClick={() => saveForLater("identity", identity)}>Save and continue later</button><button className="av-primary" type="submit" disabled={busy || level < 1 || identityStatus.status === "pending_review"}>{identityStatus.status === "rejected" ? "Resubmit identity" : "Submit identity"}</button></div>
      </form>}
    </section>

    <section className={`av-card ${level < 2 ? "is-locked" : ""}`} aria-labelledby="av-business-title">
      <div className="av-card-heading"><div><p className="av-step-kicker">STEP 3</p><h2 id="av-business-title">Verify your business</h2><p>Review usually takes up to 24 hours.</p></div><StepStatus value={businessStatus.status || "not_started"} /></div>
      {level < 2 && <p className="av-muted">Business verification opens after identity approval.</p>}
      {businessStatus.status === "rejected" && <div className="av-rejection"><p>{businessStatus.reason || "Business verification was rejected."}</p><button className="av-secondary" type="button" onClick={() => document.getElementById("av-business-agency")?.focus()}>Resubmit</button></div>}
      {businessStatus.status === "approved" ? <p className="av-success-note" role="status">Business approved. Your verified badge is active.</p> : <form className="av-form" onSubmit={submitBusinessForm}>
        <label htmlFor="av-business-agency">Agency or company name</label><input id="av-business-agency" value={business.agencyName} onChange={(event) => setBusiness((current) => ({ ...current, agencyName: event.target.value }))} disabled={busy || level < 2 || businessStatus.status === "pending_review"} required />
        <label htmlFor="av-registration">Registration number</label><input id="av-registration" value={business.registrationNumber} onChange={(event) => setBusiness((current) => ({ ...current, registrationNumber: event.target.value }))} disabled={busy || level < 2 || businessStatus.status === "pending_review"} required />
        <label htmlFor="av-address">Office address</label><textarea id="av-address" value={business.officeAddress} onChange={(event) => setBusiness((current) => ({ ...current, officeAddress: event.target.value }))} disabled={busy || level < 2 || businessStatus.status === "pending_review"} required />
        <label htmlFor="av-membership">Professional membership number <small>(optional)</small></label><input id="av-membership" value={business.membershipNumber} onChange={(event) => setBusiness((current) => ({ ...current, membershipNumber: event.target.value }))} disabled={busy || level < 2 || businessStatus.status === "pending_review"} />
        <label htmlFor="av-website">Website or social page <small>(optional)</small></label><input id="av-website" type="url" placeholder="https://" value={business.website} onChange={(event) => setBusiness((current) => ({ ...current, website: event.target.value }))} disabled={busy || level < 2 || businessStatus.status === "pending_review"} />
        <FileField id="av-business-document" label="Registration document" file={business.documentFile} onChange={(file) => setBusiness((current) => ({ ...current, documentFile: file }))} />
        <small className="av-muted">Business verification details and the document file name are saved in this browser.</small>
        <div className="av-card-footer"><button className="av-secondary" type="button" disabled={busy} onClick={() => saveForLater("business", business)}>Save and continue later</button><button className="av-primary" type="submit" disabled={busy || level < 2 || businessStatus.status === "pending_review"}>{businessStatus.status === "rejected" ? "Resubmit business" : "Submit business"}</button></div>
      </form>}
    </section>
  </main>;
}
