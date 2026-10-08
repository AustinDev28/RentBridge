import { useState, useEffect, useRef, useCallback } from "react";
import "./FeaturedProperties.css";

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

export const PROPERTIES = [
  {
    id: 1,
    listingType: "rent", // "rent" or "sale"
    title: "Modern 2 Bedroom Apartment",
    location: "Lekki Phase 1, Lagos",
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
    listingType: "sale",
    title: "Luxury 3 Bedroom Duplex",
    location: "Ikoyi, Lagos",
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
    listingType: "rent",
    title: "Spacious 1 Bedroom Apartment",
    location: "Victoria Island, Lagos",
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
    listingType: "sale",
    title: "4 Bedroom Terrace Duplex",
    location: "Chevron, Lekki, Lagos",
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
    listingType: "rent",
    title: "Cozy Studio Apartment",
    location: "Yaba, Lagos",
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
    listingType: "sale",
    title: "5 Bedroom Detached Duplex",
    location: "Banana Island, Lagos",
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
      </div>

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
function PropertyCard({ property, liked, onToggleLike, onOpen }) {
  const { title, location, price, beds, baths, sqft, images, listingType } = property;

  return (
    <article
      className="card"
      tabIndex={0}
      role="button"
      aria-label={`View ${title}`}
      onClick={() => onOpen(property)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(property);
        }
      }}
    >
      <Slider images={images} alt={title} badge={LISTING_LABEL[listingType]} badgeType={listingType}>
        <button
          className={`card__like ${liked ? "is-liked" : ""}`}
          aria-label={liked ? "Remove from saved" : "Save property"}
          aria-pressed={liked}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(property.id);
          }}
        >
          <Heart filled={liked} />
        </button>
      </Slider>

      <div className="card__body">
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
      </div>
    </article>
  );
}

/* ---------- Listing details modal ---------- */
function ListingModal({ property, liked, onToggleLike, onClose }) {
  const { title, location, price, beds, baths, sqft, description, amenities, images, listingType } = property;

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

        <Slider images={images} alt={title} large badge={LISTING_LABEL[listingType]} badgeType={listingType} />

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

          <div className="modal__actions">
            <button
              className="btn btn--primary"
              onClick={() =>
                alert(
                  listingType === "rent"
                    ? "Hook this up to your 'request to rent' flow"
                    : "Hook this up to your 'make an offer / buy' flow"
                )
              }
            >
              {listingType === "rent" ? "Rent this property" : "Buy this property"}
            </button>
            <button className="btn btn--ghost" onClick={() => onToggleLike(property.id)}>
              <Heart filled={liked} /> {liked ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "rent", label: "For Rent" },
  { key: "sale", label: "For Sale" },
];

/* ---------- Section ---------- */
export default function FeaturedProperties({ properties = PROPERTIES }) {
  const [selected, setSelected] = useState(null);
  const [liked, setLiked] = useState(() => new Set());
  const [filter, setFilter] = useState("all");

  const toggleLike = useCallback((id) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const close = useCallback(() => setSelected(null), []);

  const visible =
    filter === "all" ? properties : properties.filter((p) => p.listingType === filter);

  return (
    <section className="featured" id="properties">
      <div className="featured__inner">
        <header className="featured__header">
          <div>
            <h2>Featured Properties</h2>
            <p>Handpicked properties for you</p>
          </div>
          <a href="#properties" className="featured__viewall">View all</a>
        </header>

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
          <p className="featured__empty">No properties match this filter yet.</p>
        ) : (
          <div className="featured__grid">
            {visible.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                liked={liked.has(p.id)}
                onToggleLike={toggleLike}
                onOpen={setSelected}
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
    </section>
  );
}