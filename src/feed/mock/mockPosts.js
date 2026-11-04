// MOCK ONLY - replace with a real backend before production.
import lekki from "../../assets/properties/lekki-1.jpg";
import ikoyi from "../../assets/properties/ikoyi-1.jpg";
import vi from "../../assets/properties/vi-1.jpg";
import chevron from "../../assets/properties/chevron-1.jpg";
import yaba from "../../assets/properties/yaba-1.jpg";
import banana from "../../assets/properties/banana-1.jpg";

const agents = [
  ["agent-demo", "Kehinde Ade", "Bridge Homes Realty", true], ["agent-ada", "Wilson James", "Harborline Properties", true],
  ["agent-tunde", "Tunde Bello", "Keyspace Lagos", false], ["agent-micheal", "Micheal Johnson", "Homefolk Realty", true],
  ["agent-chidi", "Chidi Nwosu", "Urban Nest", false], ["agent-samuel", "Samuel Jerry", "Northstar Homes", true],
  ["agent-femi", "Femi Balogun", "The Property Desk", false], ["agent-ife", "Ife Adeyemi", "Open Door Lagos", true],
].map(([id, name, agency, verified]) => ({ id, name, agency, verified, avatar: "" }));
const homes = [
  ["lekki", "Lekki Phase 1, Lagos", 2500000, "rent", lekki], ["ikoyi", "Ikoyi, Lagos", 185000000, "buy", ikoyi],
  ["victoria", "Victoria Island, Lagos", 1800000, "rent", vi], ["chevron", "Chevron, Lekki", 120000000, "buy", chevron],
  ["yaba", "Yaba, Lagos", 1200000, "rent", yaba], ["banana", "Banana Island, Lagos", 650000000, "buy", banana],
];
const captions = ["A bright home with room to settle in.", "Take a look at this lovely Lagos property.", "Viewings available this week. Message to arrange a visit.", "A great new place in a convenient location."];

export const MOCK_AGENTS = agents;
export const MOCK_POSTS = Array.from({ length: 15 }, (_, index) => {
  const [slug, location, price, type, imageUrl] = homes[index % homes.length];
  const agent = agents[index % agents.length];
  const ageHours = [0.2, 1.5, 4, 7, 11, 16, 20, 23, 23.3, 23.7, 2, 9, 14, 18, 22][index];
  const createdAt = new Date(Date.now() - ageHours * 60 * 60 * 1000).toISOString();
  return {
    id: `mock-${slug}-${index}`, agentId: agent.id,
    listingId: agent.id === "agent-demo" && slug === "lekki" ? "demo-listing-1" : null,
    type, imageUrl, caption: captions[index % captions.length], price, location,
    createdAt, expiresAt: new Date(new Date(createdAt).getTime() + 86400000).toISOString(),
    likeCount: 8 + index * 3, viewCount: 32 + index * 17,
    ctaTapCount: index * 2, status: "active",
  };
});
