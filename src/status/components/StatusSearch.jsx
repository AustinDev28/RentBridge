import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

export default function StatusSearch({ groups, onClose, onOpen }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  const matches = groups.filter((group) => `${group.agent.name} ${group.agent.agency} ${group.agent.location}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="status-search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="status-search-dialog" role="dialog" aria-modal="true" aria-labelledby="status-search-title">
      <header><h2 id="status-search-title">Find an agent or area</h2><button type="button" aria-label="Close search" onClick={onClose}><X size={20} /></button></header>
      <label className="status-search-input"><Search size={18} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search agents or Lagos areas" /></label>
      <div className="status-search-results">{matches.length ? matches.map((group) => <button type="button" key={group.agent.id} onClick={() => onOpen(group)}><span className="status-search-avatar">{group.agent.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><span><strong>{group.agent.name}</strong><small>{group.agent.agency} · {group.agent.location}</small></span><small>{group.posts.length} {group.posts.length === 1 ? "update" : "updates"}</small></button>) : <p>No agents or areas found.</p>}</div>
    </section>
  </div>;
}
