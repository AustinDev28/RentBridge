import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CircleCheck, MapPin, Menu, Search, UserRound, X } from "lucide-react";
import logo from "../../assets/logo.jpg";
import { getCurrentAgent } from "../../agent/authService.js";
import { useUserPreferences } from "../../user/UserPreferences.jsx";
import { USE_THEME_SYSTEM } from "../../theme/config.js";
import { useTheme } from "../../theme/useTheme.js";
import { USE_AREA_CHIPS } from "../config.js";
import StatusNotifications from "./StatusNotifications.jsx";
import StatusRow from "./StatusRow.jsx";
import StatusSearch from "./StatusSearch.jsx";
import StatusViewer from "./StatusViewer.jsx";
import { isStatusExpired } from "../utils/statusTime.js";
import { nearestAreaName } from "../utils/nearestArea.js";
import { readFeedPreferences, writeFeedPreferences } from "../utils/areaPreferences.js";
import { requireSignIn } from "../../user/requireSignIn.js";
import {
  followAgent, getAreas, getDemoUpdates, getFollowedAgentIds, getMutedUpdates, getMyStatuses,
  getRecentlyActiveAgents, getUpdates, muteAgent, requestBrowserNotifications, unfollowAgent, unmuteAgent,
} from "../statusService.js";
import "../status.css";

const FILTERS = [["all", "All"], ["following", "Following"], ["rent", "Rent"], ["buy", "Buy"]];

function groupByAgent(posts) {
  const groups = new Map();
  posts.forEach((post) => {
    if (!groups.has(post.agentId)) groups.set(post.agentId, { agent: post.agent, posts: [] });
    groups.get(post.agentId).posts.push(post);
  });
  return [...groups.values()].map((group) => {
    const postsByTime = group.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { ...group, posts: postsByTime, unseenCount: postsByTime.filter((post) => !post.seen).length, firstUnseenPostId: [...postsByTime].reverse().find((post) => !post.seen)?.id || [...postsByTime].at(-1)?.id };
  }).sort((a, b) => new Date(b.posts[0].createdAt) - new Date(a.posts[0].createdAt));
}

function StatusSkeletons() {
  return <div className="status-skeleton-list" aria-label="Loading updates">{[0, 1, 2, 3].map((item) => <div className="status-skeleton-row" key={item}><span /><div><i /><i /></div><b /></div>)}</div>;
}

function StatusSection({ title, groups, getRowProps }) {
  if (!groups.length) return null;
  return <section className="status-section" aria-label={title}><h2>{title}</h2><div className="status-rows">{groups.map((group) => <StatusRow key={group.agent.id} group={group} {...getRowProps(group)} />)}</div></section>;
}

function AreaPermissionDialog({ onClose, onUseLocation, busy }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return <div className="status-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="status-area-dialog" role="dialog" aria-modal="true" aria-labelledby="status-area-title">
      <button className="status-area-dialog-close" type="button" aria-label="Close location explanation" onClick={onClose}><X size={19} /></button>
      <span className="status-area-dialog-icon"><MapPin size={20} /></span>
      <h2 id="status-area-title">Find updates near you</h2>
      <p>Your browser will ask to use your location. RentBridge will use it once to choose the nearest area and will not save your exact coordinates.</p>
      <button className="status-primary-action" type="button" disabled={busy} onClick={onUseLocation}>{busy ? "Finding your area…" : "Use my location"}</button>
      <button className="status-secondary-action" type="button" ref={cancelRef} onClick={onClose}>Choose an area instead</button>
    </section>
  </div>;
}

function RecentlyActive({ agents, followingIds, onFollow, onUnfollow }) {
  if (!agents.length) return null;
  return <section className="status-recent-agents" aria-label="Recently active agents">
    <h2>Recently active agents</h2>
    <div className="status-recent-agent-list">{agents.map(({ agent }) => {
      const following = followingIds.includes(agent.id);
      return <article className="status-recent-agent" key={agent.id}>
        <span className="status-recent-agent-avatar" aria-hidden="true">{agent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
        <span className="status-recent-agent-name">{agent.name}{agent.verified && <CircleCheck size={14} aria-label="Verified agent" />}</span>
        <button className={`status-follow-button ${following ? "is-following" : ""}`} type="button" aria-label={`${following ? "Unfollow" : "Follow"} ${agent.name}`} aria-pressed={following} onClick={() => following ? onUnfollow(agent.id) : onFollow(agent.id)}>{following ? "Following" : "Follow"}</button>
      </article>;
    })}</div>
  </section>;
}

function NotificationOptIn({ onClose }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const enable = async () => {
    setBusy(true);
    const result = await requestBrowserNotifications();
    setMessage(result === "granted" ? "Browser notifications are enabled." : result === "denied" ? "Browser notifications were blocked. You can change this in browser settings." : "Browser notifications are unavailable in this browser.");
    setBusy(false);
  };
  return <div className="status-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="status-opt-in-dialog" role="dialog" aria-modal="true" aria-labelledby="status-opt-in-title"><button type="button" aria-label="Close" onClick={onClose}><X size={19} /></button><span className="status-opt-in-icon"><Bell size={20} /></span><h2 id="status-opt-in-title">Get notified about new updates?</h2><p>Browser notifications can alert you when an agent you follow posts while RentBridge is open. You can change your choice at any time in browser settings.</p>{message ? <p role="status">{message}</p> : <button type="button" className="status-primary-action" disabled={busy} onClick={enable}>{busy ? "Opening permission…" : "Enable browser notifications"}</button>}<button type="button" className="status-secondary-action" onClick={onClose}>Not now</button></section></div>;
}

function AgentProfileDialog({ agent, following, onFollow, onUnfollow, onClose }) {
  return <div className="status-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="status-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="status-profile-name"><button className="status-profile-close" type="button" aria-label="Close agent profile" onClick={onClose}><X size={19} /></button><span className="status-profile-avatar">{agent.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><h2 id="status-profile-name">{agent.name}{agent.verified && <CircleCheck size={17} aria-label="Verified agent" />}</h2><p>{agent.agency}</p><span className="status-profile-location">{agent.location || "Lagos, Nigeria"}</span><button type="button" className="status-primary-action" onClick={following ? onUnfollow : onFollow}>{following ? "Following" : "Follow agent"}</button></section></div>;
}

export default function StatusHome() {
  const navigate = useNavigate();
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const { user, theme: legacyTheme } = useUserPreferences();
  const { resolvedTheme } = useTheme();
  const theme = USE_THEME_SYSTEM ? resolvedTheme : legacyTheme;
  const agent = getCurrentAgent();
  const agentId = agent?.id;
  const [initialPreferences] = useState(() => readFeedPreferences(user?.id));
  const [filter, setFilter] = useState(() => USE_AREA_CHIPS ? (initialPreferences.type || "all") : "all");
  const [selectedArea, setSelectedArea] = useState(() => USE_AREA_CHIPS ? (initialPreferences.area || "") : "");
  const [updates, setUpdates] = useState([]);
  const [allUpdates, setAllUpdates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [recentlyActiveAgents, setRecentlyActiveAgents] = useState([]);
  const [demoUpdates, setDemoUpdates] = useState([]);
  const [mutedUpdates, setMutedUpdates] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMuted, setShowMuted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notificationPrompt, setNotificationPrompt] = useState(false);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [areaMessage, setAreaMessage] = useState("");

  const refresh = useCallback(async () => {
    const [posts, allPosts, demoPosts, mutedPosts, mine, areaOptions, recentAgents] = await Promise.all([
      getUpdates(USE_AREA_CHIPS ? { area: selectedArea, type: "all" } : "all"),
      USE_AREA_CHIPS ? getUpdates({ area: "", type: "all" }) : getUpdates("all"),
      getDemoUpdates(), getMutedUpdates(), agentId ? getMyStatuses(agentId) : Promise.resolve([]),
      USE_AREA_CHIPS ? getAreas() : Promise.resolve([]),
      USE_AREA_CHIPS ? getRecentlyActiveAgents({ area: selectedArea, type: filter }) : Promise.resolve([]),
    ]);
    setUpdates(posts);
    setAllUpdates(allPosts);
    setDemoUpdates(demoPosts);
    setMutedUpdates(mutedPosts);
    setFollowingIds(getFollowedAgentIds());
    setMyStatuses(mine);
    setAreas((current) => {
      if (!current.length) return areaOptions;
      const available = new Map(areaOptions.map((item) => [item.name, item]));
      const stableExisting = current.filter((item) => available.has(item.name)).map((item) => available.get(item.name));
      const newAreas = areaOptions.filter((item) => !current.some((old) => old.name === item.name));
      return [...stableExisting, ...newAreas];
    });
    if (selectedArea && !areaOptions.some((item) => item.name === selectedArea)) setSelectedArea("");
    setRecentlyActiveAgents(recentAgents);
    setLoading(false);
  }, [agentId, filter, selectedArea]);

  useEffect(() => {
    refresh();
    const listener = () => refresh();
    const storageListener = (event) => { if (event.key === "rentbridge-status-store") refresh(); };
    window.addEventListener("rentbridge-status-updated", listener);
    window.addEventListener("storage", storageListener);
    return () => { window.removeEventListener("rentbridge-status-updated", listener); window.removeEventListener("storage", storageListener); };
  }, [refresh]);

  useEffect(() => {
    const future = [...updates, ...mutedUpdates].map((post) => new Date(post.expiresAt).getTime()).filter((time) => time > Date.now());
    if (!future.length) return undefined;
    const timer = window.setTimeout(refresh, Math.min(...future) - Date.now() + 100);
    return () => window.clearTimeout(timer);
  }, [updates, mutedUpdates, refresh]);

  useEffect(() => {
    if (!USE_AREA_CHIPS) return;
    writeFeedPreferences({ area: selectedArea, type: filter });
  }, [selectedArea, filter]);

  const filteredUpdates = useMemo(() => updates.filter((post) => {
    if (filter === "following") return followingIds.includes(post.agentId);
    return filter === "all" || post.type === filter;
  }), [updates, filter, followingIds]);
  const groups = useMemo(() => groupByAgent(filteredUpdates), [filteredUpdates]);
  const allGroups = useMemo(() => groupByAgent(allUpdates), [allUpdates]);
  const demoGroups = useMemo(() => groupByAgent(demoUpdates.filter((post) => {
    if (filter === "following") return followingIds.includes(post.agentId);
    return (filter === "all" || post.type === filter) && (!USE_AREA_CHIPS || !selectedArea || post.area === selectedArea);
  })), [demoUpdates, filter, followingIds, selectedArea]);
  const recentGroups = groups.filter((group) => group.unseenCount > 0);
  const viewedGroups = groups.filter((group) => group.unseenCount === 0);
  const mutedGroups = useMemo(() => groupByAgent(mutedUpdates), [mutedUpdates]);
  const activeMine = myStatuses.filter((post) => post.status === "active" && !isStatusExpired(post));
  const seenTotal = activeMine.reduce((total, post) => total + (post.viewCount || 0), 0);

  const openViewer = (group, postId = group.firstUnseenPostId, demo = false) => { setSearchOpen(false); setProfile(null); setViewer({ agentId: group.agent.id, postId, demo }); };
  const openNotificationStatus = (agentId, statusId) => setViewer({ agentId, postId: statusId, demo: false });
  const handleFollow = async (agentId) => {
    if (!requireSignIn(navigate)) return;
    const result = await followAgent(agentId);
    await refresh();
    if (result.offerBrowserNotifications) setNotificationPrompt(true);
  };
  const handleUnfollow = async (agentId) => { await unfollowAgent(agentId); await refresh(); };
  const handleMute = async (agentId) => { await muteAgent(agentId); await refresh(); };
  const handleUnmute = async (agentId) => { await unmuteAgent(agentId); await refresh(); };
  const selectArea = (name) => { setAreaMessage(""); setSelectedArea(name); };
  const requestNearMe = () => {
    setAreaMessage("");
    if (!navigator.geolocation) { setAreaDialogOpen(false); setAreaMessage("Choose an area instead"); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const nearest = nearestAreaName(position.coords.latitude, position.coords.longitude, areas);
      if (nearest) selectArea(nearest);
      else setAreaMessage("Choose an area instead");
      setAreaDialogOpen(false);
      setLocationBusy(false);
    }, () => {
      setAreaMessage("Choose an area instead");
      setAreaDialogOpen(false);
      setLocationBusy(false);
    }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 });
  };
  const isFollowing = (agentId) => followingIds.includes(agentId);
  const profileFollowing = profile ? isFollowing(profile.id) : false;

  const rowActions = (group) => ({
    following: isFollowing(group.agent.id),
    onOpen: () => openViewer(group),
    onFollow: () => handleFollow(group.agent.id),
    onUnfollow: () => handleUnfollow(group.agent.id),
    onMute: () => handleMute(group.agent.id),
    onProfile: setProfile,
  });

  return <div className={`status-home ${USE_AREA_CHIPS ? "area-chips-enabled" : ""}`} data-theme={theme}>
    <header className="status-topbar"><div className="status-brand-group"><button className="status-menu-button" type="button" aria-label="Toggle menu" aria-expanded={siteMenuOpen} aria-controls="status-site-menu" onClick={() => setSiteMenuOpen((open) => !open)}><Menu size={21} /></button><Link className="status-brand" to="/" aria-label="RentBridge home"><img src={logo} alt="" /><span>RentBridge</span></Link></div><div className="status-top-actions"><button className="status-icon-button" type="button" aria-label="Search agents or areas" onClick={() => setSearchOpen(true)}><Search size={19} /></button><StatusNotifications onOpenStatus={openNotificationStatus} /><Link className="status-icon-button status-profile-link" to={user ? "/account" : "/user/login"} aria-label={user ? "Open account settings" : "Sign in"}><UserRound size={19} /></Link></div>{siteMenuOpen && <nav className="status-site-menu" id="status-site-menu" aria-label="Main menu"><Link to="/" onClick={() => setSiteMenuOpen(false)}>Home</Link><Link to="/properties" onClick={() => setSiteMenuOpen(false)}>Properties</Link><Link to="/about" onClick={() => setSiteMenuOpen(false)}>About</Link><Link to="/safetytips" onClick={() => setSiteMenuOpen(false)}>Safety Tips</Link><Link to="/agent/login" onClick={() => setSiteMenuOpen(false)}>Agents Login</Link><Link to="/account" onClick={() => setSiteMenuOpen(false)}>Account</Link></nav>}</header>

    <main className="status-home-main">
      {agent && <section className="status-my-status" aria-label="My status"><div className="status-my-avatar">{agent.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}<Link to="/agent/status" className="status-my-add" aria-label="Add a status">+</Link></div><div className="status-my-copy"><strong>My status</strong><span>{activeMine.length} active {activeMine.length === 1 ? "update" : "updates"} · Seen by {seenTotal}</span></div><Link to="/agent/status" className="status-my-manage">Manage status</Link></section>}

      {USE_AREA_CHIPS && <>
        <div className="status-area-chips" role="group" aria-label="Filter updates by area" tabIndex={0} onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
            event.currentTarget.scrollBy({ left: event.key === "ArrowRight" ? 150 : -150, behavior: reduceMotion ? "auto" : "smooth" });
          }
        }}>
          <button className="status-area-near-me" type="button" aria-pressed={false} onClick={() => setAreaDialogOpen(true)} aria-label="Find updates near me"><MapPin size={15} />Near me</button>
          <button type="button" className={!selectedArea ? "is-active" : ""} aria-pressed={!selectedArea} onClick={() => selectArea("")}>All areas</button>
          {areas.map((item) => <button type="button" key={item.name} className={selectedArea === item.name ? "is-active" : ""} aria-pressed={selectedArea === item.name} onClick={() => selectArea(item.name)}>{item.name}<small>{item.count}</small></button>)}
        </div>
        {areaMessage && <p className="status-area-message" role="status">{areaMessage}</p>}
      </>}

      <div className="status-filter-chips" role="group" aria-label="Filter status updates">
        {FILTERS.map(([key, label]) => <button type="button" key={key} className={`${filter === key ? "is-active" : ""} ${key === "following" ? "is-following-filter" : ""}`} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      </div>

      {loading ? <StatusSkeletons /> : <>
        {filter === "following" ? <section className="status-section" aria-label="Following"><h2>Following</h2>{recentGroups.length + viewedGroups.length ? <div className="status-rows">{groups.map((group) => <StatusRow key={group.agent.id} group={group} {...rowActions(group)} />)}</div> : followingIds.length && USE_AREA_CHIPS ? <div className="status-empty-card"><p className="status-empty">{selectedArea ? `No updates in ${selectedArea} right now` : "No updates right now"}</p><div className="status-empty-actions">{selectedArea && <button type="button" onClick={() => selectArea("")}>Show all areas</button>}<Link to="/properties">Browse properties</Link></div></div> : <p className="status-empty">{followingIds.length ? "No updates right now" : "Follow agents to see their updates here"}</p>}</section> : <>
          {!filteredUpdates.length ? (USE_AREA_CHIPS
            ? <section className="status-empty-card" aria-label="No matching updates"><p className="status-empty">{selectedArea ? `No updates in ${selectedArea} right now` : "No updates right now"}</p><div className="status-empty-actions">{selectedArea && <button type="button" onClick={() => selectArea("")}>Show all areas</button>}<Link to="/properties">Browse properties</Link></div></section>
            : <p className="status-empty status-empty-card">No updates right now</p>) : <>
            <StatusSection title="Recent updates" groups={recentGroups} getRowProps={rowActions} />
            <StatusSection title="Viewed updates" groups={viewedGroups} getRowProps={rowActions} />
          </>}
          {mutedGroups.length > 0 && <section className="status-muted-section"><button className="status-muted-toggle" type="button" aria-expanded={showMuted} onClick={() => setShowMuted((open) => !open)}><span>Muted updates <small>{mutedGroups.length}</small></span><span>{showMuted ? "−" : "+"}</span></button>{showMuted && <div className="status-rows">{mutedGroups.map((group) => <div className="status-muted-row" key={group.agent.id}><span className="status-muted-name">{group.agent.name}</span><button type="button" onClick={() => handleUnmute(group.agent.id)}>Unmute</button></div>)}</div>}</section>}
          <StatusSection title="More updates" groups={demoGroups} getRowProps={(group) => ({ ...rowActions(group), onOpen: () => openViewer(group, group.firstUnseenPostId, true) })} />
        </>}
        {USE_AREA_CHIPS && allGroups.length < 5 && <RecentlyActive agents={recentlyActiveAgents} followingIds={followingIds} onFollow={handleFollow} onUnfollow={handleUnfollow} />}
      </>}
    </main>

    {areaDialogOpen && <AreaPermissionDialog onClose={() => setAreaDialogOpen(false)} onUseLocation={requestNearMe} busy={locationBusy} />}
    {searchOpen && <StatusSearch groups={allGroups} onClose={() => setSearchOpen(false)} onOpen={(group) => openViewer(group)} />}
    {profile && <AgentProfileDialog agent={profile} following={profileFollowing} onClose={() => setProfile(null)} onFollow={() => handleFollow(profile.id)} onUnfollow={() => handleUnfollow(profile.id)} />}
    {notificationPrompt && <NotificationOptIn onClose={() => setNotificationPrompt(false)} />}
    {viewer && <StatusViewer groups={viewer.demo ? demoGroups : allGroups} startAgentId={viewer.agentId} startPostId={viewer.postId} onClose={() => setViewer(null)} onFollow={handleFollow} isFollowing={isFollowing} />}
  </div>;
}
