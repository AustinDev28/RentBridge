import { Link, useNavigate } from "react-router-dom";
import { BedDouble, MapPin, X } from "lucide-react";
import { requireSignup } from "../../user/requireSignup.js";

const naira = (price) => `₦${Number(price || 0).toLocaleString("en-NG")}`;

export default function PropertyPreviewCard({ property, onClose }) {
  const navigate = useNavigate();
  if (!property) return null;
  return <article className="rb-map-preview" aria-label={`${property.title} preview`}>
    <button className="rb-map-preview-close" type="button" aria-label="Close property preview" onClick={onClose}><X size={18} /></button>
    <img src={property.images?.[0]} alt={property.title} />
    <div className="rb-map-preview-body">
      <span className={`rb-map-preview-tag is-${property.listingType === "rent" ? "rent" : "buy"}`}>{property.listingType === "rent" ? "Rent" : "Buy"}</span>
      <strong className="rb-map-preview-price">{naira(property.price)}{property.listingType === "rent" ? " / year" : ""}</strong>
      <p><MapPin size={15} aria-hidden="true" />{property.location}</p>
      <small><BedDouble size={15} aria-hidden="true" />{property.beds} {property.beds === 1 ? "bedroom" : "bedrooms"}</small>
      <div className="rb-map-preview-actions">
        <Link to={`/properties?property=${encodeURIComponent(property.id)}`} className="shell-primary-button" onClick={(event) => { if (!requireSignup(navigate, event)) event.preventDefault(); }}>View property</Link>
        <button type="button" className="shell-secondary-button" onClick={onClose}>Close</button>
      </div>
    </div>
  </article>;
}
