import { useEffect, useState } from "react";
import { Bell, CheckCheck, CircleCheck, Video, X } from "lucide-react";
import { getAgentProfile, getNotifications, markNotificationsRead } from "../statusService.js";
import { formatStatusTime } from "../utils/statusTime.js";

function NotificationTime({ value }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 60000); return () => window.clearInterval(timer); }, []);
  return <time>{formatStatusTime(value, now)}</time>;
}

export default function StatusNotifications({ onOpenStatus }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const unreadCount = items.filter((item) => !item.read).length;
  const load = async () => setItems(await getNotifications());
  useEffect(() => {
    load();
    const listener = () => load();
    const storageListener = (event) => { if (event.key === "rentbridge-status-store") load(); };
    window.addEventListener("rentbridge-status-updated", listener);
    window.addEventListener("storage", storageListener);
    return () => { window.removeEventListener("rentbridge-status-updated", listener); window.removeEventListener("storage", storageListener); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  const readAll = async () => { await markNotificationsRead(); await load(); };
  const openItem = async (item) => {
    await markNotificationsRead([item.id]);
    await load();
    setOpen(false);
    onOpenStatus(item.agentId, item.statusId);
  };

  return <div className="status-notification-control">
    <button className="status-icon-button" type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={open} aria-controls="status-notifications-panel" onClick={() => setOpen((value) => !value)}>
      <Bell size={19} />{unreadCount > 0 && <span className="status-unread-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>
    {open && <>
      <button className="status-popover-scrim" type="button" aria-label="Close notifications" onClick={() => setOpen(false)} />
      <section className="status-notifications-panel" id="status-notifications-panel" role="dialog" aria-label="Notifications">
        <header><div><h2>Notifications</h2><span>{unreadCount ? `${unreadCount} unread` : "All caught up"}</span></div><div className="status-notification-header-actions">{unreadCount > 0 && <button type="button" onClick={readAll}><CheckCheck size={15} /> Mark all as read</button>}<button type="button" className="status-notifications-close" aria-label="Close notifications" onClick={() => setOpen(false)}><X size={18} /></button></div></header>
        <div className="status-notification-list">{items.length ? items.map((item) => {
          const agent = getAgentProfile(item.agentId);
          return <button className={`status-notification ${item.read ? "is-read" : "is-unread"}`} type="button" key={item.id} onClick={() => openItem(item)}>
            {item.mediaType === "video" ? <span className="status-notification-video"><video src={item.imageUrl} muted playsInline preload="metadata" aria-hidden="true" /><Video size={14} aria-hidden="true" /></span> : <img src={item.imageUrl} alt="" />}
            <span className="status-notification-copy"><strong>{agent.name} posted a new update</strong><NotificationTime value={item.createdAt} /></span>
            {!item.read && <CircleCheck size={14} className="status-notification-dot" aria-label="Unread" />}
          </button>;
        }) : <p className="status-notifications-empty">New updates from agents you follow will appear here.</p>}</div>
      </section>
    </>}
  </div>;
}
