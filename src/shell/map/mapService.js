import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { getMapStyle, MAP_CONFIG } from "./mapConfig.js";

const mapStates = new WeakMap();
const LISTINGS_SOURCE = "rb-map-listings";
const CLUSTER_LAYER = "rb-map-listing-clusters";
const CLUSTER_COUNT_LAYER = "rb-map-listing-cluster-count";
const MID_SINGLE_LAYER = "rb-map-listing-mid-singles";
const MID_GROUP_LAYER = "rb-map-listing-mid-groups";
const MID_GROUP_COUNT_LAYER = "rb-map-listing-mid-group-count";
const PIN_LAYER = "rb-map-listing-pins";
const SELECTED_PIN_LAYER = "rb-map-listing-selected-pin";
const PRICE_LAYER = "rb-map-listing-prices";
const GROUP_COUNT_LAYER = "rb-map-listing-group-count";
const PIN_IMAGE = "rb-map-location-pin";

function makePinImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  context.scale(2, 2);
  context.beginPath();
  context.moveTo(12, 1);
  context.bezierCurveTo(5.9, 1, 1, 5.9, 1, 12);
  context.bezierCurveTo(1, 20, 12, 31, 12, 31);
  context.bezierCurveTo(12, 31, 23, 20, 23, 12);
  context.bezierCurveTo(23, 5.9, 18.1, 1, 12, 1);
  context.closePath();
  context.fillStyle = "#d94f4b";
  context.fill();
  context.lineWidth = 2.2;
  context.strokeStyle = "#ffffff";
  context.stroke();
  context.beginPath();
  context.arc(12, 12, 3.2, 0, Math.PI * 2);
  context.fillStyle = "#ffffff";
  context.fill();
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function propertyPriceLabel(property) {
  const price = Number(property.price) || 0;
  const short = price >= 1_000_000_000 ? `${(price / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
    : price >= 1_000_000 ? `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, "")}M`
      : `${Math.round(price / 1_000)}K`;
  return `₦${short}${property.listingType === "rent" ? "/yr" : ""}`;
}

function propertyCoordinates(property) {
  const lat = property.showExactLocation ? property.exactLat : property.approxLat;
  const lng = property.showExactLocation ? property.exactLng : property.approxLng;
  return [lng, lat];
}

function groupListings(listings, selectedId) {
  const groups = new Map();
  listings.forEach((listing) => {
    const [lng, lat] = propertyCoordinates(listing);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, { key, coordinates: [lng, lat], listings: [] });
    groups.get(key).listings.push(listing);
  });
  return {
    type: "FeatureCollection",
    features: [...groups.values()].map((group) => {
      const ids = group.listings.map((listing) => String(listing.id));
      const representative = group.listings[0];
      return {
        type: "Feature",
        id: group.key,
        properties: {
          groupKey: group.key,
          listing_count: group.listings.length,
          listing_ids: JSON.stringify(ids),
          priceLabel: propertyPriceLabel(representative),
          selected: selectedId != null && ids.includes(String(selectedId)),
        },
        geometry: { type: "Point", coordinates: group.coordinates },
      };
    }),
  };
}

function getState(handle) {
  const state = mapStates.get(handle);
  if (!state) throw new Error("Map view is not available");
  return state;
}

function notifyViewport(state, reason) {
  refreshAreaBubbles(state);
  state.onViewportChange?.({ bounds: state.map.getBounds().toArray(), zoom: state.map.getZoom(), reason });
}

export async function createMapView(container, { theme = "light", center = MAP_CONFIG.center, zoom = MAP_CONFIG.initialZoom, onError } = {}) {
  const maplibre = await import("maplibre-gl");
  maplibre.setWorkerUrl?.(mapLibreWorkerUrl);
  const MapLibre = maplibre.default || maplibre;
  const map = new MapLibre.Map({
    container,
    style: getMapStyle(theme),
    center,
    zoom,
    minZoom: MAP_CONFIG.minZoom,
    maxZoom: MAP_CONFIG.maxZoom,
    attributionControl: false,
    cooperativeGestures: false,
    renderWorldCopies: false,
  });
  const state = {
    map,
    MapLibre,
    areas: [],
    areaMarkers: new Map(),
    listings: [],
    listingsById: new Map(),
    selectedId: "",
    onGroupSelect: null,
    onAreaSelect: null,
    onViewportChange: null,
    lastZoom: zoom,
    cameraMoveReason: "",
    keyboardHandler: null,
  };
  const handle = {};
  mapStates.set(handle, state);
  if (onError) map.on("error", (event) => { if (event.error) onError(event.error); });
  map.addControl(new MapLibre.AttributionControl({ compact: false }), "bottom-right");
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
  map.addImage(PIN_IMAGE, makePinImage(), { pixelRatio: 2 });
  map.addSource(LISTINGS_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterRadius: MAP_CONFIG.clusterRadius,
    clusterMaxZoom: MAP_CONFIG.singlePinZoom - 1,
    clusterProperties: { listing_count: ["+", ["get", "listing_count"]] },
  });
  map.addLayer({
    id: CLUSTER_LAYER,
    type: "circle",
    source: LISTINGS_SOURCE,
    filter: ["has", "point_count"],
    minzoom: MAP_CONFIG.propertyZoom,
    maxzoom: MAP_CONFIG.singlePinZoom,
    paint: {
      "circle-color": ["interpolate", ["linear"], ["get", "listing_count"], 2, "#087d70", 20, "#075c55"],
      "circle-radius": ["step", ["get", "listing_count"], 20, 10, 25, 30, 31],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });
  map.addLayer({
    id: CLUSTER_COUNT_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: ["has", "point_count"],
    minzoom: MAP_CONFIG.propertyZoom,
    maxzoom: MAP_CONFIG.singlePinZoom,
    layout: { "text-field": ["to-string", ["get", "listing_count"]], "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"], "text-size": 12 },
    paint: { "text-color": "#ffffff" },
  });
  map.addLayer({
    id: MID_SINGLE_LAYER,
    type: "circle",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "listing_count"], 1]],
    minzoom: MAP_CONFIG.propertyZoom,
    maxzoom: MAP_CONFIG.singlePinZoom,
    paint: { "circle-color": "#d94f4b", "circle-radius": 6, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
  });
  map.addLayer({
    id: MID_GROUP_LAYER,
    type: "circle",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "listing_count"], 1]],
    minzoom: MAP_CONFIG.propertyZoom,
    maxzoom: MAP_CONFIG.singlePinZoom,
    paint: { "circle-color": "#087d70", "circle-radius": 18, "circle-stroke-width": 2, "circle-stroke-color": "#ffffff" },
  });
  map.addLayer({
    id: MID_GROUP_COUNT_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "listing_count"], 1]],
    minzoom: MAP_CONFIG.propertyZoom,
    maxzoom: MAP_CONFIG.singlePinZoom,
    layout: { "text-field": ["to-string", ["get", "listing_count"]], "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"], "text-size": 12 },
    paint: { "text-color": "#ffffff" },
  });
  const singlePinFilter = ["all", ["!", ["has", "point_count"]], ["!", ["get", "selected"]]];
  map.addLayer({
    id: PIN_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: singlePinFilter,
    minzoom: MAP_CONFIG.singlePinZoom,
    layout: { "icon-image": PIN_IMAGE, "icon-anchor": "bottom", "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": ["interpolate", ["linear"], ["zoom"], MAP_CONFIG.singlePinZoom, 0.82, MAP_CONFIG.maxZoom, 1] },
  });
  map.addLayer({
    id: SELECTED_PIN_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], ["get", "selected"]],
    minzoom: MAP_CONFIG.singlePinZoom,
    layout: { "icon-image": PIN_IMAGE, "icon-anchor": "bottom", "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-size": ["interpolate", ["linear"], ["zoom"], MAP_CONFIG.singlePinZoom, 1.05, MAP_CONFIG.maxZoom, 1.3] },
  });
  map.addLayer({
    id: GROUP_COUNT_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], [">", ["get", "listing_count"], 1]],
    minzoom: MAP_CONFIG.singlePinZoom,
    layout: { "text-field": ["concat", ["to-string", ["get", "listing_count"]], " listings here"], "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-anchor": "left", "text-offset": [1.55, -0.7], "text-allow-overlap": true },
    paint: { "text-color": "#173f55", "text-halo-color": "#ffffff", "text-halo-width": 2 },
  });
  map.addLayer({
    id: PRICE_LAYER,
    type: "symbol",
    source: LISTINGS_SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "listing_count"], 1]],
    minzoom: MAP_CONFIG.propertyPriceLabelZoom,
    layout: { "text-field": ["get", "priceLabel"], "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-anchor": "left", "text-offset": [1.55, -0.7], "text-allow-overlap": true },
    paint: { "text-color": "#173f55", "text-halo-color": "#ffffff", "text-halo-width": 2 },
  });
  map.on("click", CLUSTER_LAYER, (event) => {
    const feature = map.queryRenderedFeatures(event.point, { layers: [CLUSTER_LAYER] })[0];
    if (!feature) return;
    map.getSource(LISTINGS_SOURCE).getClusterExpansionZoom(feature.properties.cluster_id).then((nextZoom) => {
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      state.cameraMoveReason = "cluster";
      map.easeTo({ center: feature.geometry.coordinates, zoom: nextZoom, duration: reduced ? 0 : 350 });
    }).catch(() => {});
  });
  const handlePinClick = (event) => {
    const feature = map.queryRenderedFeatures(event.point, { layers: [PIN_LAYER, SELECTED_PIN_LAYER, MID_SINGLE_LAYER, MID_GROUP_LAYER] })[0];
    if (!feature) return;
    let ids = [];
    try { ids = JSON.parse(feature.properties.listing_ids || "[]"); } catch { ids = []; }
    const listings = ids.map((id) => state.listingsById.get(String(id))).filter(Boolean);
    if (listings.length) state.onGroupSelect?.(listings);
  };
  [PIN_LAYER, SELECTED_PIN_LAYER, MID_SINGLE_LAYER, MID_GROUP_LAYER].forEach((layer) => map.on("click", layer, handlePinClick));
  map.on("mouseenter", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", CLUSTER_LAYER, () => { map.getCanvas().style.cursor = ""; });
  [PIN_LAYER, SELECTED_PIN_LAYER, MID_SINGLE_LAYER, MID_GROUP_LAYER].forEach((layer) => {
    map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
  });
  const canvas = map.getCanvas();
  canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", "Interactive property map. Use the adjacent listings list to browse properties with a keyboard. Press Enter to activate the nearest visible map result.");
  state.keyboardHandler = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const interactiveLayers = [CLUSTER_LAYER, MID_GROUP_LAYER, MID_SINGLE_LAYER, PIN_LAYER, SELECTED_PIN_LAYER];
    const features = map.queryRenderedFeatures(undefined, { layers: interactiveLayers });
    if (!features.length) return;
    const center = map.project(map.getCenter());
    const feature = features.sort((a, b) => {
      const pointA = map.project(a.geometry.coordinates);
      const pointB = map.project(b.geometry.coordinates);
      return Math.hypot(pointA.x - center.x, pointA.y - center.y) - Math.hypot(pointB.x - center.x, pointB.y - center.y);
    })[0];
    event.preventDefault();
    if (feature.properties.point_count) {
      const count = Number(feature.properties.listing_count) || 0;
      canvas.setAttribute("aria-label", `${count} properties in this cluster. Press Enter to zoom in. Use the listings list to browse properties.`);
      map.getSource(LISTINGS_SOURCE).getClusterExpansionZoom(feature.properties.cluster_id).then((nextZoom) => {
        state.cameraMoveReason = "cluster";
        map.easeTo({ center: feature.geometry.coordinates, zoom: nextZoom, duration: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 350 });
      }).catch(() => {});
      return;
    }
    let ids = [];
    try { ids = JSON.parse(feature.properties.listing_ids || "[]"); } catch { ids = []; }
    const group = ids.map((id) => state.listingsById.get(String(id))).filter(Boolean);
    if (!group.length) return;
    const first = group[0];
    canvas.setAttribute("aria-label", `${group.length} listings here. ${first.title}, ₦${Number(first.price || 0).toLocaleString("en-NG")}, ${first.areaName || first.location}. Use the listings list to browse all map results.`);
    state.onGroupSelect?.(group);
  };
  canvas.addEventListener("keydown", state.keyboardHandler);
  map.on("moveend", () => {
    const zoomNow = map.getZoom();
    const reason = state.cameraMoveReason || (zoomNow === state.lastZoom ? "move" : "zoom");
    state.cameraMoveReason = "";
    state.lastZoom = zoomNow;
    notifyViewport(state, reason);
  });
  return handle;
}

export function setListings(handle, listings = [], onGroupSelect = () => {}) {
  const state = getState(handle);
  state.listings = listings;
  state.listingsById = new Map(listings.map((listing) => [String(listing.id), listing]));
  state.onGroupSelect = onGroupSelect;
  state.map.getSource(LISTINGS_SOURCE).setData(groupListings(listings, state.selectedId));
}

export function setSelectedListing(handle, id) {
  const state = getState(handle);
  state.selectedId = id == null ? "" : String(id);
  state.map.getSource(LISTINGS_SOURCE)?.setData(groupListings(state.listings, state.selectedId));
}

export function getListingGroup(handle, id) {
  const state = getState(handle);
  const listing = state.listingsById.get(String(id));
  if (!listing) return [];
  const position = propertyCoordinates(listing);
  const key = `${position[0].toFixed(6)},${position[1].toFixed(6)}`;
  return state.listings.filter((candidate) => {
    const coordinates = propertyCoordinates(candidate);
    return `${coordinates[0].toFixed(6)},${coordinates[1].toFixed(6)}` === key;
  });
}

export function setAreaBubbles(handle, areas = [], onSelect = () => {}) {
  const state = getState(handle);
  state.areas = areas;
  state.onAreaSelect = onSelect;
  const keep = new Set();
  areas.forEach((area) => {
    keep.add(area.name);
    let marker = state.areaMarkers.get(area.name);
    const label = `${area.name}: ${area.listingCount} listings`;
    if (!marker) {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "rb-map-area-pin";
      element.textContent = String(area.listingCount);
      element.setAttribute("aria-label", label);
      element.addEventListener("click", () => {
        state.onAreaSelect?.(area);
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        state.cameraMoveReason = "area";
        state.map.easeTo({ center: [area.longitude, area.latitude], zoom: MAP_CONFIG.propertyZoom, duration: reduced ? 0 : 350 });
      });
      marker = new state.MapLibre.Marker({ element, anchor: "center" }).setLngLat([area.longitude, area.latitude]).addTo(state.map);
      state.areaMarkers.set(area.name, marker);
    } else {
      marker.setLngLat([area.longitude, area.latitude]);
      marker.getElement().textContent = String(area.listingCount);
      marker.getElement().setAttribute("aria-label", label);
    }
  });
  state.areaMarkers.forEach((marker, name) => { if (!keep.has(name)) { marker.remove(); state.areaMarkers.delete(name); } });
  refreshAreaBubbles(state);
}

function refreshAreaBubbles(state) {
  const visible = state.map.getZoom() < MAP_CONFIG.propertyZoom;
  state.areaMarkers.forEach((marker) => {
    marker.getElement().hidden = !visible;
    marker.getElement().tabIndex = visible ? 0 : -1;
  });
}

export function setSelectedArea(handle, name) {
  const state = getState(handle);
  state.areaMarkers.forEach((marker, areaName) => marker.getElement().classList.toggle("is-selected", areaName === name));
}

export function subscribeViewport(handle, callback) {
  const state = getState(handle);
  state.onViewportChange = callback;
  callback?.({ bounds: state.map.getBounds().toArray(), zoom: state.map.getZoom(), reason: "initial" });
  return () => { if (state.onViewportChange === callback) state.onViewportChange = null; };
}

export function flyToListing(handle, listing, zoom = MAP_CONFIG.singlePinZoom) {
  const state = getState(handle);
  const [lng, lat] = propertyCoordinates(listing);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.cameraMoveReason = "selection";
  state.map.flyTo({ center: [lng, lat], zoom: Math.max(state.map.getZoom(), zoom), duration: reduced ? 0 : 500 });
}

export function goToLagos(handle) {
  const state = getState(handle);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.cameraMoveReason = "reset";
  state.map.flyTo({ center: MAP_CONFIG.center, zoom: MAP_CONFIG.initialZoom, duration: reduced ? 0 : 500 });
}

export function flyToArea(handle, area) {
  const state = getState(handle);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.cameraMoveReason = "area";
  state.map.flyTo({ center: [area.longitude, area.latitude], zoom: MAP_CONFIG.propertyZoom, duration: reduced ? 0 : 450 });
}

export function zoomMap(handle, delta) {
  const state = getState(handle);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  state.cameraMoveReason = "zoom";
  state.map.zoomTo(state.map.getZoom() + delta, { duration: reduced ? 0 : 220 });
}

export function removeMapView(handle) {
  const state = mapStates.get(handle);
  if (!state) return;
  state.areaMarkers.forEach((marker) => marker.remove());
  if (state.keyboardHandler) state.map.getCanvas().removeEventListener("keydown", state.keyboardHandler);
  state.map.remove();
  mapStates.delete(handle);
}
