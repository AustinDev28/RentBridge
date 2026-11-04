export function isExpired(post, now = Date.now()) {
  const expiry = new Date(post.expiresAt || new Date(new Date(post.createdAt).getTime() + 24 * 60 * 60 * 1000)).getTime();
  return !Number.isFinite(expiry) || expiry <= now;
}

export function timeLeft(post, now = Date.now()) {
  const expiry = new Date(post.expiresAt || new Date(new Date(post.createdAt).getTime() + 24 * 60 * 60 * 1000)).getTime();
  const minutes = Math.max(0, Math.ceil((expiry - now) / 60000));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}
