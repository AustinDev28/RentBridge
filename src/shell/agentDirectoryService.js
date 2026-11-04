import { getFollowedAgentIds, getUpdates, followAgent, unfollowAgent } from "../status/statusService.js";
import { MOCK_AGENTS } from "./mock/mockAgents.js";

export async function getDirectoryAgents() {
  const posts = await getUpdates("all");
  const following = getFollowedAgentIds();
  return MOCK_AGENTS.map((agent) => ({
    ...agent,
    activePostCount: posts.filter((post) => post.agentId === agent.id).length,
    following: following.includes(agent.id),
  }));
}

export async function toggleAgentFollow(agentId, following) {
  if (following) await unfollowAgent(agentId);
  else await followAgent(agentId);
}

export { getUpdates };
