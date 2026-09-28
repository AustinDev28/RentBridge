import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Home, SlidersHorizontal, ChevronDown } from "lucide-react";
import "./Properties.css";
import FeaturedProperties, { PROPERTIES } from "./FeaturedProperties";

const PROPERTY_TYPES = ["Apartment", "Duplex", "House", "Studio"];
const BEDROOM_OPTIONS = ["1", "2", "3", "4+"];
const AMENITIES = ["Parking", "Generator", "Swimming Pool"];

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="rb-checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default function Properties() {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedBeds, setSelectedBeds] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState("Newest First");
  // Open by default on desktop, collapsed on phones/tablets so listings get the full width
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 900
  );

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const clearAll = () => {
    setSelectedTypes([]);
    setSelectedBeds([]);
    setSelectedAmenities([]);
  };

  // Filter + sort the shared PROPERTIES data based on the sidebar controls.
  // Property "type" isn't its own field on the data yet, so we match it
  // loosely against the title (e.g. "Duplex" matches "Luxury 3 Bedroom Duplex").
  const filteredProperties = useMemo(() => {
    let result = PROPERTIES.filter((p) => {
      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some((t) => p.title.toLowerCase().includes(t.toLowerCase()));

      const matchesBeds =
        selectedBeds.length === 0 ||
        selectedBeds.some((b) => (b === "4+" ? p.beds >= 4 : p.beds === Number(b)));

      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((a) => p.amenities.includes(a));

      return matchesType && matchesBeds && matchesAmenities;
    });

    if (sortBy === "Price: Low to High") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [selectedTypes, selectedBeds, selectedAmenities, sortBy]);

  return (
      <div className="rb-container">
        <h1 className="rb-title">Properties</h1>
        <p className="rb-subtitle">Find the perfect property that fits your needs.</p>

        <div className="rb-search-bar">
          <div className="rb-field">
            <label>Location</label>
            <select>
              <option>Agege</option>
              <option>Ajeromi-Ifelodun</option>
              <option>Alimosho</option>
              <option>Amuwo-Odofin</option>
              <option>Apapa</option>
              <option>Badagry</option>
              <option>Epe</option>
              <option>Eti-Osa (Lekki / Ikoyi / VI)</option>
              <option>Ibeju-Lekki</option>
              <option>Ifako-Ijaiye</option>
              <option>Ikeja</option>
              <option>Ikorodu</option>
              <option>Kosofe</option>
              <option>Lagos Island</option>
              <option>Lagos Mainland</option>
              <option>Mushin</option>
              <option>Ojo</option>
              <option>Oshodi-Isolo</option>
              <option>Shomolu</option>
              <option>Surulere</option>
              <option>Iyana-Ipaja</option>
              <option>Ajah</option>
            </select>
          <div className="rb-field">
            <label>Property Type</label>
            <select>
              <option>Apartment</option>
              <option>Duplex</option>
              <option>3 Bedroom</option>
              <option>2 Bedroom</option>
              <option>1 Bedroom</option>
              <option>Self contain</option>
            </select>
          </div>
          <div className="rb-field">
            <label>Min Price</label>
            <select><option>Min</option><option>₦400,000</option><option>₦1,000,000</option></select>
          </div>
          <div className="rb-field">
            <label>Max Price</label>
            <select><option>Max</option><option>₦1,000,000</option><option>₦10,000,000</option></select>
          </div>
          <button className="rb-search-btn">
            <Search size={16} /> Search
          </button>
        </div>

        <div className={`rb-content-grid ${filtersOpen ? "" : "rb-content-grid--collapsed"}`}>
          <aside className={`rb-filters ${filtersOpen ? "" : "rb-filters--hidden"}`} id="rb-filters-panel">
            <div className="rb-filters-head">
              <h3>Filters</h3>
              <button className="rb-clear-link" onClick={clearAll}>Clear all</button>
            </div>

            <div className="rb-filter-group">
              <h4>Property Type</h4>
              {PROPERTY_TYPES.map((t) => (
                <CheckboxRow key={t} label={t} checked={selectedTypes.includes(t)} onChange={() => toggle(selectedTypes, setSelectedTypes, t)} />
              ))}
            </div>

            <div className="rb-filter-group">
              <h4>Price Range</h4>
              <div className="rb-range-row">
                <select><option>Min</option><option>₦₦400,000</option><option>₦100,000</option></select>
                <select><option>Max</option><option>₦1,000,000</option><option>₦10,000,000</option></select>
              </div>
            </div>

            <div className="rb-filter-group">
              <h4>Bedrooms</h4>
              {BEDROOM_OPTIONS.map((b) => (
                <CheckboxRow key={b} label={b} checked={selectedBeds.includes(b)} onChange={() => toggle(selectedBeds, setSelectedBeds, b)} />
              ))}
            </div>

            <div className="rb-filter-group">
              <h4>Amenities</h4>
              {AMENITIES.map((a) => (
                <CheckboxRow key={a} label={a} checked={selectedAmenities.includes(a)} onChange={() => toggle(selectedAmenities, setSelectedAmenities, a)} />
              ))}
            </div>
          </aside>

          <section>
            <div className="rb-results-head">
              <h3>{filteredProperties.length} Properties Found</h3>
              <div className="rb-results-actions">
                <button
                  type="button"
                  className={`rb-filter-toggle ${filtersOpen ? "is-open" : ""}`}
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  aria-controls="rb-filters-panel"
                >
                  <SlidersHorizontal size={15} />
                  {filtersOpen ? "Hide filters" : "Show filters"}
                  <ChevronDown size={15} className="rb-chevron" />
                </button>
                <select className="rb-sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option>Newest First</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            <FeaturedProperties properties={filteredProperties} />
          </section>
        </div>
      </div>
    </div>
  );
}