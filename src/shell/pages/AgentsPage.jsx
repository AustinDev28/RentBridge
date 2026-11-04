import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, CircleCheck, Search, X } from "lucide-react";
import StatusViewer from "../../status/components/StatusViewer.jsx";
import { getDirectoryAgents, getUpdates, toggleAgentFollow } from "../agentDirectoryService.js";
import { getAgentProfile } from "../../status/statusService.js";
import { useTheme } from "../../theme/useTheme.js";

const FILTERS = ["All", "Verified", "Following"];

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";
  const [viewer, setViewer] = useState(null);
  const [profile, setProfile] = useState(null);
  const { resolvedTheme } = useTheme();

  const load = async () => {
    const [directory, posts] = await Promise.all([getDirectoryAgents(), getUpdates("all")]);
    setAgents(directory);
    setUpdates(posts);
  };
  useEffect(() => {
    load();
    window.addEventListener("rentbridge-status-updated", load);
    return () => window.removeEventListener("rentbridge-status-updated", load);
  }, []);

  const visibleAgents = useMemo(() => agents.filter((agent) => {
    const matchesFilter = filter === "All" || (filter === "Verified" ? agent.verified : agent.following);
    const matchesQuery = `${agent.name} ${agent.areas.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  }), [agents, filter, query]);
  const groups = useMemo(() => {
    const byAgent = new Map();
    updates.forEach((post) => {
      if (!byAgent.has(post.agentId)) byAgent.set(post.agentId, { agent: getAgentProfile(post.agentId), posts: [] });
      byAgent.get(post.agentId).posts.push(post);
    });
    return [...byAgent.values()];
  }, [updates]);

  const openAgent = (agentId) => {
    const group = groups.find((entry) => entry.agent.id === agentId);
    if (group) setViewer({ agentId, postId: [...group.posts].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0].id });
  };

  return <main className="shell-page shell-agents-page" data-theme={resolvedTheme}>
    <h1>Agents</h1>
    <label className="shell-search-field"><Search size={18} /><span className="shell-sr-only">Search agents or areas</span><input value={query} onChange={(event) => setSearchParams(event.target.value ? { search: event.target.value } : {})} placeholder="Search agents or areas" /></label>
    <div className="shell-filter-row" role="group" aria-label="Filter agents">{FILTERS.map((item) => <button type="button" key={item} className={filter === item ? "is-active" : ""} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="shell-agent-list">{visibleAgents.map((agent) => {
      const statusGroup = groups.find((entry) => entry.agent.id === agent.id);
      return <article className="shell-agent-card" key={agent.id}>
        <button className="shell-agent-open" type="button" onClick={() => statusGroup ? openAgent(agent.id) : setProfile(agent)} aria-label={`${agent.activePostCount ? "View updates from" : "View profile for"} ${agent.name}`}>
          <span className="shell-agent-avatar">{agent.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span>
          <span className="shell-agent-copy"><strong>{agent.name}{agent.verified && <CircleCheck size={16} aria-label="Verified" />}</strong><small>{agent.areas.join(", ")}</small><small>{agent.activePostCount} active {agent.activePostCount === 1 ? "post" : "posts"}</small></span>
        </button>
        <button className={`shell-follow-button ${agent.following ? "is-following" : ""}`} type="button" onClick={async () => { await toggleAgentFollow(agent.id, agent.following); await load(); }} aria-pressed={agent.following}>{agent.following ? <><Check size={15} /> Following</> : "Follow"}</button>
      </article>;
    })}{visibleAgents.length === 0 && <p className="shell-empty">No agents match your search.</p>}</div>
    {profile && <div className="shell-search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setProfile(null)}><section className="shell-agent-profile" role="dialog" aria-modal="true" aria-labelledby="shell-agent-profile-name"><button className="shell-agent-profile-close" type="button" aria-label="Close agent profile" onClick={() => setProfile(null)}><X size={20} /></button><span className="shell-agent-avatar">{profile.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><h2 id="shell-agent-profile-name">{profile.name}{profile.verified && <CircleCheck size={16} aria-label="Verified" />}</h2><p>Areas covered: {profile.areas.join(", ")}</p><Link className="shell-primary-button" to="/agents" onClick={() => setProfile(null)}>Browse agents</Link></section></div>}
    {viewer && <StatusViewer groups={groups} startAgentId={viewer.agentId} startPostId={viewer.postId} onClose={() => setViewer(null)} onFollow={async (agentId) => { const current = agents.find((entry) => entry.id === agentId); await toggleAgentFollow(agentId, current?.following); await load(); }} isFollowing={(agentId) => Boolean(agents.find((entry) => entry.id === agentId)?.following)} />}
  </main>;
}
