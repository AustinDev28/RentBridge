import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useTheme } from "../../theme/useTheme.js";
import { getPropertyLocation } from "../mapService.js";
import "./map.css";

const PropertyMapCanvas = lazy(() => import("./PropertyMapCanvas.jsx"));

function PropertyMapSkeleton() {
  return <div className="rb-property-map-skeleton" role="status" aria-label="Loading property map"><span /><span /><i /></div>;
}

export default function PropertyMap({ property }) {
  const [nearViewport, setNearViewport] = useState(false);
  const [mapProperty, setMapProperty] = useState(null);
  const { resolvedTheme } = useTheme();
  const sectionRef = useRef(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") { setNearViewport(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "300px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [property.id]);

  useEffect(() => {
    if (!nearViewport) return undefined;
    let active = true;
    setMapProperty(null);
    getPropertyLocation(property.id).then((location) => { if (active) setMapProperty(location); }).catch(() => { if (active) setMapProperty(null); });
    return () => { active = false; };
  }, [nearViewport, property.id]);

  return <section ref={sectionRef} className="rb-property-map-section" data-property-map={String(property.id)} aria-labelledby={`rb-property-location-${property.id}`}>
    <h3 id={`rb-property-location-${property.id}`}>Location</h3>
    {nearViewport && mapProperty ? <Suspense fallback={<PropertyMapSkeleton />}><PropertyMapCanvas property={mapProperty} theme={resolvedTheme} /></Suspense> : <PropertyMapSkeleton />}
    <p className="rb-property-map-area"><MapPin size={15} aria-hidden="true" />{property.areaName || property.location}</p>
  </section>;
}
