import { PROPERTIES } from "../components/FeaturedProperties.jsx";
import { getCurrentAgent, getAgentWorkspace } from "../agent/authService.js";
import { getUpdates } from "../status/statusService.js";
import { MOCK_AREAS } from "./mock/mockAreas.js";
import { MOCK_PROPERTY_POINTS } from "./map/mock/mockPropertyLocations.js";
import { MAP_CONFIG, getMapStyle } from "./map/mapConfig.js";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

const mapStates = new WeakMap();
const PROPERTY_SOURCE = "rb-property-points";
const CLUSTER_LAYER = "rb-property-clusters";

function areaForLocation(location = "") {
  const value = String(location).toLowerCase();
  if (value.includes("banana island") || value.includes("victoria island") || value.includes("ikoyi")) return "Victoria Island";
  if (value.includes("chevron") || value.includes("lekki")) return "Lekki";
  if (value.includes("ikeja")) return "Ikeja";
  if (value.includes("yaba")) return "Yaba";
  if (value.includes("ajah")) return "Ajah";
  if (value.includes("surulere")) return "Surulere";
  return "";
}

function agentListings() {
  const agent = getCurrentAgent();
  if (!agent) return [];
  return (getAgentWorkspace(agent.id).listings || []).filter((listing) => /^(active|available)$/i.test(listing.status || ""));
}

export async function getMapAreas(type = "rent") {
  const normalizedType = type === "buy" ? "buy" : "rent";
  const [updates] = await Promise.all([getUpdates(normalizedType)]);
  const customListings = agentListings();
  const listings = [...PROPERTIES, ...customListings.filter((item) => !PROPERTIES.some((property) => property.title === item.title && property.location === item.location))];

  return MOCK_AREAS.map((area) => ({
    ...area,
    updateCount: updates.filter((post) => post.area === area.name).length,
    listingCount: listings.filter((listing) => {
      const listingType = listing.listingType === "sale" ? "buy" : listing.listingType;
      return listingType === normalizedType && areaForLocation(listing.location) === area.name;
    }).length,
  }));
}

function normalizedListingType(value) {
  return value === "sale" ? "buy" : value === "rent" ? "rent" : "buy";
}

function isInsideBounds(bounds, lat, lng) {
  if (!bounds) return true;
  const normalizedBounds = Array.isArray(bounds) && Array.isArray(bounds[0])
    ? [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]
    : bounds;
  const [west, south, east, north] = Array.isArray(normalizedBounds)
    ? normalizedBounds
    : [normalizedBounds.west, normalizedBounds.south, normalizedBounds.east, normalizedBounds.north];
  if ([west, south, east, north].some((value) => !Number.isFinite(value))) return true;
  const insideLng = west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
  return insideLng && lat >= south && lat <= north;
}

function publicPropertyLocation(property) {
  const point = MOCK_PROPERTY_POINTS[property.id];
  const location = {
    id: property.id,
    title: property.title,
    location: property.location,
    price: property.price,
    beds: property.beds,
    images: property.images,
    listingType: property.listingType,
    showExactLocation: property.showExactLocation === true,
    areaName: property.areaName || areaForLocation(property.location),
    approxLat: point ? point.exactLat + point.offsetLat : property.approxLat,
    approxLng: point ? point.exactLng + point.offsetLng : property.approxLng,
  };

  // Exact location disclosure must be enforced by the server in production; this client mock only returns exact coordinates when explicitly enabled.
  if (property.showExactLocation === true && point) {
    location.exactLat = point.exactLat;
    location.exactLng = point.exactLng;
  } else {
    delete location.exactLat;
    delete location.exactLng;
  }
  return location;
}

export async function getPropertyLocations({ type, bounds } = {}) {
  const normalizedType = type === "rent" || type === "buy" ? type : "all";
  return PROPERTIES.map(publicPropertyLocation).filter((property) => {
    const lat = property.showExactLocation ? property.exactLat : property.approxLat;
    const lng = property.showExactLocation ? property.exactLng : property.approxLng;
    return (normalizedType === "all" || normalizedListingType(property.listingType) === normalizedType)
      && Number.isFinite(lat) && Number.isFinite(lng)
      && isInsideBounds(bounds, lat, lng);
  });
}

export async function getPropertyLocation(id) {
  const property = PROPERTIES.find((item) => String(item.id) === String(id));
  return property ? publicPropertyLocation(property) : null;
}

function formatPriceLabel(property) {
  const value = Number(property.price) || 0;
  const short = value >= 1_000_000_000 ? `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
    : value >= 1_000_000 ? `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, "")}M`
      : `${Math.round(value / 1_000)}K`;
  return `₦${short}${normalizedListingType(property.listingType) === "rent" ? "/yr" : ""}`;
}

function markerButton(className, label, text) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.textContent = text;
  return button;
}

export async function createMapView(container, { theme = "light", center = MAP_CONFIG.center, zoom = MAP_CONFIG.initialZoom, onError } = {}) {
  const maplibre = await import("maplibre-gl");
  const MapLibre = maplibre.default || maplibre;
  maplibre.setWorkerUrl?.(mapLibreWorkerUrl);
  const map = new MapLibre.Map({
    container,
    style: getMapStyle(theme),
    center,
    zoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
    attributionControl: false,
    cooperativeGestures: true,
    renderWorldCopies: false,
  });
  const state = { map, MapLibre, areas: [], areaMarkers: new Map(), properties: [], propertyMarkers: new Map(), clusterMarkers: new Map(), selectedPropertyId: "", onPropertySelect: null, onAreaSelect: null, onBoundsChange: null, focusMarker: null, circleSource: "rb-focused-property-circle", errorHandler: null };
  const handle = {};
  mapStates.set(handle, state);
  if (onError) {
    state.errorHandler = (event) => { if (event.error) onError(event.error); };
    map.on("error", state.errorHandler);
  }
  map.addControl(new MapLibre.AttributionControl({ compact: false }), "bottom-right");
  map.once("load", () => {
    if (state.onBoundsChange) state.onBoundsChange(map.getBounds().toArray());
  });
  map.on("moveend", () => {
    refreshPinVisibility(state);
    state.onBoundsChange?.(map.getBounds().toArray());
  });
  map.on("zoomend", () => refreshPinVisibility(state));
  map.on("idle", () => refreshPinVisibility(state));
  try {
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Map style did not load in time")), 15000);
      map.once("load", () => { window.clearTimeout(timeout); resolve(); });
      map.once("error", (event) => {
        if (!event.error) return;
        window.clearTimeout(timeout);
        reject(event.error);
      });
    });
  } catch (error) {
    map.remove();
    mapStates.delete(handle);
    throw error;
  }
  return handle;
}

function getState(handle) {
  const state = mapStates.get(handle);
  if (!state) throw new Error("Map view is not available");
  return state;
}

function ensurePropertyLayers(state) {
  const { map } = state;
  if (!map.getSource(PROPERTY_SOURCE)) {
    map.addSource(PROPERTY_SOURCE, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: MAP_CONFIG.propertyZoom + 2,
      clusterRadius: MAP_CONFIG.clusterRadius,
    });
    map.addLayer({ id: CLUSTER_LAYER, type: "circle", source: PROPERTY_SOURCE, filter: ["has", "point_count"], paint: { "circle-color": ["interpolate", ["linear"], ["get", "point_count"], 2, "#087d70", 10, "#075c55"], "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 30, 30], "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" } });
    if (!state.clusterEventsBound) {
      map.on("click", CLUSTER_LAYER, (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER] })[0];
        if (!feature) return;
        map.getSource(PROPERTY_SOURCE)?.getClusterExpansionZoom(feature.properties.cluster_id).then((nextZoom) => {
          map.easeTo({ center: feature.geometry.coordinates, zoom: nextZoom, duration: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 350 });
        }).catch(() => {});
      });
      map.on("mouseenter", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ""; });
      state.clusterEventsBound = true;
    }
  }
}

export function addAreaPins(handle, areas = [], onSelect = () => {}) {
  const state = getState(handle);
  state.areas = areas;
  state.onAreaSelect = onSelect;
  const keep = new Set();
  areas.forEach((area) => {
    const key = area.name;
    keep.add(key);
    const label = `${area.name}: ${area.updateCount} active updates and ${area.listingCount} listings`;
    let marker = state.areaMarkers.get(key);
    if (!marker) {
      const element = markerButton(`rb-map-area-pin${area.selected ? " is-selected" : ""}`, label, `${area.listingCount}`);
      element.addEventListener("click", () => state.onAreaSelect?.(area));
      marker = new state.MapLibre.Marker({ element, anchor: "center" }).setLngLat([area.longitude, area.latitude]).addTo(state.map);
      state.areaMarkers.set(key, marker);
    } else {
      marker.setLngLat([area.longitude, area.latitude]);
      marker.getElement().setAttribute("aria-label", label);
      marker.getElement().textContent = `${area.listingCount}`;
    }
  });
  state.areaMarkers.forEach((marker, key) => { if (!keep.has(key)) { marker.remove(); state.areaMarkers.delete(key); } });
  refreshPinVisibility(state);
}

export function setSelectedAreaPin(handle, name) {
  const state = getState(handle);
  state.areaMarkers.forEach((marker, areaName) => {
    marker.getElement().classList.toggle("is-selected", areaName === name);
  });
}

function propertyFeatureCollection(properties) {
  return {
    type: "FeatureCollection",
    features: properties.map((property) => {
      const lat = property.showExactLocation ? property.exactLat : property.approxLat;
      const lng = property.showExactLocation ? property.exactLng : property.approxLng;
      return { type: "Feature", id: String(property.id), properties: { id: String(property.id), priceLabel: formatPriceLabel(property) }, geometry: { type: "Point", coordinates: [lng, lat] } };
    }),
  };
}

function accessiblePropertyLabel(property) {
  const price = formatPriceLabel(property).replace(/\/yr$/, " per year");
  const area = property.areaName || property.location;
  const title = String(property.title || "Property");
  const beds = Number(property.beds);
  const alreadyIncludesBeds = beds > 0 && new RegExp(`\\b${beds}\\s*[- ]?bed(room)?s?\\b`, "i").test(title);
  const description = beds > 0 && !alreadyIncludesBeds ? `${beds} bedroom ${title}` : title;
  return `${description}, ${price}, ${area}`;
}

export function setSelectedPropertyPin(handle, id) {
  const state = getState(handle);
  state.selectedPropertyId = id == null ? "" : String(id);
  state.propertyMarkers.forEach((marker, propertyId) => {
    const selected = propertyId === state.selectedPropertyId;
    marker.getElement().classList.toggle("is-selected", selected);
    if (marker.getElement().parentElement) marker.getElement().parentElement.style.zIndex = selected ? "4" : "";
  });
  refreshPinVisibility(state);
}

export function addPropertyPins(handle, properties = [], onSelect = () => {}) {
  const state = getState(handle);
  state.properties = properties;
  state.onPropertySelect = onSelect;
  ensurePropertyLayers(state);
  state.map.getSource(PROPERTY_SOURCE).setData(propertyFeatureCollection(properties));
  const keep = new Set();
  properties.forEach((property) => {
    const key = String(property.id);
    keep.add(key);
    const position = property.showExactLocation ? [property.exactLng, property.exactLat] : [property.approxLng, property.approxLat];
    const marker = state.propertyMarkers.get(key);
    if (marker) {
      marker.setLngLat(position);
      const element = marker.getElement();
      element.setAttribute("aria-label", accessiblePropertyLabel(property));
      const priceLabel = element.querySelector(".rb-map-property-label");
      if (priceLabel) priceLabel.textContent = formatPriceLabel(property);
    } else {
      const element = markerButton("rb-map-property-pin", accessiblePropertyLabel(property), "");
      element.dataset.propertyId = key;
      const symbol = document.createElement("span");
      symbol.className = "rb-map-property-symbol";
      symbol.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "rb-map-property-label";
      label.setAttribute("aria-hidden", "true");
      label.textContent = formatPriceLabel(property);
      element.append(symbol, label);
      element.addEventListener("click", () => {
        const currentProperty = state.properties.find((item) => String(item.id) === key) || property;
        state.onPropertySelect?.(currentProperty);
      });
      state.propertyMarkers.set(key, new state.MapLibre.Marker({ element, anchor: "bottom" }).setLngLat(position).addTo(state.map));
    }
    state.propertyMarkers.get(key).getElement().classList.toggle("is-selected", key === state.selectedPropertyId);
  });
  state.propertyMarkers.forEach((marker, key) => { if (!keep.has(key)) { marker.remove(); state.propertyMarkers.delete(key); } });
  refreshPinVisibility(state);
}

function refreshPinVisibility(state) {
  const { map } = state;
  if (!map.isStyleLoaded()) return;
  const propertiesVisible = map.getZoom() >= MAP_CONFIG.propertyZoom;
  const priceLabelsVisible = map.getZoom() >= MAP_CONFIG.propertyPriceLabelZoom;
  state.areaMarkers.forEach((marker) => {
    marker.getElement().hidden = propertiesVisible;
    marker.getElement().tabIndex = propertiesVisible ? -1 : 0;
  });
  const propertyLayersExist = map.getLayer(CLUSTER_LAYER);
  if (propertyLayersExist) {
    const visibility = propertiesVisible ? "visible" : "none";
    map.setLayoutProperty(CLUSTER_LAYER, "visibility", visibility);
  }
  const clusterFeatures = propertiesVisible && propertyLayersExist
    ? map.queryRenderedFeatures({ layers: [CLUSTER_LAYER] })
    : [];
  const keepClusters = new Set();
  clusterFeatures.forEach((feature) => {
    const id = String(feature.properties.cluster_id);
    keepClusters.add(id);
    let marker = state.clusterMarkers.get(id);
    if (!marker) {
      const count = Number(feature.properties.point_count) || 0;
      const element = markerButton("rb-map-cluster-pin", `${count} properties. Activate to zoom in`, `${count}`);
      element.tabIndex = 0;
      marker = new state.MapLibre.Marker({ element, anchor: "center" }).setLngLat(feature.geometry.coordinates).addTo(map);
      element.addEventListener("click", () => {
        const source = map.getSource(PROPERTY_SOURCE);
        source?.getClusterExpansionZoom(feature.properties.cluster_id).then((nextZoom) => {
          map.easeTo({ center: feature.geometry.coordinates, zoom: nextZoom, duration: 300 });
        }).catch(() => {});
      });
      state.clusterMarkers.set(id, marker);
    } else {
      marker.setLngLat(feature.geometry.coordinates);
      marker.getElement().textContent = `${feature.properties.point_count}`;
      marker.getElement().setAttribute("aria-label", `${feature.properties.point_count} properties. Activate to zoom in`);
    }
  });
  state.clusterMarkers.forEach((marker, key) => { if (!keepClusters.has(key)) { marker.remove(); state.clusterMarkers.delete(key); } });
  state.propertyMarkers.forEach((marker) => {
    const element = marker.getElement();
    const point = map.project(marker.getLngLat());
    const blockedByCluster = clusterFeatures.some((feature) => {
      const clusterPoint = map.project(feature.geometry.coordinates);
      return Math.hypot(clusterPoint.x - point.x, clusterPoint.y - point.y) < MAP_CONFIG.clusterRadius;
    });
    const selected = element.dataset.propertyId === state.selectedPropertyId;
    const visible = propertiesVisible && (!blockedByCluster || selected);
    element.hidden = !visible;
    element.tabIndex = visible ? 0 : -1;
    element.classList.toggle("is-price-visible", priceLabelsVisible && visible);
    if (element.parentElement) element.parentElement.style.zIndex = selected && visible ? "4" : "";
  });
}

export function subscribeMapBounds(handle, callback) {
  const state = getState(handle);
  state.onBoundsChange = callback;
  callback?.(state.map.getBounds().toArray());
  return () => { if (state.onBoundsChange === callback) state.onBoundsChange = null; };
}

export function resizeMapView(handle) {
  getState(handle).map.resize();
}

export function zoomMapView(handle, delta) {
  const state = getState(handle);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.map.zoomTo(state.map.getZoom() + delta, { duration: reduced ? 0 : 220 });
}

export function flyToProperty(handle, property) {
  const state = getState(handle);
  const lat = property.showExactLocation ? property.exactLat : property.approxLat;
  const lng = property.showExactLocation ? property.exactLng : property.approxLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.map.flyTo({ center: [lng, lat], zoom: Math.max(state.map.getZoom(), MAP_CONFIG.propertyZoom + 1), duration: reduced ? 0 : 650 });
}

export function flyToArea(handle, area) {
  const state = getState(handle);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.map.flyTo({ center: [area.longitude, area.latitude], zoom: 10, duration: reduced ? 0 : 650 });
}

function circlePolygon(lng, lat, radiusMeters) {
  const coordinates = [];
  const earthRadius = 6378137;
  for (let index = 0; index <= 64; index += 1) {
    const angle = (index / 64) * Math.PI * 2;
    const north = (radiusMeters * Math.cos(angle)) / earthRadius;
    const east = (radiusMeters * Math.sin(angle)) / (earthRadius * Math.cos((lat * Math.PI) / 180));
    coordinates.push([lng + (east * 180) / Math.PI, lat + (north * 180) / Math.PI]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordinates] } };
}

export function showApproxCircle(handle, property, radiusMeters = MAP_CONFIG.circleRadiusMeters) {
  const state = getState(handle);
  const { map } = state;
  state.focusMarker?.remove();
  state.focusMarker = null;
  if (map.getLayer("rb-focused-property-fill")) map.removeLayer("rb-focused-property-fill");
  if (map.getLayer("rb-focused-property-outline")) map.removeLayer("rb-focused-property-outline");
  if (map.getSource(state.circleSource)) map.removeSource(state.circleSource);

  if (property.showExactLocation && Number.isFinite(property.exactLat) && Number.isFinite(property.exactLng)) {
    const element = markerButton("rb-map-exact-pin", `Exact property location: ${property.title}`, "⌖");
    element.tabIndex = 0;
    state.focusMarker = new state.MapLibre.Marker({ element, anchor: "bottom" }).setLngLat([property.exactLng, property.exactLat]).addTo(map);
    map.setCenter([property.exactLng, property.exactLat]);
    return;
  }

  map.addSource(state.circleSource, { type: "geojson", data: circlePolygon(property.approxLng, property.approxLat, radiusMeters) });
  map.addLayer({ id: "rb-focused-property-fill", type: "fill", source: state.circleSource, paint: { "fill-color": "#168e7d", "fill-opacity": 0.22 } });
  map.addLayer({ id: "rb-focused-property-outline", type: "line", source: state.circleSource, paint: { "line-color": "#087d70", "line-width": 2, "line-opacity": 0.75 } });
  map.setCenter([property.approxLng, property.approxLat]);
}

export function removeMapView(handle) {
  const state = mapStates.get(handle);
  if (!state) return;
  state.areaMarkers.forEach((marker) => marker.remove());
  state.propertyMarkers.forEach((marker) => marker.remove());
  state.clusterMarkers.forEach((marker) => marker.remove());
  state.focusMarker?.remove();
  state.map.remove();
  mapStates.delete(handle);
}
