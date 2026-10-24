import { useMemo, useState } from "react";
import {
  Building2, ChartNoAxesCombined, Check, ChevronDown, CircleUserRound,
  FilePlus2, Inbox, LayoutDashboard, LogOut, Menu, Search, Settings,
  ShieldCheck, SlidersHorizontal, Trash2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAgentWorkspace, getCurrentAgent, logout, saveAgentProfile,
  saveAgentWorkspaceSection,
} from "./authService.js";
import "./AgentDashboard.css";

const SECTIONS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "listings", label: "My Listings", icon: Building2 },
  { id: "add", label: "Add Property", icon: FilePlus2 },
  { id: "messages", label: "Messages", icon: Inbox },
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "settings", label: "Settings", icon: Settings },
];

const EMPTY_LISTING = {
  title: "", listingType: "rent", category: "Apartment", price: "", location: "",
  beds: "", baths: "", sqft: "", description: "", amenities: "", contactPhone: "",
};

const money = (amount) => `₦${Number(amount || 0).toLocaleString("en-NG")}`;
const listingTypeLabel = (type) => type === "rent" ? "For rent" : "For sale";

export default function AgentDashboard() {
  const navigate = useNavigate();
  const agent = getCurrentAgent();
  const [workspace, setWorkspace] = useState(() => getAgentWorkspace(agent?.id));
  const [section, setSection] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [listingFilter, setListingFilter] = useState("All listings");
  const [form, setForm] = useState(EMPTY_LISTING);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeMessage, setActiveMessage] = useState(null);
  const [reply, setReply] = useState("");
  const [profile, setProfile] = useState(() => ({
    name: agent?.name || "",
    email: agent?.email || "",
    ...workspace.profile,
  }));

  const persist = (key, value) => {
    const saved = saveAgentWorkspaceSection(agent.id, key, value);
    setWorkspace(saved);
  };

  const openSection = (id) => {
    setSection(id);
    setNotice("");
    setMobileNavOpen(false);
    if (id !== "messages") setActiveMessage(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const listings = workspace.listings || [];
  const messages = workspace.messages || [];
  const unreadCount = messages.filter((message) => message.unread).length;
  const activeCount = listings.filter((listing) => listing.status === "Active").length;
  const filteredListings = useMemo(() => listings.filter((listing) => {
    const matchesFilter = listingFilter === "All listings" || listing.status === listingFilter;
    const value = `${listing.title} ${listing.location} ${listing.category}`.toLowerCase();
    return matchesFilter && value.includes(query.toLowerCase());
  }), [listings, listingFilter, query]);

  const submitListing = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.location.trim() || Number(form.price) <= 0) {
      setFormError("Add a property title, location, and a valid price to continue.");
      return;
    }
    const listing = {
      ...form,
      id: `listing-${Date.now()}`,
      title: form.title.trim(),
      location: form.location.trim(),
      price: Number(form.price),
      beds: Number(form.beds || 0),
      baths: Number(form.baths || 0),
      sqft: Number(form.sqft || 0),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      status: "Pending review",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist("listings", [listing, ...listings]);
    setForm(EMPTY_LISTING);
    setFormError("");
    setNotice("Property submitted. It is pending review.");
    setSection("listings");
  };

  const changeListingStatus = (listing) => {
    const nextStatus = listing.status === "Paused" ? "Active" : "Paused";
    persist("listings", listings.map((item) => item.id === listing.id ? { ...item, status: nextStatus } : item));
    setNotice(`${listing.title} is now ${nextStatus.toLowerCase()}.`);
  };

  const removeListing = (id) => {
    persist("listings", listings.filter((listing) => listing.id !== id));
    setNotice("Listing removed from your dashboard.");
  };

  const selectMessage = (message) => {
    setActiveMessage(message.id);
    setReply("");
    if (message.unread) {
      persist("messages", messages.map((item) => item.id === message.id ? { ...item, unread: false } : item));
    }
  };

  const sendReply = (event) => {
    event.preventDefault();
    if (!reply.trim() || !activeMessage) return;
    const updated = messages.map((message) => message.id === activeMessage
      ? { ...message, replies: [...(message.replies || []), { text: reply.trim(), date: new Date().toISOString() }] }
      : message);
    persist("messages", updated);
    setReply("");
    setNotice("Your reply was saved in this prototype inbox.");
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const result = saveAgentProfile(agent.id, profile);
    setWorkspace(result.workspace);
    setNotice("Profile changes saved.");
  };

  const updateSetting = (key, checked) => {
    persist("settings", { ...workspace.settings, [key]: checked });
    setNotice("Settings saved.");
  };

  const current = SECTIONS.find((item) => item.id === section);
  const SelectedIcon = current.icon;

  return (
    <main className="agent-workspace">
      <aside className={`agent-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="agent-sidebar-brand"><span className="agent-brand-mark"><Building2 size={19} /></span><span>RentBridge <small>AGENT PORTAL</small></span></div>
        <div className="agent-sidebar-profile">
          <span className="agent-avatar">{(profile.name || "A").slice(0, 1).toUpperCase()}</span>
          <span><strong>{profile.name || "Agent"}</strong><small>{profile.agency || "Independent agent"}</small></span>
          <ChevronDown size={15} />
        </div>
        <p className="agent-nav-label">WORKSPACE</p>
        <nav className="agent-side-nav" aria-label="Agent dashboard sections">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => openSection(id)}>
              <Icon size={18} /><span>{label}</span>
              {id === "messages" && unreadCount > 0 && <span className="agent-nav-count">{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="agent-sidebar-bottom">
          <div className="agent-verification-note"><ShieldCheck size={17} /><span><strong>Build trust</strong><small>Complete your profile to help clients feel confident.</small></span></div>
          <button type="button" className="agent-logout-link" onClick={handleLogout}><LogOut size={17} /> Log out</button>
        </div>
      </aside>

      {mobileNavOpen && <button type="button" className="agent-sidebar-scrim" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}

      <section className="agent-main">
        <header className="agent-topbar">
          <button type="button" className="agent-mobile-menu" aria-label="Open dashboard menu" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <div className="agent-breadcrumb"><span>Agent workspace</span><span>/</span><strong>{current.label}</strong></div>
          <div className="agent-topbar-actions">
            <span className="agent-topbar-date">{new Date().toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</span>
            <button type="button" className="agent-topbar-avatar" title="Open profile" onClick={() => openSection("profile")}>{(profile.name || "A").slice(0, 1).toUpperCase()}</button>
          </div>
        </header>

        <div className="agent-main-content">
          <div className="agent-page-heading">
            <div><p className="agent-dashboard-eyebrow">AGENT WORKSPACE</p><h1>{section === "overview" ? `Good to see you, ${profile.name || "Agent"}` : current.label}</h1><p>{section === "overview" ? "Here’s what’s happening with your properties today." : sectionIntro(section)}</p></div>
            <button type="button" className="agent-primary-button" onClick={() => openSection("add")}><FilePlus2 size={17} /> Add property</button>
          </div>

          {notice && <div className="agent-notice" role="status"><Check size={17} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={16} /></button></div>}

          {section === "overview" && <Overview listings={listings} messages={messages} activeCount={activeCount} unreadCount={unreadCount} onOpen={openSection} onSelectMessage={selectMessage} />}
          {section === "listings" && <ListingsView listings={filteredListings} query={query} setQuery={setQuery} filter={listingFilter} setFilter={setListingFilter} onAdd={() => openSection("add")} onStatus={changeListingStatus} onDelete={removeListing} />}
          {section === "add" && <AddListing form={form} setForm={setForm} error={formError} onSubmit={submitListing} />}
          {section === "messages" && <MessagesView messages={messages} activeMessage={activeMessage} onSelect={selectMessage} reply={reply} setReply={setReply} onReply={sendReply} />}
          {section === "profile" && <ProfileView profile={profile} setProfile={setProfile} onSave={saveProfile} />}
          {section === "settings" && <SettingsView settings={workspace.settings} onChange={updateSetting} />}
        </div>
      </section>
    </main>
  );
}

function sectionIntro(section) {
  return {
    listings: "Manage your property adverts and track their review status.",
    add: "Share accurate details to help clients find the right property.",
    messages: "Keep client enquiries and replies together in one place.",
    profile: "Keep your agent and agency information up to date.",
    settings: "Choose which updates you want to receive in this prototype.",
  }[section];
}

function Overview({ listings, messages, activeCount, unreadCount, onOpen, onSelectMessage }) {
  const recent = [...listings].slice(0, 3);
  const latestMessages = [...messages].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
  return <>
    <div className="agent-stats-grid">
      <StatCard label="Total listings" value={listings.length} detail="Across rent and sale" icon={Building2} />
      <StatCard label="Active listings" value={activeCount} detail="Visible in your workspace" icon={ChartNoAxesCombined} />
      <StatCard label="Pending review" value={listings.filter((item) => item.status === "Pending review").length} detail="Awaiting team review" icon={ShieldCheck} />
      <StatCard label="Unread messages" value={unreadCount} detail="Client enquiries to review" icon={Inbox} />
    </div>
    <div className="agent-overview-grid">
      <section className="agent-panel agent-listing-panel">
        <div className="agent-panel-heading"><div><h2>Recent listings</h2><p>Your latest property activity</p></div><button type="button" className="agent-text-button" onClick={() => onOpen("listings")}>View all</button></div>
        {recent.length ? <div className="agent-overview-list">{recent.map((item) => <ListingRow key={item.id} listing={item} />)}</div> : <EmptyState title="No properties yet" detail="Add your first property to get started." action="Add property" onAction={() => onOpen("add")} />}
      </section>
      <section className="agent-panel agent-message-panel">
        <div className="agent-panel-heading"><div><h2>Recent messages</h2><p>{unreadCount ? `${unreadCount} need your attention` : "Your latest client enquiries"}</p></div><button type="button" className="agent-text-button" onClick={() => onOpen("messages")}>Open inbox</button></div>
        {latestMessages.length ? latestMessages.map((message) => <button type="button" key={message.id} className={`agent-message-preview ${message.unread ? "is-unread" : ""}`} onClick={() => { onSelectMessage(message); onOpen("messages"); }}><span className="agent-message-initial">{message.name.slice(0, 1)}</span><span><strong>{message.name}</strong><small>{message.text}</small></span>{message.unread && <i />}</button>) : <p className="agent-muted-copy">No enquiries yet. Messages from interested clients will appear here.</p>}
      </section>
    </div>
    <section className="agent-quick-actions"><div><h2>Quick actions</h2><p>Keep your workspace moving.</p></div><button type="button" onClick={() => onOpen("add")}><FilePlus2 size={18} /><span><strong>Add a property</strong><small>Create a new listing for review</small></span></button><button type="button" onClick={() => onOpen("profile")}><CircleUserRound size={18} /><span><strong>Complete your profile</strong><small>Help clients know who they’re contacting</small></span></button></section>
  </>;
}

function StatCard({ label, value, detail, icon: Icon }) {
  return <article className="agent-stat-card"><span className="agent-stat-icon"><Icon size={20} /></span><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}

function ListingsView({ listings, query, setQuery, filter, setFilter, onAdd, onStatus, onDelete }) {
  return <section className="agent-panel">
    <div className="agent-listing-toolbar"><label className="agent-dashboard-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search properties" /></label><label className="agent-status-filter"><SlidersHorizontal size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All listings</option><option>Active</option><option>Pending review</option><option>Paused</option></select></label><button type="button" className="agent-primary-button" onClick={onAdd}><FilePlus2 size={16} /> Add property</button></div>
    {listings.length ? <div className="agent-table-wrap"><table className="agent-listings-table"><thead><tr><th>Property</th><th>Type</th><th>Price</th><th>Status</th><th>Listed</th><th><span className="agent-sr-only">Actions</span></th></tr></thead><tbody>{listings.map((listing) => <tr key={listing.id}><td><strong>{listing.title}</strong><small>{listing.location}</small></td><td>{listingTypeLabel(listing.listingType)}</td><td>{money(listing.price)}{listing.listingType === "rent" ? <small>/ year</small> : null}</td><td><StatusBadge status={listing.status} /></td><td>{new Date(`${listing.createdAt}T00:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td><td className="agent-row-actions">{listing.status !== "Pending review" && <button type="button" onClick={() => onStatus(listing)}>{listing.status === "Paused" ? "Resume" : "Pause"}</button>}<button type="button" className="agent-delete-action" aria-label={`Remove ${listing.title}`} onClick={() => onDelete(listing.id)}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No matching properties" detail="Change your search or add a new property listing." action="Add property" onAction={onAdd} />}
  </section>;
}

function ListingRow({ listing }) {
  return <div className="agent-listing-row"><span className="agent-property-thumb"><Building2 size={19} /></span><span className="agent-listing-row-copy"><strong>{listing.title}</strong><small>{listing.location}</small></span><span className="agent-listing-row-price">{money(listing.price)}<small>{listing.listingType === "rent" ? "/ year" : "sale"}</small></span><StatusBadge status={listing.status} /></div>;
}

function StatusBadge({ status }) {
  return <span className={`agent-status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

function AddListing({ form, setForm, error, onSubmit }) {
  const field = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <form className="agent-panel agent-property-form" onSubmit={onSubmit}>
    <div className="agent-form-section-heading"><span>01</span><div><h2>Property details</h2><p>Enter the key details clients need to understand your property.</p></div></div>
    <div className="agent-form-grid">
      <label className="agent-form-wide">Property title<input value={form.title} onChange={(event) => field("title", event.target.value)} placeholder="e.g. Modern 3 Bedroom Apartment" required /></label>
      <label>Listing purpose<select value={form.listingType} onChange={(event) => field("listingType", event.target.value)}><option value="rent">For rent</option><option value="sale">For sale</option></select></label>
      <label>Property type<select value={form.category} onChange={(event) => field("category", event.target.value)}>{["Apartment", "Flats", "Self Contain", "Duplex", "House", "Land", "Commercial"].map((type) => <option key={type}>{type}</option>)}</select></label>
      <label className="agent-form-wide">Full address / location<input value={form.location} onChange={(event) => field("location", event.target.value)} placeholder="Area, city, state" required /></label>
      <label>{form.listingType === "rent" ? "Annual rent (₦)" : "Asking price (₦)"}<input type="number" min="1" value={form.price} onChange={(event) => field("price", event.target.value)} placeholder="e.g. 2500000" required /></label>
      <label>Bedrooms<input type="number" min="0" value={form.beds} onChange={(event) => field("beds", event.target.value)} placeholder="e.g. 3" /></label>
      <label>Bathrooms<input type="number" min="0" value={form.baths} onChange={(event) => field("baths", event.target.value)} placeholder="e.g. 2" /></label>
      <label>Floor area (sqft)<input type="number" min="0" value={form.sqft} onChange={(event) => field("sqft", event.target.value)} placeholder="e.g. 1200" /></label>
      <label className="agent-form-wide">Amenities <span className="agent-field-hint">Separate items with commas</span><input value={form.amenities} onChange={(event) => field("amenities", event.target.value)} placeholder="Parking, Generator, Water supply" /></label>
      <label className="agent-form-wide">Property description<textarea rows="5" value={form.description} onChange={(event) => field("description", event.target.value)} placeholder="Describe the property, condition, access, and nearby features." /></label>
    </div>
    <div className="agent-form-section-heading agent-form-contact-heading"><span>02</span><div><h2>Viewing contact</h2><p>How should an interested client reach you?</p></div></div>
    <label className="agent-contact-field">Contact phone<input type="tel" value={form.contactPhone} onChange={(event) => field("contactPhone", event.target.value)} placeholder="+234 800 000 0000" /></label>
    <div className="agent-review-note"><ShieldCheck size={19} /><span><strong>Listings are reviewed before verification.</strong><small>Your submission starts as pending review. A verified badge is only added after the team checks the listing.</small></span></div>
    {error && <p className="agent-form-error" role="alert">{error}</p>}
    <div className="agent-form-actions"><button type="reset" className="agent-secondary-button" onClick={() => setForm(EMPTY_LISTING)}>Clear form</button><button type="submit" className="agent-primary-button">Submit property for review</button></div>
  </form>;
}

function MessagesView({ messages, activeMessage, onSelect, reply, setReply, onReply }) {
  const selected = messages.find((message) => message.id === activeMessage);
  return <section className="agent-messages-layout agent-panel">
    <div className="agent-inbox-list"><div className="agent-inbox-title"><h2>Inbox</h2><span>{messages.length}</span></div>{messages.length ? messages.map((message) => <button type="button" key={message.id} className={`agent-inbox-item ${activeMessage === message.id ? "is-selected" : ""} ${message.unread ? "is-unread" : ""}`} onClick={() => onSelect(message)}><span className="agent-message-initial">{message.name.slice(0, 1)}</span><span className="agent-inbox-item-copy"><strong>{message.name}</strong><small>{message.listing}</small><span>{message.text}</span></span>{message.unread && <i />}</button>) : <p className="agent-muted-copy">Your client enquiries will appear here.</p>}</div>
    <div className="agent-thread">{selected ? <><header className="agent-thread-header"><span className="agent-message-initial">{selected.name.slice(0, 1)}</span><div><strong>{selected.name}</strong><small>{selected.email} · {selected.listing}</small></div></header><div className="agent-thread-body"><article className="agent-message-bubble"><p>{selected.text}</p><small>{new Date(selected.date).toLocaleString("en-NG")}</small></article>{(selected.replies || []).map((item, index) => <article className="agent-message-bubble is-agent-reply" key={`${item.date}-${index}`}><p>{item.text}</p><small>Your reply · {new Date(item.date).toLocaleString("en-NG")}</small></article>)}</div><form className="agent-reply-form" onSubmit={onReply}><textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply…" rows="3" required /><div><span>Replies are saved locally in this prototype.</span><button type="submit" className="agent-primary-button">Save reply</button></div></form></> : <div className="agent-thread-empty"><Inbox size={28} /><h3>Select an enquiry</h3><p>Choose a message to view the conversation and reply.</p></div>}</div>
  </section>;
}

function ProfileView({ profile, setProfile, onSave }) {
  const change = (key, value) => setProfile((current) => ({ ...current, [key]: value }));
  return <form className="agent-panel agent-settings-form" onSubmit={onSave}><div className="agent-profile-intro"><span className="agent-profile-large-avatar">{(profile.name || "A").slice(0, 1).toUpperCase()}</span><div><h2>Agent profile</h2><p>This information helps clients recognize and contact you.</p></div></div><div className="agent-form-grid"><label>Full name<input value={profile.name || ""} onChange={(event) => change("name", event.target.value)} required /></label><label>Email address<input type="email" value={profile.email || ""} disabled /><span className="agent-field-hint">Email changes can be managed after backend authentication is connected.</span></label><label>Phone number<input type="tel" value={profile.phone || ""} onChange={(event) => change("phone", event.target.value)} placeholder="+234 800 000 0000" /></label><label>Agency name<input value={profile.agency || ""} onChange={(event) => change("agency", event.target.value)} placeholder="Your agency or business" /></label><label className="agent-form-wide">Business location<input value={profile.location || ""} onChange={(event) => change("location", event.target.value)} placeholder="City, state" /></label><label className="agent-form-wide">About you<textarea rows="4" value={profile.bio || ""} onChange={(event) => change("bio", event.target.value)} placeholder="A short introduction for prospective clients." /></label></div><div className="agent-form-actions"><button type="submit" className="agent-primary-button">Save profile</button></div></form>;
}

function SettingsView({ settings, onChange }) {
  const options = [
    ["emailNotifications", "Email notifications", "Receive account and platform updates by email."],
    ["messageNotifications", "New message alerts", "Get notified when a prospective client sends an enquiry."],
    ["listingUpdates", "Listing status updates", "Receive updates when a listing is reviewed or changes status."],
  ];
  return <section className="agent-panel agent-settings-form"><div className="agent-panel-heading"><div><h2>Notifications</h2><p>Manage the updates you receive about your account.</p></div></div><div className="agent-settings-options">{options.map(([key, label, detail]) => <label className="agent-setting-row" key={key}><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => onChange(key, event.target.checked)} /></label>)}</div><div className="agent-review-note"><ShieldCheck size={19} /><span><strong>Account security</strong><small>Your prototype session is stored in this browser. Connect a secure backend before using real accounts or private information.</small></span></div></section>;
}

function EmptyState({ title, detail, action, onAction }) {
  return <div className="agent-empty-state"><span><Building2 size={23} /></span><h3>{title}</h3><p>{detail}</p>{action && <button type="button" className="agent-secondary-button" onClick={onAction}>{action}</button>}</div>;
}
