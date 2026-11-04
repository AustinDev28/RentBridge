// MOCK ONLY - replace with real backend before production.
import lekki from "../../assets/properties/lekki-1.jpg";
import ikoyi from "../../assets/properties/ikoyi-1.jpg";
import victoriaIsland from "../../assets/properties/vi-1.jpg";
import chevron from "../../assets/properties/chevron-1.jpg";
import yaba from "../../assets/properties/yaba-1.jpg";
import bananaIsland from "../../assets/properties/banana-1.jpg";

export const MOCK_STATUS_AGENTS = [
  { id: "agent-demo", name: "Ade Properties", agency: "Bridge Homes Realty", verified: true, location: "Lagos", area: "Lekki", phone: "+2348012345678" },
  { id: "agent-ada", name: "Ada Okafor", agency: "Harborline Properties", verified: true, location: "Lekki", area: "Lekki", phone: "+2348012345601" },
  { id: "agent-tunde", name: "Tunde Bello", agency: "Keyspace Lagos", verified: false, location: "Ikoyi", area: "Victoria Island", phone: "+2348012345602" },
  { id: "agent-amina", name: "Amina Yusuf", agency: "Homefolk Realty", verified: true, location: "Victoria Island", area: "Victoria Island", phone: "+2348012345603" },
  { id: "agent-chidi", name: "Chidi Nwosu", agency: "Urban Nest", verified: false, location: "Yaba", area: "Yaba", phone: "+2348012345604" },
  { id: "agent-zainab", name: "Zainab Musa", agency: "Northstar Homes", verified: true, location: "Lekki", area: "Ajah", phone: "+2348012345605" },
  { id: "agent-femi", name: "Femi Balogun", agency: "The Property Desk", verified: false, location: "Chevron", area: "Lekki", phone: "+2348012345606" },
  { id: "agent-ife", name: "Ife Adeyemi", agency: "Open Door Lagos", verified: true, location: "Ikoyi", area: "Ikeja", phone: "+2348012345607" },
];

export const MOCK_STATUS_AREAS = [
  { name: "Lekki", latitude: 6.4474, longitude: 3.4723 },
  { name: "Ikeja", latitude: 6.6018, longitude: 3.3515 },
  { name: "Yaba", latitude: 6.5095, longitude: 3.3711 },
  { name: "Ajah", latitude: 6.4698, longitude: 3.5852 },
  { name: "Victoria Island", latitude: 6.4281, longitude: 3.4219 },
  { name: "Surulere", latitude: 6.5038, longitude: 3.3536 },
];

const homes = [
  { listingId: "demo-listing-1", title: "Modern 2 Bedroom Apartment", type: "rent", price: 2500000, location: "Lekki Phase 1, Lagos", area: "Lekki", beds: 2, propertyType: "Apartment", sqft: 1000, imageUrl: lekki },
  { listingId: "demo-listing-2", title: "Family Terrace Duplex", type: "buy", price: 120000000, location: "Chevron, Lekki, Lagos", area: "Lekki", beds: 4, propertyType: "Duplex", sqft: 3500, imageUrl: chevron },
  { listingId: "mock-ikoyi-1", title: "Elegant Ikoyi Residence", type: "buy", price: 185000000, location: "Ikoyi, Lagos", area: "Victoria Island", beds: 3, propertyType: "Duplex", sqft: 3000, imageUrl: ikoyi },
  { listingId: "mock-vi-1", title: "Victoria Island Apartment", type: "rent", price: 1800000, location: "Victoria Island, Lagos", area: "Victoria Island", beds: 1, propertyType: "Apartment", sqft: 800, imageUrl: victoriaIsland },
  { listingId: "mock-yaba-1", title: "Yaba City Studio", type: "rent", price: 1200000, location: "Yaba, Lagos", area: "Yaba", beds: 1, propertyType: "Studio", sqft: 500, imageUrl: yaba },
  { listingId: "mock-banana-1", title: "Banana Island Waterfront Home", type: "buy", price: 650000000, location: "Banana Island, Lagos", area: "Lekki", beds: 5, propertyType: "Detached duplex", sqft: 5200, imageUrl: bananaIsland },
  { listingId: "mock-ikeja-1", title: "Ikeja Garden Apartment", type: "rent", price: 1650000, location: "Ikeja, Lagos", area: "Ikeja", beds: 2, propertyType: "Apartment", sqft: 1100, imageUrl: lekki },
  { listingId: "mock-ajah-1", title: "Ajah Family Home", type: "buy", price: 95000000, location: "Ajah, Lagos", area: "Ajah", beds: 4, propertyType: "Duplex", sqft: 2800, imageUrl: chevron },
  { listingId: "mock-surulere-1", title: "Surulere City Flat", type: "rent", price: 1350000, location: "Surulere, Lagos", area: "Surulere", beds: 2, propertyType: "Apartment", sqft: 900, imageUrl: yaba },
];
const captions = [
  "A bright, welcoming home ready for its next residents.",
  "New on the market. Get in touch to arrange a viewing.",
  "Take a look at this lovely property in a great location.",
  "Available for viewing this week. Save this update for later.",
];
const agesInHours = [0.15, 0.8, 2.2, 4.5, 7.3, 10.6, 13.2, 16.1, 18.5, 20.2, 21.4, 22.1, 22.8, 23.1, 23.6];

export const MOCK_STATUS_POSTS = agesInHours.map((age, index) => {
  const home = homes[index % homes.length];
  const agent = MOCK_STATUS_AGENTS[index % MOCK_STATUS_AGENTS.length];
  const createdAt = new Date(Date.now() - age * 60 * 60 * 1000).toISOString();
  return {
    id: `mock-status-${index + 1}`,
    agentId: agent.id,
    ...home,
    caption: captions[index % captions.length],
    agentPhone: agent.phone,
    createdAt,
    expiresAt: new Date(new Date(createdAt).getTime() + 86400000).toISOString(),
    status: "active",
    viewCount: 12 + index * 7,
    mockSeenByVisitor: index % 4 === 0,
  };
});
