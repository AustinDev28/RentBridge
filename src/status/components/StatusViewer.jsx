import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { markSeen, recordStatusAction } from "../statusService.js";
import { formatStatusTime } from "../utils/statusTime.js";
import { requireSignup } from "../../user/requireSignup.js";

function getSequence(groups) {
  return groups.flatMap((group) => [...group.posts]
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((status, postIndex) => ({ group, status, postIndex, total: group.posts.length })));
}

function StatusContent({ status, agent }) {
  const navigate = useNavigate();
  const phone = (status.agentPhone || agent.phone || "+2348012345678").replace(/\D/g, "");
  const message = encodeURIComponent(`Hi ${agent.name}, I'm interested in the ${status.type === "rent" ? "rental" : "sale"} property in ${status.location}.`);
  return <>
    {status.mediaType === "video"
      ? <video className="status-viewer-photo" src={status.mediaUrl || status.imageUrl} aria-label={`${status.propertyType} video in ${status.location}`} autoPlay muted playsInline />
      : <img className="status-viewer-photo" src={status.mediaUrl || status.imageUrl} alt={`${status.propertyType} in ${status.location}`} draggable="false" />}
    <div className="status-viewer-gradient" />
    <div className="status-viewer-details">
      <span className={`status-viewer-type status-viewer-type-${status.type}`}>{status.type === "rent" ? "For rent" : "For sale"}</span>
      <strong className="status-viewer-price">₦{Number(status.price).toLocaleString("en-NG")}{status.type === "rent" && <small> / year</small>}</strong>
      <span className="status-viewer-location">{status.location}</span>
      <div className="status-viewer-features"><span>{status.beds || 0} beds</span><span>{status.propertyType || "Property"}</span><span>{Number(status.sqft ?? (typeof status.area === "number" ? status.area : 0)).toLocaleString("en-NG")} sqft</span></div>
      {status.caption && <p className="status-viewer-caption">{status.caption}</p>}
      <div className="status-viewer-ctas">
        <a href="/properties" className="status-view-property" onClick={(event) => { recordStatusAction(status.id, "propertyTapCount"); requireSignup(navigate, event); }}>View property</a>
        <a href={`https://wa.me/${phone}?text=${message}`} className="status-whatsapp" target="_blank" rel="noreferrer" onClick={(event) => { recordStatusAction(status.id, "contactTapCount"); requireSignup(navigate, event); }}>WhatsApp agent</a>
      </div>
    </div>
  </>;
}

function StatusHeader({ status, agent, onClose, onFollow, following, preview }) {
  const initials = agent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <header className="status-viewer-header">
    <span className="status-viewer-avatar">{initials}</span>
    <span className="status-viewer-agent"><strong>{agent.name}{agent.verified && <CircleCheck size={14} aria-label="Verified agent" />}</strong><small>{formatStatusTime(status.createdAt)}</small></span>
    {!preview && !following && <button className="status-viewer-follow" type="button" onClick={onFollow}>Follow</button>}
    {!preview && <button className="status-viewer-close" type="button" onClick={onClose} aria-label="Close status viewer"><X size={22} /></button>}
  </header>;
}

function ViewerPanel({ status, agent, progress, groupPosts, activePostIndex, onClose, onFollow, following, preview = false, ...pointerProps }) {
  return <section className={`status-viewer-panel ${preview ? "is-preview" : ""}`} aria-label={`${agent.name}'s property status`} {...pointerProps}>
    <div className="status-viewer-progress" aria-hidden="true">{groupPosts.map((post, index) => <span className="status-progress-track" key={post.id}><i style={{ width: index < activePostIndex ? "100%" : index === activePostIndex ? `${progress * 100}%` : "0%" }} /></span>)}</div>
    <StatusHeader status={status} agent={agent} onClose={onClose} onFollow={onFollow} following={following} preview={preview} />
    <StatusContent status={status} agent={agent} />
    <span className="status-viewer-side-hint status-viewer-side-hint-left" aria-hidden="true" />
    <span className="status-viewer-side-hint status-viewer-side-hint-right" aria-hidden="true" />
  </section>;
}

export function StatusPreview({ status, agent }) {
  return <div className="status-viewer-preview"><ViewerPanel status={status} agent={agent} progress={0} groupPosts={[status]} activePostIndex={0} preview /></div>;
}

export default function StatusViewer({ groups, startAgentId, startPostId, onClose, onFollow, isFollowing }) {
  const sequence = useMemo(() => getSequence(groups), [groups]);
  const firstIndex = sequence.findIndex(({ group, status }) => group.agent.id === startAgentId && (status.id === startPostId || !startPostId));
  const [index, setIndex] = useState(Math.max(0, firstIndex));
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);
  const holdTimer = useRef(null);
  const pointerStart = useRef(null);
  const held = useRef(false);
  const previousFocus = useRef(null);
  const current = sequence[index];
  const currentStatusId = current?.status.id;
  const currentExpiry = current?.status.expiresAt;
  const currentDuration = current?.status.mediaType === "video"
    ? Math.max(5000, Math.min(30000, (current.status.durationSeconds || 15) * 1000))
    : 5000;

  const move = useCallback((direction) => {
    const next = index + direction;
    if (next < 0) { elapsed.current = 0; setProgress(0); setIndex(0); return; }
    if (next >= sequence.length) { onClose(); return; }
    elapsed.current = 0;
    setProgress(0);
    setPaused(false);
    setIndex(next);
  }, [index, onClose, sequence.length]);

  useEffect(() => {
    if (!currentStatusId) return undefined;
    previousFocus.current = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.querySelector(".status-viewer-close")?.focus();
    return () => { document.body.style.overflow = oldOverflow; previousFocus.current?.focus?.(); };
  }, [currentStatusId]);

  useEffect(() => {
    if (!currentStatusId) return undefined;
    markSeen(currentStatusId);
    const nextStatus = sequence[index + 1]?.status;
    if (nextStatus?.imageUrl) { const nextImage = new window.Image(); nextImage.src = nextStatus.imageUrl; }
  }, [currentStatusId, index, sequence]);

  useEffect(() => {
    if (!currentExpiry || current?.status.isDemo) return undefined;
    const expiryTimer = window.setTimeout(() => move(1), Math.max(0, new Date(currentExpiry).getTime() - Date.now() + 20));
    return () => window.clearTimeout(expiryTimer);
  }, [currentExpiry, current?.status.isDemo, currentStatusId, move]);

  useEffect(() => {
    if (paused || !currentStatusId) return undefined;
    const timer = window.setInterval(() => {
      elapsed.current += 50;
      const value = Math.min(1, elapsed.current / currentDuration);
      setProgress(value);
      if (value >= 1) move(1);
    }, 50);
    return () => window.clearInterval(timer);
  }, [currentStatusId, currentDuration, move, paused]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === " ") { event.preventDefault(); setPaused((value) => !value); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [move, onClose]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);
  if (!current) return null;
  const groupPosts = sequence.filter((item) => item.group.agent.id === current.group.agent.id).map((item) => item.status);

  const onPointerDown = (event) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    held.current = false;
    holdTimer.current = window.setTimeout(() => { held.current = true; setPaused(true); }, 260);
  };
  const onPointerUp = (event) => {
    window.clearTimeout(holdTimer.current);
    if (!pointerStart.current) return;
    const deltaY = event.clientY - pointerStart.current.y;
    if (deltaY > 85) { onClose(); pointerStart.current = null; return; }
    if (held.current) setPaused(false);
    pointerStart.current = null;
  };
  const onSurfaceClick = (event) => {
    if (held.current || event.target.closest("a,button")) { held.current = false; return; }
    const rect = event.currentTarget.getBoundingClientRect();
    move(event.clientX > rect.left + rect.width / 2 ? 1 : -1);
  };

  return <div className="status-viewer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="status-viewer-shell" role="dialog" aria-modal="true" aria-label={`${current.group.agent.name}'s status`} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onClick={onSurfaceClick}>
      <ViewerPanel
        status={current.status}
        agent={current.group.agent}
        progress={progress}
        groupPosts={groupPosts}
        activePostIndex={current.postIndex}
        onClose={onClose}
        onFollow={() => onFollow(current.group.agent.id)}
        following={isFollowing(current.group.agent.id)}
      />
    </div>
  </div>;
}
