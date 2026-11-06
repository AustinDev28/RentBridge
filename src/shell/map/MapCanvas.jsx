import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Minus, Plus } from "lucide-react";
import { createMapView, flyToArea, flyToListing, getListingGroup, goToLagos, removeMapView, setAreaBubbles, setListings, setSelectedArea, setSelectedListing, subscribeViewport, zoomMap } from "./mapService.js";
import { MAP_CONFIG } from "./mapConfig.js";
import ListingResultsPanel from "./ListingResultsPanel.jsx";
import PropertyPreviewCard from "./PropertyPreviewCard.jsx";

export default function MapCanvas({
  areas = [], result = {}, selectedArea, selectedProperty, selectedId,
  onSelectArea, onClearProperty, onShowAllLagos, onViewportChange, onMapError, theme, mapKey,
}) {
  const containerRef = useRef(null);
  const handleRef = useRef(null);
  const latestRef = useRef({ areas, result, selectedArea, selectedProperty, selectedId, onSelectArea, onClearProperty, onShowAllLagos, onViewportChange, onMapError });
  const [mapError, setMapError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState("");
  latestRef.current = { areas, result, selectedArea, selectedProperty, selectedId, onSelectArea, onClearProperty, onShowAllLagos, onViewportChange, onMapError };

  const visibleAreaCounts = result.mode === "areas" ? result.areaCounts || [] : areas;
  const listings = result.mode === "listings" ? result.listings || [] : [];

  const handleGroupSelect = useCallback((group) => {
    setSelectedGroup(group);
    setSelectedListingId(String(group[0]?.id || ""));
    if (handleRef.current && group[0]) setSelectedListing(handleRef.current, group[0].id);
    if (latestRef.current.selectedProperty) latestRef.current.onClearProperty?.();
  }, []);

  const selectListing = useCallback((listing) => {
    const handle = handleRef.current;
    if (!handle || !listing) return;
    const group = getListingGroup(handle, listing.id);
    setSelectedGroup(group);
    setSelectedListingId(String(listing.id));
    setSelectedListing(handle, listing.id);
    flyToListing(handle, listing);
  }, []);

  const closeGroup = useCallback(() => {
    setSelectedGroup([]);
    setSelectedListingId("");
    if (handleRef.current) setSelectedListing(handleRef.current, null);
  }, []);

  const selectArea = useCallback((area) => {
    latestRef.current.onSelectArea?.(area);
    if (handleRef.current) flyToArea(handleRef.current, area);
  }, []);

  useEffect(() => {
    let canceled = false;
    let handle;
    setMapError("");
    setMapReady(false);
    createMapView(containerRef.current, {
      theme,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.initialZoom,
      onError: () => {
        if (!canceled) {
          setMapError("The map could not load. Check your connection and retry.");
          latestRef.current.onMapError?.(true);
        }
      },
    }).then((mapHandle) => {
      handle = mapHandle;
      if (canceled) { removeMapView(mapHandle); return; }
      handleRef.current = mapHandle;
      setMapReady(true);
      const latest = latestRef.current;
      const startAreas = latest.result.mode === "areas" ? latest.result.areaCounts || [] : latest.areas;
      setAreaBubbles(mapHandle, startAreas, (area) => selectArea(area));
      setListings(mapHandle, latest.result.mode === "listings" ? latest.result.listings || [] : [], handleGroupSelect);
      setSelectedArea(mapHandle, latest.selectedArea?.name || "");
      setSelectedListing(mapHandle, latest.selectedId || "");
      if (latest.selectedArea) flyToArea(mapHandle, latest.selectedArea);
      else if (latest.selectedProperty) flyToListing(mapHandle, latest.selectedProperty);
      subscribeViewport(mapHandle, (viewport) => latestRef.current.onViewportChange?.(viewport));
      latestRef.current.onMapError?.(false);
    }).catch(() => {
      if (!canceled) {
        setMapError("The map could not load. Check your connection and retry.");
        latestRef.current.onMapError?.(true);
      }
    });
    return () => {
      canceled = true;
      if (handle) removeMapView(handle);
      handleRef.current = null;
    };
  }, [theme, mapKey, handleGroupSelect, selectArea]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    setAreaBubbles(handle, visibleAreaCounts, (area) => selectArea(area));
  }, [areas, result.areaCounts, result.mode, selectArea]);

  useEffect(() => {
    if (!handleRef.current) return;
    setListings(handleRef.current, listings, handleGroupSelect);
    if (!selectedProperty && selectedListingId && !listings.some((listing) => String(listing.id) === selectedListingId)) {
      setSelectedGroup([]);
      setSelectedListingId("");
      setSelectedListing(handleRef.current, selectedId || null);
    }
  }, [listings, handleGroupSelect, selectedListingId, selectedProperty, selectedId]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    setSelectedArea(handle, selectedArea?.name || "");
    setSelectedListing(handle, selectedId || "");
    if (selectedArea) flyToArea(handle, selectedArea);
    else if (selectedProperty) flyToListing(handle, selectedProperty);
  }, [selectedArea?.name, selectedProperty?.id, selectedId]);

  const showAllLagos = useCallback(() => {
    closeGroup();
    latestRef.current.onShowAllLagos?.();
    if (handleRef.current) goToLagos(handleRef.current);
  }, [closeGroup]);

  const zoomIn = () => handleRef.current && zoomMap(handleRef.current, 1);
  const zoomOut = () => handleRef.current && zoomMap(handleRef.current, -1);

  return <div className="rb-map-layout">
    <section className="rb-map-visual" aria-label="Interactive property map">
      <div ref={containerRef} className="rb-map-canvas" aria-label="Map of property locations. Use the listings list to browse properties with a keyboard." />
      {!mapReady && !mapError && <div className="rb-map-loading" role="status">Loading map…</div>}
      <div className="rb-map-controls" role="group" aria-label="Map zoom controls">
        <button type="button" aria-label="Zoom in" onClick={zoomIn}><Plus size={19} /></button>
        <button type="button" aria-label="Zoom out" onClick={zoomOut}><Minus size={19} /></button>
      </div>
      {mapError && <div className="rb-map-error" role="alert"><strong>Map unavailable</strong><span>{mapError}</span></div>}
      <small className="rb-map-disclaimer">Property locations are approximate unless marked exact.</small>
    </section>
    {!selectedProperty && <ListingResultsPanel
      listings={listings}
      total={result.total || 0}
      capped={result.capped}
      zoomHint={result.mode === "areas"}
      areaMode={result.mode === "areas"}
      selectedId={selectedListingId || selectedId}
      selectedGroup={selectedGroup}
      onSelectListing={selectListing}
      onCloseGroup={closeGroup}
      onShowAllLagos={showAllLagos}
    />}
    {selectedProperty && <aside className="rb-map-side-panel rb-map-query-preview" aria-label="Selected property preview">
      <PropertyPreviewCard property={selectedProperty} onClose={() => latestRef.current.onClearProperty?.()} />
    </aside>}
  </div>;
}
