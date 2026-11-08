// MOCK ONLY - replace with a real backend before production.
// Production needs server-side expiry (TTL or scheduled job), EXIF stripping on uploads,
// and rate limiting. Browser storage cannot enforce these safely.
import { MOCK_AGENTS, MOCK_POSTS } from "./mock/mockPosts.js";
import { isExpired } from "./utils/expiry.js";
import { stripLegacyFeedComments, stripLegacyPostCommentCounts } from "./utils/legacyCommentCleanup.js";
import { getAgentWorkspace, getCurrentAgent } from "../agent/authService.js";
import { getCurrentUser } from "../user/userAuthService.js";
import { getPostingAccess, getVerificationSnapshot, isAgentPublic, recordPublishedPost } from "../agent/verification/verificationService.js";
import { USE_AGENT_VERIFICATION } from "../agent/verification/config.js";

const POSTS_KEY = "rentbridge-feed-posts";
const STATE_KEY = "rentbridge-feed-state";
const delay = () => new Promise((resolve) => window.setTimeout(resolve, 180));
const isSignedIn = () => Boolean(getCurrentUser() || getCurrentAgent());
const read = (key, fallback) => {
  try { const value = JSON.parse(window.localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
};
function allPosts() {
  let posts = read(POSTS_KEY, null);
  if (!Array.isArray(posts)) { posts = MOCK_POSTS; window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); }
  if (posts.some((post) => Object.prototype.hasOwnProperty.call(post, "commentCount"))) {
    posts = stripLegacyPostCommentCounts(posts);
    window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
  return posts;
}
function savePosts(posts) { window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); window.dispatchEvent(new Event("rentbridge-feed-updated")); }
function state() {
  const stored = read(STATE_KEY, {});
  if (Object.prototype.hasOwnProperty.call(stored, "comments")) {
    const withoutComments = stripLegacyFeedComments(stored);
    window.localStorage.setItem(STATE_KEY, JSON.stringify(withoutComments));
    return { likes: [], saves: [], follows: [], reports: [], ...withoutComments };
  }
  return { likes: [], saves: [], follows: [], reports: [], ...stored };
}
function saveState(value) { const withoutComments = stripLegacyFeedComments(value); window.localStorage.setItem(STATE_KEY, JSON.stringify(withoutComments)); window.dispatchEvent(new Event("rentbridge-feed-updated")); }
function listingUnavailable(post) {
  if (!post.listingId) return false;
  const listing = getAgentWorkspace(post.agentId).listings.find((item) => item.id === post.listingId);
  return Boolean(listing && /^(rented|sold)$/i.test(listing.status));
}
export async function getPosts(filter = "all") {
  await delay();
  const posts = allPosts();
  const now = Date.now();
  const updated = posts.map((post) => isExpired(post, now) && post.status === "active" ? { ...post, status: "expired" } : post);
  if (updated.some((post, index) => post !== posts[index])) savePosts(updated);
  const follows = isSignedIn() ? state().follows : [];
  const visible = updated.filter((post) => post.status === "active" && !isExpired(post, now) && !listingUnavailable(post))
    .filter((post) => filter === "all" || (filter === "following" ? follows.includes(post.agentId) : post.type === filter))
    .sort((a, b) => Number(follows.includes(b.agentId)) - Number(follows.includes(a.agentId)) || Number(Boolean(agentFor(b.agentId)?.verified)) - Number(Boolean(agentFor(a.agentId)?.verified)) || new Date(b.createdAt) - new Date(a.createdAt));
  return USE_AGENT_VERIFICATION ? visible.filter((post) => isAgentPublic(post.agentId)) : visible;
}
export async function getAgentPosts(agentId) { await delay(); return allPosts().filter((post) => post.agentId === agentId && post.status !== "removed").sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)); }
export async function createPost(data) {
  // In production, verification, suspension, and posting limits must be enforced on the server.
  const access = await getPostingAccess(data.agentId);
  if (!access.allowed) return { error: access.reason };
  await delay();
  const posts = allPosts();
  const recent = posts.filter((post) => post.agentId === data.agentId && Date.now() - new Date(post.createdAt).getTime() < 86400000 && post.status !== "removed");
  if (recent.length >= access.dailyLimit) return { error: "limit" };
  const createdAt = new Date().toISOString();
  const post = { ...data, id: `post-${Date.now()}`, createdAt, expiresAt: new Date(Date.now()+86400000).toISOString(), likeCount: 0, viewCount: 0, ctaTapCount: 0, status: "active" };
  savePosts([post, ...posts]);
  await recordPublishedPost(data.agentId, post.id);
  return { post };
}
export async function deletePost(id) { await delay(); savePosts(allPosts().map((post) => post.id === id ? { ...post, status: "removed" } : post)); }
export async function likePost(id) { await delay(); const s=state(); const liked=s.likes.includes(id); s.likes=liked?s.likes.filter((key)=>key!==id):[...s.likes,id]; saveState(s); savePosts(allPosts().map((p)=>p.id===id?{...p,likeCount:Math.max(0,p.likeCount+(liked?-1:1))}:p)); return !liked; }
export async function savePost(id) { await delay(); const s=state(); s.saves=s.saves.includes(id)?s.saves.filter((key)=>key!==id):[...s.saves,id]; saveState(s); return s.saves.includes(id); }
export async function followAgent(agentId) { if (!isSignedIn()) return false; await delay(); const s=state(); s.follows=s.follows.includes(agentId)?s.follows.filter((id)=>id!==agentId):[...s.follows,agentId]; saveState(s); return s.follows.includes(agentId); }
export async function reportPost(id, reason) { await delay(); const s=state(); s.reports=[...s.reports,{postId:id,reason,createdAt:new Date().toISOString()}]; saveState(s); }
export async function incrementView(id) { const posts=allPosts(); savePosts(posts.map((p)=>p.id===id?{...p,viewCount:(p.viewCount||0)+1}:p)); }
export async function incrementCtaTap(id) { const posts=allPosts(); savePosts(posts.map((p)=>p.id===id?{...p,ctaTapCount:(p.ctaTapCount||0)+1}:p)); }
export function getFeedState() { const current = state(); return isSignedIn() ? current : { ...current, follows: [] }; }
export function getAgent(agentId) { return agentFor(agentId); }
function agentFor(id) {
  const agent = MOCK_AGENTS.find((item) => item.id === id) || (id ? { id, name: "RentBridge Agent", agency: "Independent agent", verified: false } : null);
  if (!agent || !USE_AGENT_VERIFICATION) return agent;
  return { ...agent, verified: getVerificationSnapshot(id).level >= 3 };
}
