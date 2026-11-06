import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Maximize2, RotateCw } from "lucide-react";
import { createMapView, removeMapView, resizeMapView, showApproxCircle } from "../mapService.js";
import { MAP_CONFIG } from "./mapConfig.js";

function propertyCoordinates(property) {
  return property.showExactLocation && Number.isFinite(property.exactLat) && Number.isFinite(property.exactLng)
    ? { lat: property.exactLat, lng: property.exactLng }
    : { lat: property.approxLat, lng: property.approxLng };
}

export default function PropertyMapCanvas({ property, theme }) {
  const containerRef = useRef(null);
  const mapHandleRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);
  const [error, setError] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.matchMedia?.("(max-width: 768px)").matches ?? false);
  const [interacting, setInteracting] = useState(() => !(window.matchMedia?.("(max-width: 768px)").matches ?? false));
  const point = propertyCoordinates(property);

  useEffect(() => {
    const query = window.matchMedia?.("(max-width: 768px)");
    if (!query) return undefined;
    const handleChange = (event) => {
      setIsSmallScreen(event.matches);
      setInteracting(!event.matches);
    };
    query.addEventListener?.("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    let canceled = false;
    let mapHandle;
    setError(false);
    createMapView(containerRef.current, {
      theme,
      center: [point.lng, point.lat],
      zoom: 13.3,
      onError: () => { if (!canceled) setError(true); },
    }).then((handle) => {
      mapHandle = handle;
      if (canceled) { removeMapView(handle); return; }
      mapHandleRef.current = handle;
      showApproxCircle(handle, property, MAP_CONFIG.circleRadiusMeters);
      resizeMapView(handle);
    }).catch(() => { if (!canceled) setError(true); });
    return () => {
      canceled = true;
      if (mapHandle) removeMapView(mapHandle);
      mapHandleRef.current = null;
    };
  }, [property.id, theme, mapKey]);

  useEffect(() => { if (mapHandleRef.current) resizeMapView(mapHandleRef.current); }, [interacting]);

  const destination = `${point.lat},${point.lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return <div className="rb-property-map-card">
    <div className="rb-property-map-viewport">
      {error ? <div className="rb-property-map-fallback" role="status"><MapPin size={18} /><span>{property.areaName || property.location}</span><button type="button" onClick={() => setMapKey((value) => value + 1)}><RotateCw size={15} /> Retry map</button></div> : <div ref={containerRef} className={`rb-map-canvas rb-property-map-canvas${interacting ? " is-interactive" : ""}`} aria-label={`Approximate location map for ${property.title}`} />}
      {isSmallScreen && !error && <button type="button" className="rb-property-map-interaction" onClick={() => setInteracting((value) => !value)}>{interacting ? "Stop map interaction" : "Tap to interact with map"}</button>}
      {!error && <Link className="rb-property-map-expand" to={`/map?property=${encodeURIComponent(property.id)}`} aria-label="Expand property map"><Maximize2 size={17} /></Link>}
    </div>
    <div className="rb-property-map-actions">
      <Link className="shell-primary-button" to={`/map?property=${encodeURIComponent(property.id)}`}>View on map</Link>
      <a className="shell-secondary-button" href={directionsUrl} target="_blank" rel="noopener noreferrer">Directions</a>
    </div>
    {!property.showExactLocation && <p className="rb-property-map-privacy">Exact address shared after you contact the agent</p>}
  </div>;
}
