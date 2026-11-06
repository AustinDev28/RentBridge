import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, RotateCw, X } from "lucide-react";
import { useTheme } from "../../theme/useTheme.js";
import { getMapAreas, getPropertyById, getPropertyLocations } from "./dataService.js";
import { MAP_CONFIG } from "./mapConfig.js";
import "./map.css";

const MapCanvas = lazy(() => import("./MapCanvas.jsx"));

function MapLoading() {
  return <div className="shell-map-skeleton" aria-label="Loading map" role="status"><span /><i /><i /><b /></div>;
}

function NearbyDialog({ onClose, onUse, busy }) {
  const cancelRef = useRef(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return <div className="shell-map-dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="shell-map-nearby-dialog" role="dialog" aria-modal="true" aria-labelledby="shell-map-nearby-title">
      <button className="shell-map-dialog-close" type="button" aria-label="Close location explanation" onClick={onClose}><X size={19} /></button>
      <span className="shell-map-nearby-icon"><MapPin size={20} /></span>
      <h2 id="shell-map-nearby-title">Find areas near you</h2>
      <p>Your browser will ask for your location so the map can highlight the nearest area. Your exact coordinates are used once and are not saved.</p>
      <button className="shell-primary-button" type="button" disabled={busy} onClick={onUse}>{busy ? "Finding nearby areas…" : "Use my location"}</button>
      <button className="shell-secondary-button" type="button" ref={cancelRef} onClick={onClose}>Choose an area instead</button>
    </section>
  </div>;
}

function boundsParts(bounds) {
  if (Array.isArray(bounds?.[0])) return [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
  return bounds || [];
}

function materiallyChanged(previous, next) {
  if (!previous?.bounds || !next?.bounds) return true;
  const [westA, southA, eastA, northA] = boundsParts(previous.bounds);
  const [westB, southB, eastB, northB] = boundsParts(next.bounds);
  const centerShift = Math.max(Math.abs((westA + eastA - westB - eastB) / 2), Math.abs((southA + northA - southB - northB) / 2));
  const spanA = Math.max(Math.abs(eastA - westA), Math.abs(northA - southA));
  const spanB = Math.max(Math.abs(eastB - westB), Math.abs(northB - southB));
  const spanChange = spanA > 0 ? Math.abs(spanB - spanA) / spanA : 1;
  return centerShift > Math.max(0.003, spanA * 0.02) || spanChange > 0.04;
}

export default function PropertyMapPage() {
  const { resolvedTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [type, setType] = useState("rent");
  const [filters] = useState({});
  const [areas, setAreas] = useState([]);
  const [result, setResult] = useState({ mode: "areas", listings: [], areaCounts: [], total: 0, capped: false });
  const [selectedAreaName, setSelectedAreaName] = useState("");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingViewport, setPendingViewport] = useState(null);
  const currentViewportRef = useRef(null);
  const committedViewportRef = useRef(null);
  const pendingViewportRef = useRef(null);
  const moveTimerRef = useRef(null);
  const requestIdRef = useRef(0);
  const propertyId = searchParams.get("property");
  const areaParam = searchParams.get("area");
  const selectedArea = useMemo(() => areas.find((area) => area.name === selectedAreaName) || null, [areas, selectedAreaName]);

  const loadViewport = useCallback(async (viewport, nextType = type, nextFilters = filters) => {
    if (!viewport) return;
    const requestId = ++requestIdRef.current;
    const [nextAreas, nextResult] = await Promise.all([
      getMapAreas(nextType),
      getPropertyLocations({ type: nextType, bounds: viewport.bounds, filters: nextFilters, limit: MAP_CONFIG.propertyLimit, zoom: viewport.zoom }),
    ]).catch(() => [[], { mode: "listings", listings: [], areaCounts: [], total: 0, capped: false }]);
    if (requestId !== requestIdRef.current) return;
    setAreas(nextAreas);
    setResult(nextResult);
    currentViewportRef.current = viewport;
    committedViewportRef.current = viewport;
    pendingViewportRef.current = null;
    setPendingViewport(null);
  }, [type, filters]);

  const handleViewportChange = useCallback((viewport) => {
    currentViewportRef.current = viewport;
    if (viewport.reason === "initial" || !committedViewportRef.current) {
      void loadViewport(viewport);
      return;
    }
    if (viewport.reason === "reset") {
      void loadViewport(viewport);
      return;
    }
    const crossedAreaZoom = (committedViewportRef.current.zoom < MAP_CONFIG.propertyZoom) !== (viewport.zoom < MAP_CONFIG.propertyZoom);
    if ((viewport.reason === "zoom" || viewport.reason === "area") && crossedAreaZoom) {
      void loadViewport(viewport);
      return;
    }
    if (viewport.reason === "selection" || viewport.reason === "area" || viewport.reason === "cluster") {
      committedViewportRef.current = viewport;
      pendingViewportRef.current = null;
      setPendingViewport(null);
      return;
    }
    window.clearTimeout(moveTimerRef.current);
    moveTimerRef.current = window.setTimeout(() => {
      if (!materiallyChanged(committedViewportRef.current, viewport)) {
        pendingViewportRef.current = null;
        setPendingViewport(null);
        return;
      }
      pendingViewportRef.current = viewport;
      setPendingViewport(viewport);
    }, 300);
  }, [loadViewport]);

  useEffect(() => () => window.clearTimeout(moveTimerRef.current), []);

  useEffect(() => {
    if (!committedViewportRef.current) return;
    void loadViewport(currentViewportRef.current || committedViewportRef.current, type, filters);
  }, [type, filters, loadViewport]);

  useEffect(() => {
    let active = true;
    if (propertyId) {
      getPropertyById(propertyId).then((property) => {
        if (!active) return;
        setSelectedProperty(property);
        setSelectedAreaName("");
        if (property) setType(property.listingType === "rent" ? "rent" : "buy");
      });
    } else {
      setSelectedProperty(null);
      if (areaParam && areas.length) {
        const match = areas.find((area) => area.name.toLowerCase() === areaParam.toLowerCase());
        setSelectedAreaName(match?.name || "");
      } else if (!areaParam) setSelectedAreaName("");
    }
    return () => { active = false; };
  }, [propertyId, areaParam, areas]);

  const updateQuery = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearchParams(next, { replace: true });
  };

  const selectArea = (area) => {
    setMessage("");
    setSelectedAreaName(area?.name || "");
    updateQuery({ area: area?.name || "", property: "" });
  };

  const searchThisArea = () => {
    const viewport = pendingViewportRef.current;
    if (viewport) void loadViewport(viewport);
  };

  const findNearby = () => {
    setMessage("");
    if (!navigator.geolocation) { setNearbyOpen(false); setMessage("Choose an area instead"); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const nearest = areas.reduce((best, area) => {
        const score = (area.latitude - position.coords.latitude) ** 2 + (area.longitude - position.coords.longitude) ** 2;
        return !best || score < best.score ? { area, score } : best;
      }, null);
      if (nearest) selectArea(nearest.area);
      else setMessage("Choose an area instead");
      setNearbyOpen(false);
      setLocationBusy(false);
    }, () => {
      setMessage("Choose an area instead");
      setNearbyOpen(false);
      setLocationBusy(false);
    }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 });
  };

  const retryMap = () => { setMapError(false); setMapKey((value) => value + 1); };

  return <main className="shell-map-page rb-property-map-page" data-theme={resolvedTheme}>
    <header className="shell-map-heading">
      <div><p className="shell-map-eyebrow">EXPLORE LAGOS</p><h1>Explore properties</h1></div>
      <div className="shell-map-type-toggle" role="group" aria-label="Filter map by property type">
        <button type="button" aria-pressed={type === "rent"} className={type === "rent" ? "is-active" : ""} onClick={() => setType("rent")}>Rent</button>
        <button type="button" aria-pressed={type === "buy"} className={type === "buy" ? "is-active" : ""} onClick={() => setType("buy")}>Buy</button>
      </div>
    </header>
    <div className="shell-map-action-row">
      <button type="button" onClick={() => setNearbyOpen(true)}><MapPin size={16} aria-hidden="true" />Near me</button>
      {pendingViewport && <button type="button" onClick={searchThisArea}>Search this area</button>}
      {message && <span role="status">{message}</span>}
      {mapError && <button type="button" onClick={retryMap}><RotateCw size={15} />Retry map</button>}
    </div>
    <Suspense fallback={<MapLoading />}>
      <MapCanvas
        key={mapKey}
        areas={areas}
        result={result}
        selectedArea={selectedArea}
        selectedProperty={selectedProperty}
        selectedId={selectedProperty?.id}
        onSelectArea={selectArea}
        onClearProperty={() => updateQuery({ property: "" })}
        onShowAllLagos={() => selectArea(null)}
        onViewportChange={handleViewportChange}
        onMapError={setMapError}
        theme={resolvedTheme}
        mapKey={mapKey}
      />
    </Suspense>
    {selectedArea && <aside className="shell-map-selection" aria-label={`${selectedArea.name} area details`}>
      <button className="shell-map-selection-close" type="button" aria-label="Close area details" onClick={() => selectArea(null)}><X size={19} /></button>
      <h2>{selectedArea.name}</h2>
      <p><strong>{selectedArea.updateCount}</strong> active {type} {selectedArea.updateCount === 1 ? "update" : "updates"} <span>·</span> <strong>{selectedArea.listingCount}</strong> {type} {selectedArea.listingCount === 1 ? "listing" : "listings"}</p>
      <div><Link className="shell-primary-button" to="/">View updates</Link><Link className="shell-secondary-button" to="/properties">View properties</Link></div>
    </aside>}
    {nearbyOpen && <NearbyDialog onClose={() => setNearbyOpen(false)} onUse={findNearby} busy={locationBusy} />}
  </main>;
}
