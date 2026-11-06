import { getMapAreas as getBaseMapAreas, getPropertyLocations as getBasePropertyLocations } from "../mapService.js";
import { MAP_CONFIG } from "./mapConfig.js";
import { createMockMapListings } from "./mock/mockPropertyLocations.js";

const listingCache = new Map();

function listingTypeMatches(listing, type) {
  const normalized = type === "sale" ? "buy" : type;
  if (normalized !== "rent" && normalized !== "buy") return true;
  return (listing.listingType === "sale" ? "buy" : listing.listingType) === normalized;
}

function normalizedBounds(bounds) {
  if (!bounds) return null;
  if (Array.isArray(bounds) && Array.isArray(bounds[0])) {
    return { west: bounds[0][0], south: bounds[0][1], east: bounds[1][0], north: bounds[1][1] };
  }
  if (Array.isArray(bounds)) {
    const [west, south, east, north] = bounds;
    return { west, south, east, north };
  }
  return bounds;
}

function insideBounds(bounds, lat, lng) {
  if (!bounds) return true;
  const { west, south, east, north } = bounds;
  if ([west, south, east, north].some((value) => !Number.isFinite(value))) return true;
  const longitudeInside = west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
  return longitudeInside && lat >= south && lat <= north;
}

function matchesFilters(listing, filters = {}) {
  const beds = Number(listing.beds) || 0;
  const price = Number(listing.price) || 0;
  const areas = Array.isArray(filters.areas) ? filters.areas : filters.area ? [filters.area] : [];
  return (filters.beds == null || beds === Number(filters.beds))
    && (filters.minBeds == null || beds >= Number(filters.minBeds))
    && (filters.maxBeds == null || beds <= Number(filters.maxBeds))
    && (filters.minPrice == null || price >= Number(filters.minPrice))
    && (filters.maxPrice == null || price <= Number(filters.maxPrice))
    && (!filters.listingType || listingTypeMatches(listing, filters.listingType))
    && (!areas.length || areas.includes(listing.areaName || listing.location));
}

async function loadAllListings(type = "all") {
  if (listingCache.has(type)) return listingCache.get(type);
  const pending = Promise.all([
    getBaseMapAreas(type),
    getBasePropertyLocations({ type: "all" }),
  ]).then(([areas, baseListings]) => {
    const photos = baseListings.flatMap((listing) => listing.images || []);
    const mockListings = createMockMapListings(areas, photos, 450);
    return {
      areas,
      listings: [...baseListings, ...mockListings].filter((listing) => listingTypeMatches(listing, type)),
    };
  }).catch((error) => {
    listingCache.delete(type);
    throw error;
  });
  listingCache.set(type, pending);
  return pending;
}

export async function getMapAreas(type = "rent") {
  const { areas, listings } = await loadAllListings(type);
  return areas.map((area) => ({
    ...area,
    listingCount: listings.filter((listing) => (listing.areaName || listing.location) === area.name).length,
  }));
}

export async function getPropertyById(id) {
  const { listings } = await loadAllListings("all");
  return listings.find((listing) => String(listing.id) === String(id)) || null;
}

export async function getPropertyLocations({ type, bounds, filters = {}, limit = 200, zoom = MAP_CONFIG.propertyZoom } = {}) {
  const { areas, listings: allListings } = await loadAllListings(type || "all");
  const normalized = normalizedBounds(bounds);
  const matchingListings = allListings.filter((listing) => {
    const lat = listing.showExactLocation ? listing.exactLat : listing.approxLat;
    const lng = listing.showExactLocation ? listing.exactLng : listing.approxLng;
    return Number.isFinite(lat) && Number.isFinite(lng)
      && insideBounds(normalized, lat, lng)
      && matchesFilters(listing, filters);
  });

  if (zoom < MAP_CONFIG.propertyZoom) {
    const areaCounts = areas
      .filter((area) => insideBounds(normalized, area.latitude, area.longitude))
      .map((area) => ({
        ...area,
        listingCount: matchingListings.filter((listing) => (listing.areaName || listing.location) === area.name).length,
      }))
      .filter((area) => area.listingCount > 0);
    return { mode: "areas", listings: [], areaCounts, total: matchingListings.length, capped: false };
  }

  const safeLimit = Math.min(200, Math.max(1, Math.floor(Number(limit) || 200)));
  const total = matchingListings.length;
  // A real backend must filter by bounds, aggregate at low zoom, and cap results on the server.
  return {
    mode: "listings",
    listings: matchingListings.slice(0, safeLimit),
    areaCounts: [],
    total,
    capped: total > safeLimit,
  };
}
