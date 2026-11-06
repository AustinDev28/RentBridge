import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

function priceText(listing) {
  const price = `₦${Number(listing.price || 0).toLocaleString("en-NG")}`;
  return listing.listingType === "rent" ? `${price} / year` : price;
}

function firstPhoto(listing) {
  return Array.isArray(listing.images) ? listing.images[0] : listing.images;
}

function ResultRow({ listing, selected, onSelect, rowRef }) {
  return <li className={`rb-map-listing-row${selected ? " is-selected" : ""}`} ref={rowRef}>
    <button className="rb-map-listing-select" type="button" onClick={() => onSelect(listing)} aria-label={`Center map on ${listing.title}, ${priceText(listing)}, ${listing.areaName || listing.location}`}>
      {firstPhoto(listing) && <img src={firstPhoto(listing)} alt="" loading="lazy" />}
      <span><strong>{listing.title}</strong><small>{priceText(listing)} · {listing.areaName || listing.location}</small></span>
    </button>
    <Link className="rb-map-listing-link" to={`/properties?property=${encodeURIComponent(listing.id)}`} aria-label={`View ${listing.title} in ${listing.areaName || listing.location}`}>View</Link>
  </li>;
}

function ListingItems({ listings, selectedId, onSelect, rowRefs }) {
  return <ul className="rb-map-listing-results" aria-label="Properties in this area">
    {listings.map((listing) => <ResultRow
      key={listing.id}
      listing={listing}
      selected={String(listing.id) === String(selectedId)}
      onSelect={onSelect}
      rowRef={(node) => { if (node) rowRefs.current.set(String(listing.id), node); else rowRefs.current.delete(String(listing.id)); }}
    />)}
  </ul>;
}

function CountLine({ total, capped, zoomHint }) {
  return <>
    <p className="rb-map-results-count" aria-live="polite">{total.toLocaleString("en-NG")} {total === 1 ? "property" : "properties"} in this area</p>
    {(capped || zoomHint) && <p className="rb-map-results-hint">Zoom in to see more</p>}
  </>;
}

export default function ListingResultsPanel({
  listings = [], total = 0, capped = false, zoomHint = false, selectedId = "", selectedGroup = [],
  areaMode = false, onSelectListing = () => {}, onCloseGroup = () => {}, onShowAllLagos = () => {},
}) {
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const rowRefs = useRef(new Map());
  const groupRowRefs = useRef(new Map());
  const listTriggerRef = useRef(null);
  const sheetCloseRef = useRef(null);
  const firstGroupId = selectedGroup[0]?.id;

  useEffect(() => {
    if (!mobileListOpen) return undefined;
    sheetCloseRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileListOpen(false);
        requestAnimationFrame(() => listTriggerRef.current?.focus());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileListOpen]);

  useEffect(() => {
    if (!firstGroupId) return;
    const isMobile = window.matchMedia?.("(max-width: 767px)").matches;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const frame = window.requestAnimationFrame(() => {
      const row = (isMobile ? groupRowRefs : rowRefs).current.get(String(firstGroupId));
      row?.scrollIntoView?.({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [firstGroupId]);

  const resultList = () => <>
    <CountLine total={total} capped={capped} zoomHint={zoomHint} />
    {listings.length ? <ListingItems listings={listings} selectedId={selectedId} onSelect={(listing) => { onSelectListing(listing); setMobileListOpen(false); }} rowRefs={rowRefs} /> : areaMode && total > 0
      ? <p className="rb-map-area-mode-hint">Zoom in to view listings on the map.</p>
      : <div className="rb-map-empty-results">
        <p>No properties in this area</p>
        <button type="button" className="shell-secondary-button" onClick={() => { setMobileListOpen(false); onShowAllLagos(); }}>Show all of Lagos</button>
      </div>}
  </>;

  return <>
    <aside className="rb-map-results-desktop" aria-label="Listings in the visible map area">{resultList()}</aside>
    <button ref={listTriggerRef} className="rb-map-list-trigger" type="button" aria-expanded={mobileListOpen} onClick={() => setMobileListOpen(true)}>
      List <span>{total.toLocaleString("en-NG")}</span>
    </button>
    {mobileListOpen && <div className="rb-map-list-sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setMobileListOpen(false)}>
      <section className="rb-map-list-sheet" role="dialog" aria-modal="true" aria-label="Listings in this area">
        <button ref={sheetCloseRef} className="rb-map-list-sheet-close" type="button" aria-label="Close listings" onClick={() => { setMobileListOpen(false); requestAnimationFrame(() => listTriggerRef.current?.focus()); }}><X size={19} /></button>
        <h2>Listings</h2>
        {resultList()}
      </section>
    </div>}
    {!!selectedGroup.length && <aside className="rb-map-group-bottom-card" aria-label={`${selectedGroup.length} listings at this location`}>
      <button className="rb-map-group-close" type="button" aria-label="Close location listings" onClick={onCloseGroup}><X size={18} /></button>
      <h2>{selectedGroup.length > 1 ? `${selectedGroup.length} listings here` : "Property preview"}</h2>
      <ul className="rb-map-group-list">
        {selectedGroup.map((listing) => <li key={listing.id} ref={(node) => { if (node) groupRowRefs.current.set(String(listing.id), node); else groupRowRefs.current.delete(String(listing.id)); }}>
          {firstPhoto(listing) && <img src={firstPhoto(listing)} alt="" loading="lazy" />}
          <div><strong>{priceText(listing)}</strong><span>{listing.title}</span><small>{listing.areaName || listing.location}</small>
            <Link to={`/properties?property=${encodeURIComponent(listing.id)}`} aria-label={`View ${listing.title} in ${listing.areaName || listing.location}`}>View property</Link>
          </div>
        </li>)}
      </ul>
    </aside>}
  </>;
}
