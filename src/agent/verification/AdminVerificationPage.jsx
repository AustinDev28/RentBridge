import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldAlert, X } from "lucide-react";
import { getSubmissions, reviewSubmission, suspendAgent } from "./verificationService.js";
import "./verification.css";

export default function AdminVerificationPage() {
  const [submissions, setSubmissions] = useState([]);
  const [reasons, setReasons] = useState({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => setSubmissions(await getSubmissions()), []);
  useEffect(() => {
    load();
    window.addEventListener("rentbridge-verification-updated", load);
    return () => window.removeEventListener("rentbridge-verification-updated", load);
  }, [load]);
  const pending = submissions.filter((item) => item.status === "pending_review");
  const verifiedAgents = [...new Map(submissions.filter((item) => item.level >= 2).map((item) => [item.agentId, item])).values()];

  const review = async (submission, decision) => {
    setNotice(""); setError("");
    const result = await reviewSubmission(submission.id, decision, reasons[submission.id] || "");
    if (result.error === "reason_required") { setError(`Add a rejection reason for ${submission.agent.name}.`); return; }
    if (result.error) { setError("That submission could not be reviewed."); return; }
    setReasons((current) => ({ ...current, [submission.id]: "" }));
    setNotice(`${submission.step === "identity" ? "Identity" : "Business"} submission ${decision === "approve" ? "approved" : "rejected"}.`);
    await load();
  };
  const suspend = async (agentId) => {
    const result = await suspendAgent(agentId);
    setNotice(result.error ? "The account could not be suspended." : "Account suspended. Its posts will no longer appear publicly.");
    await load();
  };

  return <main className="av-page av-admin-page">
    <header className="av-page-header"><div><p className="av-eyebrow">INTERNAL</p><h1>Verification review queue</h1><p>Review agent verification submissions.</p></div><Link className="av-secondary" to="/agent/dashboard">Back to dashboard</Link></header>
    <p className="av-feedback" aria-live="polite">{notice || error}</p>
    <section aria-labelledby="av-queue-title"><h2 id="av-queue-title">Pending submissions</h2>{pending.length ? <div className="av-submission-list">{pending.map((submission) => <article className="av-card av-submission" key={submission.id}>
      <div className="av-card-heading"><div><p className="av-step-kicker">{submission.step === "identity" ? "IDENTITY" : "BUSINESS"} SUBMISSION</p><h2>{submission.agent.name}</h2><p>{submission.agent.email} · {submission.agent.agencyName || "No agency name"}</p></div><span className="av-review-time">Pending review</span></div>
      <dl className="av-submission-details">{Object.entries(submission.details).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt>{key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)}</dt><dd>{value}</dd></div>)}</dl>
      <p className="av-file-list"><strong>File names:</strong> {submission.fileNames.length ? submission.fileNames.join(", ") : "None"}</p>
      <label htmlFor={`av-reject-${submission.id}`}>Rejection reason <span>(required to reject)</span></label>
      <textarea id={`av-reject-${submission.id}`} value={reasons[submission.id] || ""} maxLength={500} onChange={(event) => setReasons((current) => ({ ...current, [submission.id]: event.target.value }))} />
      <div className="av-admin-actions"><button className="av-primary" type="button" onClick={() => review(submission, "approve")}><Check size={16} />Approve</button><button className="av-danger-button" type="button" disabled={!reasons[submission.id]?.trim()} onClick={() => review(submission, "reject")}><X size={16} />Reject</button><button className="av-secondary" type="button" onClick={() => suspend(submission.agentId)}><ShieldAlert size={16} />Suspend agent</button></div>
    </article>)}</div> : <section className="av-card"><p>No submissions are waiting for review.</p></section>}</section>
    <section className="av-submission-list" aria-labelledby="av-suspension-title"><h2 id="av-suspension-title">Identity-verified agents</h2>{verifiedAgents.length ? verifiedAgents.map((agent) => <article className="av-card av-submission" key={agent.agentId}><div className="av-card-heading"><div><h2>{agent.agent.name}</h2><p>{agent.agent.email}</p></div><span className="av-review-time">Level {agent.level}{agent.suspended ? " · Suspended" : ""}</span></div><button className="av-danger-button" type="button" disabled={agent.suspended} onClick={() => suspend(agent.agentId)}><ShieldAlert size={16} />{agent.suspended ? "Already suspended" : "Suspend agent"}</button></article>) : <section className="av-card"><p>No identity-verified agents yet.</p></section>}</section>
  </main>;
}
