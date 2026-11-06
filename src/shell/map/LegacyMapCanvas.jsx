import { MapPin } from "lucide-react";

function AreaLinks({ areas, onSelect }) {
  return <ol className="shell-map-area-links">{areas.map((area) => <li key={area.name}>
    <button type="button" onClick={() => onSelect(area)} aria-label={`${area.name}: ${area.updateCount} active updates, ${area.listingCount} listings`}>
      <span>{area.name}</span><small>{area.updateCount} updates · {area.listingCount} listings</small>
    </button>
  </li>)}</ol>;
}

export default function LegacyMapCanvas({ areas, selectedArea, onSelect }) {
  return <div className="shell-map-layout">
    <section className="shell-map-visual" aria-label="Approximate map of Lagos areas">
      <div className="shell-map-background" role="group" aria-label="Map pins. Use the area list for an accessible text alternative">
        <span className="shell-map-water" aria-hidden="true" />
        <span className="shell-map-road shell-map-road-one" aria-hidden="true" />
        <span className="shell-map-road shell-map-road-two" aria-hidden="true" />
        <span className="shell-map-road shell-map-road-three" aria-hidden="true" />
        <span className="shell-map-label shell-map-label-one" aria-hidden="true">LAGOS LAGOON</span>
        <span className="shell-map-label shell-map-label-two" aria-hidden="true">LAGOS</span>
        {areas.map((area) => <button
          type="button"
          className={`shell-map-pin${selectedArea?.name === area.name ? " is-selected" : ""}`}
          key={area.name}
          style={{ left: `${area.x}%`, top: `${area.y}%` }}
          onClick={() => onSelect(area)}
          aria-label={`${area.name}: ${area.updateCount} active updates and ${area.listingCount} listings`}
          aria-pressed={selectedArea?.name === area.name}
        ><MapPin size={16} aria-hidden="true" /><span>{area.updateCount}</span></button>)}
        <details className="shell-map-mobile-list"><summary>Area list</summary><AreaLinks areas={areas} onSelect={onSelect} /></details>
        <small className="shell-map-disclaimer">Approximate area locations</small>
      </div>
    </section>
    <aside className="shell-map-area-panel" aria-label="Areas and available listings"><h2>Areas</h2><AreaLinks areas={areas} onSelect={onSelect} /></aside>
  </div>;
}
