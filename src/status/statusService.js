// MOCK ONLY - replace with a real backend before production.
// Real push notifications need a backend, a service worker, and Web Push.
import { getAgentWorkspace, getCurrentAgent } from "../agent/authService.js";
import { getCurrentUser } from "../user/userAuthService.js";
import { getUserSettings } from "../user/userSettings.js";
import { MOCK_STATUS_AGENTS, MOCK_STATUS_AREAS, MOCK_STATUS_POSTS } from "./mock/mockStatus.js";
import { isStatusExpired } from "./utils/statusTime.js";
import { deleteStatusMedia, resolveStatusMedia, saveStatusMedia } from "./mediaStore.js";
import { getPostingAccess, getVerificationSnapshot, isAgentPublic, recordPublishedPost } from "../agent/verification/verificationService.js";
import { USE_AGENT_VERIFICATION } from "../agent/verification/config.js";

const STORE_KEY = "rentbridge-status-store";
const delay = () => new Promise((resolve) => window.setTimeout(resolve, 140));
const emptyStore = () => ({ posts: null, followsByUser: {}, mutedByUser: {}, seenByPost: {}, notifications: [], promptedUsers: {} });

function readStore() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORE_KEY) || "null");
    return { ...emptyStore(), ...(stored && typeof stored === "object" ? stored : {}) };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("rentbridge-status-updated"));
}

function getViewerId() {
  return getCurrentAgent()?.id || getCurrentUser()?.id || "visitor-guest";
}

function allPosts(store = readStore()) {
  if (!Array.isArray(store.posts)) {
    store.posts = MOCK_STATUS_POSTS.map((post) => ({ ...post }));
    store.posts.forEach((post) => {
      if (post.mockSeenByVisitor) store.seenByPost[post.id] = ["visitor-guest"];
      delete post.mockSeenByVisitor;
    });
    writeStore(store);
  }
  return store.posts;
}

function savePosts(posts, store = readStore()) {
  store.posts = posts;
  writeStore(store);
}

function refreshExpiry(posts, store) {
  let changed = false;
  const next = posts.map((post) => {
    if (post.status === "active" && isStatusExpired(post)) {
      changed = true;
      return { ...post, status: "expired" };
    }
    return post;
  });
  if (changed) savePosts(next, store);
  return next;
}

function listingIsUnavailable(post) {
  if (!post.listingId) return false;
  const listing = getAgentWorkspace(post.agentId).listings.find((item) => item.id === post.listingId);
  return Boolean(listing && !/^(active|available)$/i.test(listing.status || ""));
}

export function getAgentProfile(agentId) {
  const mockAgent = MOCK_STATUS_AGENTS.find((agent) => agent.id === agentId);
  const currentAgent = getCurrentAgent();
  let profile;
  if (currentAgent?.id === agentId) {
    const workspace = getAgentWorkspace(agentId);
    profile = { ...mockAgent, ...workspace.profile, id: agentId, name: workspace.profile.name || currentAgent.name, agency: workspace.profile.agency || mockAgent?.agency || "Independent agent", area: workspace.profile.area || mockAgent?.area || "Lekki" };
  } else {
    profile = mockAgent || { id: agentId, name: "RentBridge Agent", agency: "Independent agent", verified: false, location: "Lagos", phone: "+2348012345678" };
  }
  if (!USE_AGENT_VERIFICATION) return profile;
  const verification = getVerificationSnapshot(agentId);
  return { ...profile, verified: verification.level >= 3, suspended: verification.suspended };
}

function postArea(post) {
  if (typeof post.area === "string" && MOCK_STATUS_AREAS.some((area) => area.name === post.area)) return post.area;
  const mockArea = MOCK_STATUS_POSTS.find((item) => item.id === post.id)?.area;
  if (mockArea) return mockArea;
  const location = String(post.location || "").toLowerCase();
  const matchingArea = MOCK_STATUS_AREAS.find((area) => location.includes(area.name.toLowerCase()));
  return matchingArea?.name || getAgentProfile(post.agentId).area || "Lekki";
}

function normalizePostArea(post) {
  const mockSize = MOCK_STATUS_POSTS.find((item) => item.id === post.id)?.sqft;
  const area = postArea(post);
  const savedLocation = typeof post.location === "string" ? post.location.trim() : "";
  const savedArea = typeof post.area === "string" ? post.area.trim() : "";
  const location = savedLocation || savedArea || getAgentProfile(post.agentId).location || area || "Lagos, Nigeria";
  return { ...post, location, area, sqft: Number(post.sqft ?? (typeof post.area === "number" ? post.area : mockSize || 0)) };
}

export async function getAreas() {
  await delay();
  const store = readStore();
  const posts = refreshExpiry(allPosts(store), store);
  const counts = new Map();
  posts.filter((post) => post.status === "active" && !listingIsUnavailable(post)).forEach((post) => {
    const name = postArea(post);
    if (!MOCK_STATUS_AREAS.some((area) => area.name === name)) return;
    if (!counts.has(name)) counts.set(name, new Set());
    counts.get(name).add(post.agentId);
  });
  return MOCK_STATUS_AREAS.map((area, index) => ({ ...area, count: counts.get(area.name)?.size || 0, index }))
    .filter((area) => area.count > 0)
    .sort((first, second) => second.count - first.count || first.index - second.index);
}

export async function getUpdates(filter = "all") {
  await delay();
  const store = readStore();
  const posts = refreshExpiry(allPosts(store), store);
  const viewerId = getViewerId();
  const following = getCurrentAgent() || getCurrentUser() ? store.followsByUser[viewerId] || [] : [];
  const muted = store.mutedByUser[viewerId] || [];
  const options = typeof filter === "object" && filter !== null
    ? { area: filter.area || "", type: filter.type || "all" }
    : { area: "", type: filter };
  return Promise.all(posts
    .filter((post) => post.status === "active" && !listingIsUnavailable(post) && !muted.includes(post.agentId) && isAgentPublic(post.agentId))
    .filter((post) => options.type === "all" || (options.type === "following" ? following.includes(post.agentId) : post.type === options.type))
    .filter((post) => !options.area || options.area === "all" || postArea(post) === options.area)
    .map(async (post) => {
      const seenByIds = store.seenByPost[post.id] || [];
      return resolveStatusMedia({ ...normalizePostArea(post), seen: seenByIds.includes(viewerId), seenByCount: Math.max(post.viewCount || 0, seenByIds.length), agent: getAgentProfile(post.agentId) });
    })
  ).then((resolved) => resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

export async function getRecentlyActiveAgents({ area = "", type = "all" } = {}) {
  await delay();
  const store = readStore();
  const posts = allPosts(store);
  const viewerId = getViewerId();
  const following = getCurrentAgent() || getCurrentUser() ? store.followsByUser[viewerId] || [] : [];
  const muted = store.mutedByUser[viewerId] || [];
  const cutoff = Date.now() - 7 * 86400000;
  const latestByAgent = new Map();
  posts.filter((post) => post.status !== "removed" && new Date(post.createdAt).getTime() >= cutoff && !listingIsUnavailable(post) && !muted.includes(post.agentId) && isAgentPublic(post.agentId))
    .filter((post) => (!area || area === "all" || postArea(post) === area)
      && (type === "all" || (type === "following" ? following.includes(post.agentId) : post.type === type)))
    .forEach((post) => {
      const current = latestByAgent.get(post.agentId);
      if (!current || new Date(post.createdAt) > new Date(current.createdAt)) latestByAgent.set(post.agentId, post);
    });
  return [...latestByAgent.values()].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .map((post) => ({ agent: getAgentProfile(post.agentId), area: postArea(post), type: post.type, createdAt: post.createdAt }));
}

export function getFollowedAgentIds() {
  if (!getCurrentAgent() && !getCurrentUser()) return [];
  return readStore().followsByUser[getViewerId()] || [];
}

export function getMutedAgentIds() {
  return readStore().mutedByUser[getViewerId()] || [];
}

export async function getMutedUpdates() {
  await delay();
  const store = readStore();
  const posts = refreshExpiry(allPosts(store), store);
  const muted = store.mutedByUser[getViewerId()] || [];
  const mutedPosts = posts.filter((post) => post.status === "active" && muted.includes(post.agentId) && !listingIsUnavailable(post) && isAgentPublic(post.agentId))
    .map(async (post) => resolveStatusMedia({ ...post, agent: getAgentProfile(post.agentId), seenByCount: Math.max(post.viewCount || 0, (store.seenByPost[post.id] || []).length) }));
  return Promise.all(mutedPosts).then((resolved) => resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

// Demo sample posts remain available in a separate preview section after their 24-hour window.
export async function getDemoUpdates() {
  await delay();
  const store = readStore();
  const posts = refreshExpiry(allPosts(store), store);
  const viewerId = getViewerId();
  return Promise.all(posts
    .filter((post) => (post.isDemo || post.id.startsWith("mock-")) && post.status === "expired" && !listingIsUnavailable(post) && isAgentPublic(post.agentId))
    .map(async (post) => {
      const seenByIds = store.seenByPost[post.id] || [];
      return resolveStatusMedia({ ...normalizePostArea(post), isDemo: true, seen: seenByIds.includes(viewerId), seenByCount: Math.max(post.viewCount || 0, seenByIds.length), agent: getAgentProfile(post.agentId) });
    })
  ).then((resolved) => resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

export async function getMyStatuses(agentId) {
  await delay();
  const store = readStore();
  const posts = refreshExpiry(allPosts(store), store);
  const mine = posts.filter((post) => post.agentId === agentId && post.status !== "removed")
    .map(async (post) => resolveStatusMedia({ ...post, seenByCount: Math.max(post.viewCount || 0, (store.seenByPost[post.id] || []).length) }));
  return Promise.all(mine).then((resolved) => resolved.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

export async function markSeen(postId) {
  const store = readStore();
  const posts = allPosts(store);
  const post = posts.find((item) => item.id === postId);
  if (!post || post.status !== "active" || isStatusExpired(post)) return null;
  const viewerId = getViewerId();
  const seenByIds = store.seenByPost[postId] || [];
  if (!seenByIds.includes(viewerId)) {
    store.seenByPost[postId] = [...seenByIds, viewerId];
    const updated = posts.map((item) => item.id === postId ? { ...item, viewCount: (item.viewCount || 0) + 1 } : item);
    savePosts(updated, store);
  }
  return { ...post, seenByCount: store.seenByPost[postId]?.length || seenByIds.length };
}

export async function recordStatusAction(postId, action) {
  if (!["propertyTapCount", "contactTapCount"].includes(action)) return;
  const store = readStore();
  const posts = allPosts(store);
  const target = posts.find((post) => post.id === postId);
  if (!target || target.status !== "active" || isStatusExpired(target) || getCurrentAgent()?.id === target.agentId) return;
  store.posts = posts.map((post) => post.id === postId ? { ...post, [action]: (post[action] || 0) + 1 } : post);
  writeStore(store);
}

export async function followAgent(agentId) {
  if (!getCurrentAgent() && !getCurrentUser()) return { following: false, requiresSignIn: true, offerBrowserNotifications: false };
  await delay();
  const store = readStore();
  const viewerId = getViewerId();
  const current = store.followsByUser[viewerId] || [];
  if (current.includes(agentId)) return { following: true, offerBrowserNotifications: false };
  store.followsByUser[viewerId] = [...current, agentId];
  const offerBrowserNotifications = typeof window.Notification !== "undefined"
    && window.Notification.permission === "default"
    && !store.promptedUsers[viewerId];
  if (offerBrowserNotifications) store.promptedUsers[viewerId] = true;
  writeStore(store);
  return { following: true, offerBrowserNotifications };
}

export async function unfollowAgent(agentId) {
  await delay();
  const store = readStore();
  const viewerId = getViewerId();
  store.followsByUser[viewerId] = (store.followsByUser[viewerId] || []).filter((id) => id !== agentId);
  writeStore(store);
}

export async function muteAgent(agentId) {
  await delay();
  const store = readStore();
  const viewerId = getViewerId();
  const current = store.mutedByUser[viewerId] || [];
  store.mutedByUser[viewerId] = current.includes(agentId) ? current : [...current, agentId];
  writeStore(store);
}

export async function unmuteAgent(agentId) {
  await delay();
  const store = readStore();
  const viewerId = getViewerId();
  store.mutedByUser[viewerId] = (store.mutedByUser[viewerId] || []).filter((id) => id !== agentId);
  writeStore(store);
}

function addNotificationsForFollowers(post, store) {
  for (const [recipientId, followedIds] of Object.entries(store.followsByUser)) {
    if (!followedIds.includes(post.agentId) || (store.mutedByUser[recipientId] || []).includes(post.agentId)) continue;
    const settings = getUserSettings(recipientId);
    if (settings.inAppStatusNotifications) {
    store.notifications.unshift({
        id: `notification-${post.id}-${recipientId}`,
        recipientId,
        agentId: post.agentId,
        statusId: post.id,
        imageUrl: post.imageUrl,
      mediaType: post.mediaType || "image",
        createdAt: post.createdAt,
        read: false,
      });
    }
    if (settings.browserStatusNotifications && typeof window.Notification !== "undefined" && window.Notification.permission === "granted") {
      try { new window.Notification(`${getAgentProfile(post.agentId).name} posted a new update`, { body: post.location, icon: post.imageUrl }); } catch { /* Browser notifications are optional in this prototype. */ }
    }
  }
}

export async function createPost(data) {
  // In production, verification, suspension, and posting limits must be enforced on the server.
  const access = await getPostingAccess(data.agentId);
  if (!access.allowed) return { error: access.reason };
  await delay();
  const store = readStore();
  const posts = allPosts(store);
  const listing = getAgentWorkspace(data.agentId).listings.find((item) => item.id === data.listingId);
  if (!listing || !/^(active|available)$/i.test(listing.status || "")) return { error: "listing_unavailable" };
  const recent = posts.filter((post) => post.agentId === data.agentId && Date.now() - new Date(post.createdAt).getTime() < 86400000);
  if (recent.length >= access.dailyLimit) return { error: "limit" };
  if (!(data.file instanceof Blob)) return { error: "invalid_media" };
  let mediaId;
  try {
    mediaId = await saveStatusMedia(data.file);
  } catch {
    return { error: "media_storage_unavailable" };
  }
  const createdAt = new Date().toISOString();
  const { file, imageUrl, ...details } = data;
  const post = {
    ...details,
    id: `status-${Date.now()}`,
    type: listing.listingType === "sale" ? "buy" : "rent",
    price: Number(listing.price),
    location: listing.location,
    beds: Number(listing.beds || 0),
    propertyType: listing.category || "Property",
    area: (typeof listing.area === "string" && listing.area) || postArea({ location: listing.location, agentId: data.agentId }),
    sqft: Number(listing.sqft || 0),
    agentPhone: getAgentProfile(data.agentId).phone || "+2348012345678",
    mediaId,
    mediaType: data.mediaType || "image",
    durationSeconds: Number(data.durationSeconds || 0),
    createdAt,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    status: "active",
    viewCount: 0,
    propertyTapCount: 0,
    contactTapCount: 0,
  };
  addNotificationsForFollowers(post, store);
  store.posts = [post, ...posts];
  writeStore(store);
  await recordPublishedPost(data.agentId, post.id);
  return { post: await resolveStatusMedia(post) };
}

export async function deletePost(postId) {
  await delay();
  const store = readStore();
  const agent = getCurrentAgent();
  const target = allPosts(store).find((post) => post.id === postId && post.agentId === agent?.id);
  store.posts = allPosts(store).map((post) => post.id === postId && post.agentId === agent?.id ? { ...post, status: "removed" } : post);
  writeStore(store);
  if (target?.mediaId) await deleteStatusMedia(target.mediaId).catch(() => {});
}

export async function getNotifications() {
  await delay();
  const viewerId = getViewerId();
  const store = readStore();
  const posts = allPosts(store);
  const notifications = store.notifications.filter((item) => {
    if (item.recipientId !== viewerId) return false;
    const post = posts.find((entry) => entry.id === item.statusId);
    return !post || isAgentPublic(post.agentId);
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Promise.all(notifications.map(async (item) => {
    const post = posts.find((entry) => entry.id === item.statusId);
    if (!post) return item;
    const media = await resolveStatusMedia(post);
    return { ...item, imageUrl: media.mediaUrl, mediaType: media.mediaType };
  }));
}

export async function markNotificationsRead(ids) {
  await delay();
  const store = readStore();
  const viewerId = getViewerId();
  const selected = ids ? new Set(ids) : null;
  store.notifications = store.notifications.map((item) => item.recipientId === viewerId && (!selected || selected.has(item.id)) ? { ...item, read: true } : item);
  writeStore(store);
}

export function requestBrowserNotifications() {
  if (typeof window.Notification === "undefined" || window.Notification.permission !== "default") return Promise.resolve("unsupported");
  return window.Notification.requestPermission();
}

export async function simulateNewPostFromFollowedAgent(agentId) {
  const store = readStore();
  const viewerId = getViewerId();
  let followedAgentId = agentId || (store.followsByUser[viewerId] || []).find((id) => id !== getCurrentAgent()?.id);
  if (!followedAgentId) {
    followedAgentId = MOCK_STATUS_AGENTS.find((agent) => agent.id !== getCurrentAgent()?.id)?.id;
    if (!followedAgentId) return { error: "no_agent" };
    store.followsByUser[viewerId] = [...(store.followsByUser[viewerId] || []), followedAgentId];
  }
  if (!isAgentPublic(followedAgentId)) return { error: "agent_unverified" };
  const template = MOCK_STATUS_POSTS.find((post) => post.agentId === followedAgentId);
  if (!template) return { error: "no_post" };
  const post = { ...template, id: `simulated-${Date.now()}`, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), viewCount: 0, status: "active" };
  addNotificationsForFollowers(post, store);
  store.posts = [post, ...allPosts(store)];
  writeStore(store);
  return { post, agentId: followedAgentId };
}
