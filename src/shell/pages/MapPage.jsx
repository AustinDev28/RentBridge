import { Suspense, lazy } from "react";
import { USE_PROPERTY_MAPS } from "../map/config.js";
import LegacyMapPage from "../map/LegacyMapPage.jsx";

const PropertyMapPage = lazy(() => import("../map/PropertyMapPage.jsx"));

function MapLoading() {
  return <main className="shell-map-page"><div className="shell-map-skeleton" aria-label="Loading map" role="status"><span /><i /><i /><b /></div></main>;
}

export default function MapPage() {
  if (!USE_PROPERTY_MAPS) return <LegacyMapPage />;
  return <Suspense fallback={<MapLoading />}><PropertyMapPage /></Suspense>;
}
