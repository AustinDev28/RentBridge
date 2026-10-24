import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import "./Properties.css";
import FeaturedProperties, { PROPERTIES } from "./FeaturedProperties";

const BEDROOM_OPTIONS = ["1", "2", "3", "4+"];
const AMENITIES = ["Parking", "Generator", "Swimming Pool"];

/* Fixed list, in this order. Must exactly match the `category` values
   used in PROPERTIES (see FeaturedProperties.jsx) — otherwise a type
   here will never match anything and silently return zero results. */
const PROPERTY_TYPES = ["Flats", "Self Contain", "Apartment", "Duplex", "House"];

/* Locations are still built from your listings, so every option here
   is guaranteed to match at least one property. */
const LOCATIONS = [...new Set(PROPERTIES.map((p) => p.location.split(",")[0].trim()))].sort();

const PRICE_STEPS = [400000, 1000000, 2000000, 5000000, 10000000, 50000000, 100000000, 500000000, 700000000];

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="rb-checkbox-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default function Properties() {
  // --- Top search bar (location/price apply when "Search" is clicked) ---
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedSearch, setAppliedSearch] = useState(null);

  // --- Property type: ONE shared filter, used by both the top search
  // bar's dropdown and the sidebar checkboxes, so they can never
  // disagree or cancel each other out. Applies live, like the rest
  // of the sidebar — no need to click Search for type to take effect.
  const [selectedTypes, setSelectedTypes] = useState([]);

  // --- Sidebar filters (apply live) ---
  const [selectedBeds, setSelectedBeds] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sidebarMinPrice, setSidebarMinPrice] = useState("");
  const [sidebarMaxPrice, setSidebarMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("Newest First");

  // Open by default on desktop, collapsed on phones/tablets so listings get the full width
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth > 900
  );

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearch({ location, minPrice, maxPrice });
  };

  const clearAll = () => {
    setSelectedTypes([]);
    setSelectedBeds([]);
    setSelectedAmenities([]);
    setSidebarMinPrice("");
    setSidebarMaxPrice("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setAppliedSearch(null);
  };

  /* ---------------- Filtering ----------------
     Every filter below is additive (AND logic): a listing must satisfy
     every active filter — top search bar AND sidebar — to show up. */
  const filteredProperties = useMemo(() => {
    const s = appliedSearch || { location: "", minPrice: "", maxPrice: "" };

    let result = PROPERTIES.filter((p) => {
      // Top search bar: location (substring match against the full address)
      if (s.location && !p.location.toLowerCase().includes(s.location.toLowerCase())) {
        return false;
      }
      // Top search bar: price range
      if (s.minPrice && p.price < Number(s.minPrice)) return false;
      if (s.maxPrice && p.price > Number(s.maxPrice)) return false;

      // Property type — single shared filter (exact match against category),
      // driven by both the top dropdown and the sidebar checkboxes.
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(p.category);
      if (!matchesType) return false;

      // Sidebar: bedrooms
      const matchesBeds =
        selectedBeds.length === 0 ||
        selectedBeds.some((b) => (b === "4+" ? p.beds >= 4 : p.beds === Number(b)));
      if (!matchesBeds) return false;

      // Sidebar: amenities (must have all selected amenities)
      const matchesAmenities =
        selectedAmenities.length === 0 ||
        selectedAmenities.every((a) => p.amenities.includes(a));
      if (!matchesAmenities) return false;

      // Sidebar: price range
      if (sidebarMinPrice && p.price < Number(sidebarMinPrice)) return false;
      if (sidebarMaxPrice && p.price > Number(sidebarMaxPrice)) return false;

      return true;
    });

    if (sortBy === "Price: Low to High") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "Price: High to Low") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [appliedSearch, selectedTypes, selectedBeds, selectedAmenities, sidebarMinPrice, sidebarMaxPrice, sortBy]);

  return (
    <div className="rb-container">
      <h1 className="rb-title">Properties</h1>
      <p className="rb-subtitle">Find the perfect property that fits your needs.</p>

      <form className="rb-search-bar" onSubmit={handleSearch}>
        <div className="rb-field">
          <label htmlFor="rb-location">Location</label>
          <select id="rb-location" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All Locations</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="rb-field">
          <label htmlFor="rb-type">Property Type</label>
          <select
            id="rb-type"
            value={selectedTypes.length === 1 ? selectedTypes[0] : ""}
            onChange={(e) => setSelectedTypes(e.target.value ? [e.target.value] : [])}
          >
            <option value="">
              {selectedTypes.length > 1 ? `${selectedTypes.length} types selected` : "Any Type"}
            </option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="rb-field">
          <label htmlFor="rb-min">Min Price</label>
          <select id="rb-min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}>
            <option value="">Min</option>
            {PRICE_STEPS.map((v) => (
              <option key={v} value={v}>₦{v.toLocaleString("en-NG")}</option>
            ))}
          </select>
        </div>

        <div className="rb-field">
          <label htmlFor="rb-max">Max Price</label>
          <select id="rb-max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Max</option>
            {PRICE_STEPS.map((v) => (
              <option key={v} value={v}>₦{v.toLocaleString("en-NG")}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="rb-search-btn">
          <Search size={16} /> Search
        </button>
      </form>
      <p className="rb-search-hint">
        Rentals currently range ₦1.2M–₦7M/year, sales range ₦120M–₦650M — a price range outside
        that won't match any listing yet.
      </p>

      <div className={`rb-content-grid ${filtersOpen ? "" : "rb-content-grid--collapsed"}`}>
        <aside className={`rb-filters ${filtersOpen ? "" : "rb-filters--hidden"}`} id="rb-filters-panel">
          <div className="rb-filters-head">
            <h3>Filters</h3>
            <button type="button" className="rb-clear-link" onClick={clearAll}>Clear all</button>
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
              <select value={sidebarMinPrice} onChange={(e) => setSidebarMinPrice(e.target.value)}>
                <option value="">Min</option>
                {PRICE_STEPS.map((v) => (
                  <option key={v} value={v}>₦{v.toLocaleString("en-NG")}</option>
                ))}
              </select>
              <select value={sidebarMaxPrice} onChange={(e) => setSidebarMaxPrice(e.target.value)}>
                <option value="">Max</option>
                {PRICE_STEPS.map((v) => (
                  <option key={v} value={v}>₦{v.toLocaleString("en-NG")}</option>
                ))}
              </select>
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
  );
}