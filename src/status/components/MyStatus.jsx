import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Eye, MessageCircle, MousePointerClick, Trash2, Video } from "lucide-react";
import { getCurrentAgent } from "../../agent/authService.js";
import { deletePost, getMyStatuses } from "../statusService.js";
import { isStatusExpired } from "../utils/statusTime.js";

function RemainingTime({ expiresAt }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  const minutes = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 60000));
  return <span>{Math.floor(minutes / 60)}h {minutes % 60}m left</span>;
}

export default function MyStatus() {
  const agent = getCurrentAgent();
  const [posts, setPosts] = useState([]);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("active");
  const load = useCallback(async () => setPosts(await getMyStatuses(agent.id)), [agent?.id]);
  useEffect(() => {
    load();
    window.addEventListener("rentbridge-status-updated", load);
    return () => window.removeEventListener("rentbridge-status-updated", load);
  }, [load]);
  const remove = async (postId) => { await deletePost(postId); setNotice("Status deleted."); await load(); };
  const isActive = (post) => post.status === "active" && !isStatusExpired(post);
  const activePosts = useMemo(() => posts.filter(isActive), [posts]);
  const pastPosts = useMemo(() => posts.filter((post) => !isActive(post)), [posts]);
  const visiblePosts = tab === "active" ? activePosts : pastPosts;

  return <section className="status-my-list-card" aria-labelledby="status-my-list-title">
    <header><div><h2 id="status-my-list-title">My status</h2><p>Manage statuses and see how people engage with them.</p></div><span>{activePosts.length} active</span></header>
    <div className="status-my-tabs" role="tablist" aria-label="Your status posts">
      <button type="button" role="tab" aria-selected={tab === "active"} className={tab === "active" ? "is-active" : ""} onClick={() => setTab("active")}>Active <span>{activePosts.length}</span></button>
      <button type="button" role="tab" aria-selected={tab === "past"} className={tab === "past" ? "is-active" : ""} onClick={() => setTab("past")}>Past <span>{pastPosts.length}</span></button>
    </div>
    {notice && <p className="status-delete-notice" role="status">{notice}</p>}
    {visiblePosts.length ? <div className="status-my-list">{visiblePosts.map((post) => {
      const active = isActive(post);
      return <article className="status-my-item" key={post.id}>
        <span className="status-my-thumb">{post.mediaType === "video" ? <video src={post.mediaUrl} muted playsInline preload="metadata" aria-label="Status video preview" /> : <img src={post.mediaUrl || post.imageUrl} alt="" />}{post.mediaType === "video" && <Video size={15} aria-hidden="true" />}</span>
        <div className="status-my-item-copy">
          <strong>{post.location}</strong>
          <span>{post.type === "rent" ? "For rent" : "For sale"} · ₦{Number(post.price).toLocaleString("en-NG")}</span>
          {post.caption && <span className="status-my-caption">{post.caption}</span>}
          <small className={active ? "" : "is-expired"}><Clock3 size={13} />{active ? <RemainingTime expiresAt={post.expiresAt} /> : "Expired"}</small>
          <div className="status-my-stats"><small><Eye size={13} /> {post.seenByCount || post.viewCount || 0} views</small><small><MousePointerClick size={13} /> {post.propertyTapCount || 0} property taps</small><small><MessageCircle size={13} /> {post.contactTapCount || 0} WhatsApp taps</small></div>
        </div>
        <button className="status-delete-button" type="button" aria-label={`Delete status for ${post.location}`} onClick={() => remove(post.id)}><Trash2 size={16} /></button>
      </article>;
    })}</div> : <p className="status-my-empty">{tab === "active" ? "You have no active statuses." : "Your expired statuses will appear here."}</p>}
  </section>;
}
