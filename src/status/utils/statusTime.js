export function isStatusExpired(status, now = Date.now()) {
  const expiresAt = new Date(status.expiresAt || new Date(status.createdAt).getTime() + 86400000).getTime();
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

export function formatStatusTime(value, now = Date.now()) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (date.toDateString() === new Date(now).toDateString()) {
    return `Today, ${date.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}`;
  }
  return `${Math.floor(minutes / 60)}h ago`;
}
