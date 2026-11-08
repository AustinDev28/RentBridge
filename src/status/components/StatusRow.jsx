import { useEffect, useState } from "react";
import { Check, CircleCheck, MoreHorizontal } from "lucide-react";

function makeRing(posts) {
  const gap = 2.5;
  const segment = 360 / Math.max(posts.length, 1);
  const stops = posts.flatMap((post, index) => {
    const segmentStart = index * segment;
    const segmentEnd = (index + 1) * segment;
    const start = segmentStart + gap / 2;
    const end = segmentEnd - gap / 2;
    const color = post.seen ? "var(--rb-ring-seen)" : "var(--rb-ring-unseen)";
    return [`transparent ${segmentStart}deg ${start}deg`, `${color} ${start}deg ${end}deg`, `transparent ${end}deg ${segmentEnd}deg`];
  });
  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function UpdateTime({ value, relative = false }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  const date = new Date(value);
  if (relative) {
    const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
    const label = minutes < 1 ? "now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
    return <span className="status-update-time">{label}</span>;
  }
  const sameDay = date.toDateString() === new Date(now).toDateString();
  const yesterday = date.toDateString() === new Date(now - 86400000).toDateString();
  const prefix = sameDay ? "Today" : yesterday ? "Yesterday" : date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });
  return <span className="status-update-time">{prefix}, {time}</span>;
}

function StatusAvatar({ agent, posts }) {
  return <span className="status-avatar-ring" style={{ background: makeRing(posts) }}>
    <span className="status-avatar-core">{agent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
  </span>;
}

export default function StatusRow({ group, onOpen, following, onFollow, onUnfollow, onMute, onProfile }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const latest = group.posts.reduce((best, post) => new Date(post.createdAt) > new Date(best.createdAt) ? post : best, group.posts[0]);
  return (
    <article className="status-row">
      <button className="status-row-open" type="button" onClick={() => onOpen(group)} aria-label={`View ${group.agent.name}'s ${group.posts.length} updates`}>
        <StatusAvatar agent={group.agent} posts={group.posts} />
        <span className="status-row-copy">
          <span className="status-row-name">{group.agent.name}{group.agent.verified && <CircleCheck size={15} aria-label="Verified agent" />}</span>
          <span className="status-row-time"><span className="status-row-area-type"><span>{latest.location || latest.area || group.agent.area || group.agent.location || "Lagos, Nigeria"}</span><span aria-hidden="true">·</span><span>{latest.type === "rent" ? "Rent" : "Buy"}</span><span aria-hidden="true">·</span><UpdateTime value={latest.createdAt} relative /></span>{group.unseenCount > 0 && <span className="status-unseen-count">{group.unseenCount} new</span>}</span>
        </span>
      </button>
      <div className="status-row-actions">
        <button className={`status-follow-button ${following ? "is-following" : ""}`} type="button" aria-pressed={following} onClick={following ? onUnfollow : onFollow}>{following ? <><Check size={14} /> Following</> : "Follow"}</button>
        <div className="status-row-menu-wrap">
          <button className="status-more-button" type="button" aria-label={`More options for ${group.agent.name}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={19} /></button>
          {menuOpen && <div className="status-row-menu" role="menu">
            <button type="button" role="menuitem" onClick={() => { onMute(); setMenuOpen(false); }}>Mute updates</button>
            {following && <button type="button" role="menuitem" onClick={() => { onUnfollow(); setMenuOpen(false); }}>Unfollow</button>}
            <button type="button" role="menuitem" onClick={() => { onProfile(group.agent); setMenuOpen(false); }}>View agent profile</button>
          </div>}
        </div>
      </div>
    </article>
  );
}

export { StatusAvatar };
