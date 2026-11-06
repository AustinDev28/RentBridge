import { Suspense, lazy, useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { requireSignup } from "../user/requireSignup.js";
import { getSavedPropertyIds, toggleSavedProperty } from "../user/savedProperties.js";
import { USE_PROPERTY_MAPS } from "../shell/map/config.js";
import "./FeaturedProperties.css";

const PropertyMap = lazy(() => import("../shell/map/PropertyMap.jsx"));

/* Property listing imagery. */

// MOCK ONLY - replace with real backend before production
// Approximate points use fixed per-property offsets so the mock never reveals an exact address.
// --- Modern 2 Bedroom Apartment (Lekki Phase 1) ---
import lekki1 from "../assets/properties/lekki-1.jpg";
import lekki2 from "../assets/properties/lekki-2.jpg";
import lekki3 from "../assets/properties/lekki-3.jpg";
import lekki4 from "../assets/properties/lekki-4.jpg";

// --- Luxury 3 Bedroom Duplex (Ikoyi) ---
import ikoyi1 from "../assets/properties/ikoyi-1.jpg";
import ikoyi2 from "../assets/properties/ikoyi-2.jpg";
import ikoyi3 from "../assets/properties/ikoyi-3.jpg";

// --- Spacious 1 Bedroom Apartment (Victoria Island) ---
import vi1 from "../assets/properties/vi-1.jpg";
import vi2 from "../assets/properties/vi-2.jpg";
import vi3 from "../assets/properties/vi-3.jpg";

// --- 4 Bedroom Terrace Duplex (Chevron, Lekki) ---
import chevron1 from "../assets/properties/chevron-1.jpg";
import chevron2 from "../assets/properties/chevron-2.jpg";
import chevron3 from "../assets/properties/chevron-3.jpg";

// --- Cozy Studio Apartment (Yaba) ---
import yaba1 from "../assets/properties/yaba-1.jpg";
import yaba2 from "../assets/properties/yaba-2.jpg";
import yaba3 from "../assets/properties/yaba-3.jpg";

// --- 5 Bedroom Detached Duplex (Banana Island) ---
import banana1 from "../assets/properties/banana-1.jpg";
import banana2 from "../assets/properties/banana-2.jpg";
import banana3 from "../assets/properties/banana-3.jpg";
import banana4 from "../assets/properties/banana-4.jpg";

const SAMPLE_AGENT = {
  id: "agent-demo",
  name: "Kehinde Ade",
  agency: "Bridge Homes Realty",
  location: "Lagos, Nigeria",
  bio: "Helping people find a place to call home. Ask me about viewings, property details, and the areas I serve.",
};

export const PROPERTIES = [
  {
    id: 1,
    verified: true,
    listingType: "rent", // "rent" or "sale"
    category: "Flats", // matches the hero's Property Type dropdown
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "Modern 2 Bedroom Apartment",
    location: "Lekki Phase 1, Lagos",
    areaName: "Lekki",
    approxLat: 6.4485,
    approxLng: 3.4710,
    showExactLocation: false,
    price: 2500000,
    beds: 2,
    baths: 2,
    sqft: 1000,
    description:
      "A bright, modern apartment with open-plan living, fitted kitchen, 24/7 power backup and secure gated parking.",
    amenities: ["24/7 Power", "Gated Estate", "Parking", "Water Supply"],
    images: [lekki1, lekki2, lekki3, lekki4],
  },
  {
    id: 2,
    verified: true,
    listingType: "sale",
    category: "Duplex",
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "Luxury 3 Bedroom Duplex",
    location: "Ikoyi, Lagos",
    areaName: "Victoria Island",
    approxLat: 6.4401,
    approxLng: 3.4279,
    showExactLocation: false,
    price: 185000000,
    beds: 3,
    baths: 3,
    sqft: 3000,
    description:
      "Elegant duplex in the heart of Ikoyi with spacious bedrooms, a private balcony and round-the-clock security.",
    amenities: ["Swimming Pool", "Gym", "CCTV", "Boys' Quarters"],
    images: [ikoyi1, ikoyi2, ikoyi3],
  },
  {
    id: 3,
    verified: false,
    listingType: "rent",
    category: "Apartment",
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "Spacious 1 Bedroom Apartment",
    location: "Victoria Island, Lagos",
    areaName: "Victoria Island",
    approxLat: 6.4294,
    approxLng: 3.4197,
    showExactLocation: false,
    price: 1800000,
    beds: 1,
    baths: 1,
    sqft: 800,
    description:
      "Compact and stylish apartment minutes from the business district. Ideal for professionals.",
    amenities: ["Elevator", "Parking", "Fibre Internet"],
    images: [vi1, vi2, vi3],
  },
  {
    id: 4,
    verified: true,
    listingType: "sale",
    category: "Duplex",
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "4 Bedroom Terrace Duplex",
    location: "Chevron, Lekki, Lagos",
    areaName: "Lekki",
    approxLat: 6.4461,
    approxLng: 3.4863,
    showExactLocation: false,
    price: 120000000,
    beds: 4,
    baths: 4,
    sqft: 3500,
    description:
      "Family-sized terrace duplex with generous living areas, a private garden and a dedicated staff room.",
    amenities: ["Garden", "Generator", "Security", "Staff Room"],
    images: [chevron1, chevron2, chevron3],
  },
  {
    id: 5,
    verified: false,
    listingType: "rent",
    category: "Self Contain",
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "Cozy Studio Apartment",
    location: "Yaba, Lagos",
    areaName: "Yaba",
    approxLat: 6.5106,
    approxLng: 3.3698,
    showExactLocation: false,
    price: 1200000,
    beds: 1,
    baths: 1,
    sqft: 500,
    description:
      "Efficient studio layout close to tech hubs and transport links, perfect for young professionals and students.",
    amenities: ["Wi-Fi Ready", "Prepaid Meter", "Parking"],
    images: [yaba1, yaba2, yaba3],
  },
  {
    id: 6,
    verified: true,
    listingType: "sale",
    category: "House",
    agentPhone: "+2348012345678",
    agent: SAMPLE_AGENT,
    title: "5 Bedroom Detached Duplex",
    location: "Banana Island, Lagos",
    areaName: "Victoria Island",
    approxLat: 6.4470,
    approxLng: 3.4215,
    showExactLocation: false,
    price: 650000000,
    beds: 5,
    baths: 6,
    sqft: 5200,
    description:
      "An expansive waterfront duplex with premium finishes, a home cinema and a private jetty view.",
    amenities: ["Waterfront", "Home Cinema", "Smart Home", "24/7 Security"],
    images: [banana1, banana2, banana3, banana4],
  },
];

const naira = (n) => "₦" + n.toLocaleString("en-NG");

const LISTING_LABEL = { rent: "For Rent", sale: "For Sale" };
const priceSuffix = (listingType) => (listingType === "rent" ? "/ year" : "one-time");

/* ---------- Icons ---------- */
const Icon = ({ children, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const Chevron = ({ dir }) => (
  <Icon size={18}>
    <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
  </Icon>
);
const Heart = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" />
  </svg>
);
const Bed = () => (
  <Icon><path d="M2 20v-8a2 2 0 012-2h16a2 2 0 012 2v8M2 16h20M6 10V6a2 2 0 012-2h8a2 2 0 012 2v4" /></Icon>
);
const Bath = () => (
  <Icon><path d="M4 12h16v3a4 4 0 01-4 4H8a4 4 0 01-4-4v-3zM6 12V6a2 2 0 014 0M6 19l-1 2M18 19l1 2" /></Icon>
);
const Area = () => (
  <Icon><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h6M9 3v6" /></Icon>
);
const Close = () => (
  <Icon size={20}><path d="M18 6L6 18M6 6l12 12" /></Icon>
);
const ShieldCheck = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2.5l7.5 3.5v5c0 5-3.2 8.8-7.5 10.5C7.7 19.8 4.5 16 4.5 11V6L12 2.5z" />
    <path d="M8.8 12l2.3 2.3 4.1-4.6" />
  </svg>
);

/* ---------- Image slider (used in cards and modal) ---------- */
function Slider({ images, alt, large = false, badge, badgeType, children }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef(null);
  const count = images.length;

  const go = useCallback(
    (step) => setIndex((i) => (i + step + count) % count),
    [count]
  );

  const stop = (e, step) => {
    e.stopPropagation(); // don't trigger the card's "open listing" click
    go(step);
  };

  const onTouchStart = (e) => (touchStart.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 40) go(diff < 0 ? 1 : -1);
    touchStart.current = null;
  };

  // Arrow-key support in the large (modal) slider
  useEffect(() => {
    if (!large) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [large, go]);

  return (
    <div className={`slider ${large ? "slider--large" : ""}`}>
      <div className="slider__viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="slider__track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${alt} – photo ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              draggable="false"
            />
          ))}
        </div>

        {/* Slider viewport for image batch type */}
        {badge && (
          <span className={`badge ${badgeType === "sale" ? "badge--sale" : ""}`}>
            {badge}
          </span>
        )}
        {children}

        {count > 1 && (
          <>
            <button className="slider__arrow slider__arrow--prev" onClick={(e) => stop(e, -1)} aria-label="Previous image">
              <Chevron dir="left" />
            </button>
            <button className="slider__arrow slider__arrow--next" onClick={(e) => stop(e, 1)} aria-label="Next image">
              <Chevron dir="right" />
            </button>

            {large ? (
              <span className="slider__count">{index + 1} / {count}</span>
            ) : (
              <div className="slider__dots">
                {images.map((_, i) => (
                  <span key={i} className={i === index ? "is-active" : ""} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {large && count > 1 && (
        <div className="slider__thumbs">
          {images.map((src, i) => (
            <button key={src} className={i === index ? "is-active" : ""} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Property card ---------- */
function PropertyCard({ property, liked, onToggleLike, onOpen, onOpenAgent, feedMode = false }) {
  const { title, location, price, beds, baths, sqft, images, listingType, verified } = property;
  const agent = property.agent || { name: "RentBridge Agent", agency: "Independent agent", bio: "Contact this agent for more information about the listing." };
  const initials = agent.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <article
      className={`card ${feedMode ? "card--feed" : ""}`}
      tabIndex={0}
      role="button"
      aria-label={`View ${title}${verified ? ", verified listing" : ""}`}
      onClick={(event) => onOpen(property, event)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(property, e);
        }
      }}
    >
      <Slider images={images} alt={title} badge={LISTING_LABEL[listingType]} badgeType={listingType}>
        {feedMode && (
          <div className="feed-post-copy">
            <span className="feed-post-agent">{agent.agency || "Independent agent"}{verified && <span className="feed-post-verified"><ShieldCheck size={13} /> Verified listing</span>}</span>
            <h3>{title}</h3>
            <p className="feed-post-location">{location}</p>
            <p className="feed-post-price">{naira(price)} <span>{priceSuffix(listingType)}</span></p>
            <ul className="feed-post-meta">
              <li>{beds} bed</li><li>{baths} bath</li><li>{sqft.toLocaleString()} sqft</li>
            </ul>
            <button className="feed-post-details" onClick={(event) => { event.stopPropagation(); onOpen(property, event); }}>View property</button>
          </div>
        )}
        {feedMode && (
          <button
            className="feed-agent-profile-button"
            type="button"
            aria-label={`View ${agent.name}'s profile`}
            title={`View ${agent.name}'s profile`}
            onClick={(event) => { event.stopPropagation(); onOpenAgent({ ...agent, initials, verified }); }}
          >
            <span className="feed-agent-avatar">{agent.image ? <img src={agent.image} alt="" /> : initials}</span>
            <span className="feed-agent-open">↗</span>
          </button>
        )}
        <button
          className={`card__like ${liked ? "is-liked" : ""}`}
          aria-label={liked ? "Remove from saved" : "Save property"}
          aria-pressed={liked}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(property.id, e);
          }}
        >
          <Heart filled={liked} />
        </button>
        {verified && (
          <span className="verified-badge" title="Verified by RentBridge">
            <ShieldCheck /> Verified
          </span>
        )}
      </Slider>

      {!feedMode && <div className="card__body">
        <h3 className="card__title">{title}</h3>
        <p className="card__location">{location}</p>
        <p className="card__price">
          {naira(price)} <span>{priceSuffix(listingType)}</span>
        </p>
        <ul className="card__meta">
          <li><Bed /> {beds}</li>
          <li><Bath /> {baths}</li>
          <li><Area /> {sqft.toLocaleString()} sqft</li>
        </ul>
      </div>}
    </article>
  );
}

/* ---------- Listing details modal ---------- */
function ListingModal({ property, liked, onToggleLike, onClose }) {
  const navigate = useNavigate();
  const { title, location, price, beds, baths, sqft, description, amenities, images, listingType, verified } = property;
  const contactAgent = (event) => {
    if (!requireSignup(navigate, event)) return;
    const phone = property.agentPhone?.replace(/\D/g, "");
    if (!phone) {
      window.alert("The agent has not added a contact number for this property yet.");
      return;
    }

    const message = `Hello, I'm interested in ${title} in ${location}. Is it still available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose} aria-label="Close listing">
          <Close />
        </button>

        <Slider images={images} alt={title} large badge={LISTING_LABEL[listingType]} badgeType={listingType}>
          {verified && (
            <span className="verified-badge verified-badge--large" title="Verified by RentBridge">
              <ShieldCheck size={15} /> Verified listing
            </span>
          )}
        </Slider>

        <div className="modal__content">
          <div className="modal__head">
            <div>
              <h2>{title}</h2>
              <p className="card__location">{location}</p>
            </div>
            <p className="modal__price">
              {naira(price)} <span>{priceSuffix(listingType)}</span>
            </p>
          </div>

          {verified && (
            <p className="security-note">
              <ShieldCheck size={14} /> This listing has been verified by our team. Always view a
              property in person and avoid sending payment before an in-person or video viewing.
            </p>
          )}

          <ul className="card__meta card__meta--large">
            <li><Bed /> {beds} {beds === 1 ? "Bedroom" : "Bedrooms"}</li>
            <li><Bath /> {baths} {baths === 1 ? "Bathroom" : "Bathrooms"}</li>
            <li><Area /> {sqft.toLocaleString()} sqft</li>
          </ul>

          <h4>About this property</h4>
          <p className="modal__text">{description}</p>

          <h4>Amenities</h4>
          <ul className="chips">
            {amenities.map((a) => <li key={a}>{a}</li>)}
          </ul>

          {USE_PROPERTY_MAPS && <Suspense fallback={<div className="rb-property-map-skeleton" role="status" aria-label="Loading property location" />}><PropertyMap property={property} /></Suspense>}

          <div className="modal__actions">
            <button
              className="btn btn--primary"
              onClick={contactAgent}
            >
              Contact agent
            </button>
            <button className="btn btn--ghost" onClick={(event) => onToggleLike(property.id, event)}>
              <Heart filled={liked} /> {liked ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentProfileModal({ agent, listings, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal agent-profile-modal" onClick={onClose}>
      <section className="agent-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="feed-agent-name" onClick={(event) => event.stopPropagation()}>
        <button className="modal__close" type="button" aria-label="Close agent profile" onClick={onClose}><Close /></button>
        <div className="agent-profile-cover" />
        <div className="agent-profile-details">
          <span className="agent-profile-avatar">{agent.image ? <img src={agent.image} alt="" /> : agent.initials}</span>
          <h2 id="feed-agent-name">{agent.name}</h2>
          <p className="agent-profile-agency">{agent.agency || "Independent agent"}</p>
          {agent.verified && <span className="agent-profile-verified"><ShieldCheck size={15} /> Listing verified by RentBridge</span>}
          <p className="agent-profile-bio">{agent.bio || "Contact this agent to learn more about their listings."}</p>
          {agent.location && <p className="agent-profile-location">{agent.location}</p>}
          <div className="agent-profile-stats"><strong>{listings}</strong><span>{listings === 1 ? "property on RentBridge" : "properties on RentBridge"}</span></div>
        </div>
      </section>
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "rent", label: "For Rent" },
  { key: "sale", label: "For Sale" },
];

const EMPTY_SEARCH = { location: "", propertyType: "", minPrice: "", maxPrice: "" };

/**
 * searchFilters (optional): { location, propertyType, minPrice, maxPrice }
 * Pass this down from your hero search bar — see Home.jsx for the wiring.
 * Any field left as "" is ignored.
 */
export default function FeaturedProperties({ properties = PROPERTIES, searchFilters, likedIds, onToggleLike, savedOnly = false, feedMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [localLiked, setLocalLiked] = useState(() => new Set(getSavedPropertyIds()));
  const liked = likedIds ?? localLiked;
  const [filter, setFilter] = useState("all"); // rent / sale quick pills

  const toggleLike = useCallback((id, event) => {
    if (!requireSignup(navigate, event)) return;
    if (onToggleLike) {
      onToggleLike(id);
      return;
    }
    setLocalLiked(new Set(toggleSavedProperty(id)));
  }, [navigate, onToggleLike]);

  const openProperty = useCallback((property, event) => {
    if (requireSignup(navigate, event)) setSelected(property);
  }, [navigate]);

  const close = useCallback(() => {
    setSelected(null);
    if (location.pathname === "/properties" && searchParams.has("property")) {
      const next = new URLSearchParams(searchParams);
      next.delete("property");
      setSearchParams(next, { replace: true });
    }
  }, [location.pathname, searchParams, setSearchParams]);

  useEffect(() => {
    if (!USE_PROPERTY_MAPS || feedMode || location.pathname !== "/properties") return;
    const propertyId = searchParams.get("property");
    if (!propertyId) return;
    const requested = properties.find((property) => String(property.id) === propertyId)
      || PROPERTIES.find((property) => String(property.id) === propertyId);
    if (requested) setSelected(requested);
  }, [feedMode, location.pathname, searchParams, properties]);

  const s = { ...EMPTY_SEARCH, ...searchFilters };
  const hasActiveSearch = s.location || s.propertyType || s.minPrice || s.maxPrice;

  const visible = properties.filter((p) => {
    if (savedOnly && !liked.has(p.id)) return false;
    if (filter !== "all" && p.listingType !== filter) return false;

    if (s.location && !p.location.toLowerCase().includes(s.location.trim().toLowerCase())) {
      return false;
    }
    if (s.propertyType && p.category !== s.propertyType) return false;
    if (s.minPrice && p.price < Number(s.minPrice)) return false;
    if (s.maxPrice && p.price > Number(s.maxPrice)) return false;

    return true;
  });

  return (
    <section className={`featured ${feedMode ? "featured--feed" : ""}`} id="properties">
      <div className="featured__inner">
        <header className="featured__header">
          <div>
            <h2>{feedMode ? "" : "Featured Properties"}</h2>
            <p>
              {hasActiveSearch
                ? `${visible.length} ${visible.length === 1 ? "result" : "results"} found`
                : "Handpicked properties for you"}
            </p>
          </div>
          {!feedMode && <a href="#properties" className="featured__viewall">View all</a>}
        </header>

        {hasActiveSearch && (
          <div className="featured__searchsummary">
            <span>
              Showing results
              {s.location && <> in <strong>{s.location}</strong></>}
              {s.propertyType && <> · <strong>{s.propertyType}</strong></>}
              {(s.minPrice || s.maxPrice) && (
                <>
                  {" "}· <strong>
                    {s.minPrice ? naira(Number(s.minPrice)) : "₦0"} – {s.maxPrice ? naira(Number(s.maxPrice)) : "Any"}
                  </strong>
                </>
              )}
            </span>
          </div>
        )}

        <div className="featured__filters" role="tablist" aria-label="Filter properties by listing type">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              className={`filter-btn ${filter === f.key ? "is-active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="featured__empty">
            No properties match {hasActiveSearch ? "your search" : "this filter"} yet. Try
            widening your price range or clearing a filter.
          </p>
        ) : (
          <div className="featured__grid">
            {visible.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                liked={liked.has(p.id)}
                onToggleLike={toggleLike}
                onOpen={openProperty}
                onOpenAgent={setSelectedAgent}
                feedMode={feedMode}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ListingModal
          property={selected}
          liked={liked.has(selected.id)}
          onToggleLike={toggleLike}
          onClose={close}
        />
      )}
      {selectedAgent && <AgentProfileModal agent={selectedAgent} listings={properties.filter((property) => property.agent?.id === selectedAgent.id).length} onClose={() => setSelectedAgent(null)} />}
    </section>
  );
}
