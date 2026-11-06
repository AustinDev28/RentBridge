import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, X } from "lucide-react";
import { useTheme } from "../../theme/useTheme.js";
import { getMapAreas } from "../mapService.js";

const LegacyMapCanvas = lazy(() => import("./LegacyMapCanvas.jsx"));

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

export default function LegacyMapPage() {
  const { resolvedTheme } = useTheme();
  const [type, setType] = useState("rent");
  const [areas, setAreas] = useState([]);
  const [selectedAreaName, setSelectedAreaName] = useState("");
  const [loading, setLoading] = useState(true);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedArea = useMemo(() => areas.find((area) => area.name === selectedAreaName) || null, [areas, selectedAreaName]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getMapAreas(type).then((nextAreas) => {
      if (!active) return;
      setAreas(nextAreas);
      setSelectedAreaName((current) => current && nextAreas.some((area) => area.name === current) ? current : "");
    }).catch(() => {
      if (active) setAreas([]);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type]);

  const selectArea = (area) => {
    setMessage("");
    setSelectedAreaName(area.name);
  };

  const findNearby = () => {
    setMessage("");
    if (!navigator.geolocation) { setNearbyOpen(false); setMessage("Choose an area instead"); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const nearest = areas.reduce((best, area) => {
        const score = (area.latitude - position.coords.latitude) ** 2 + (area.longitude - position.coords.longitude) ** 2;
        return !best || score < best.score ? { name: area.name, score } : best;
      }, null);
      if (nearest) setSelectedAreaName(nearest.name);
      else setMessage("Choose an area instead");
      setNearbyOpen(false);
      setLocationBusy(false);
    }, () => {
      setMessage("Choose an area instead");
      setNearbyOpen(false);
      setLocationBusy(false);
    }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 });
  };

  return <main className="shell-map-page" data-theme={resolvedTheme}>
    <header className="shell-map-heading">
      <div><p className="shell-map-eyebrow">EXPLORE LAGOS</p><h1>Explore by area</h1></div>
      <div className="shell-map-type-toggle" role="group" aria-label="Filter map by property type">
        <button type="button" aria-pressed={type === "rent"} className={type === "rent" ? "is-active" : ""} onClick={() => setType("rent")}>Rent</button>
        <button type="button" aria-pressed={type === "buy"} className={type === "buy" ? "is-active" : ""} onClick={() => setType("buy")}>Buy</button>
      </div>
    </header>
    <div className="shell-map-action-row"><button type="button" onClick={() => setNearbyOpen(true)}><MapPin size={16} aria-hidden="true" />Near me</button>{message && <span role="status">{message}</span>}</div>
    {loading ? <MapLoading /> : <Suspense fallback={<MapLoading />}>
      <LegacyMapCanvas areas={areas} selectedArea={selectedArea} onSelect={selectArea} />
    </Suspense>}
    {selectedArea && <aside className="shell-map-selection" aria-label={`${selectedArea.name} area details`}>
      <button className="shell-map-selection-close" type="button" aria-label="Close area details" onClick={() => setSelectedAreaName("")}><X size={19} /></button>
      <h2>{selectedArea.name}</h2>
      <p><strong>{selectedArea.updateCount}</strong> active {type} {selectedArea.updateCount === 1 ? "update" : "updates"} <span>·</span> <strong>{selectedArea.listingCount}</strong> {type} {selectedArea.listingCount === 1 ? "listing" : "listings"}</p>
      <div><Link className="shell-primary-button" to="/">View updates</Link><Link className="shell-secondary-button" to="/properties">View properties</Link></div>
    </aside>}
    {nearbyOpen && <NearbyDialog onClose={() => setNearbyOpen(false)} onUse={findNearby} busy={locationBusy} />}
  </main>;
}
