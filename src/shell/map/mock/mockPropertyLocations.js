// MOCK ONLY - replace with real backend before production
// Private mock source points and fixed offsets are service-only. Never send exact coordinates to the UI unless showExactLocation is true.
export const MOCK_PROPERTY_POINTS = {
  1: { exactLat: 6.4480, exactLng: 3.4705, offsetLat: 0.0005, offsetLng: 0.0005 },
  2: { exactLat: 6.4397, exactLng: 3.4272, offsetLat: 0.0004, offsetLng: 0.0007 },
  3: { exactLat: 6.4290, exactLng: 3.4194, offsetLat: 0.0004, offsetLng: 0.0003 },
  4: { exactLat: 6.4466, exactLng: 3.4855, offsetLat: -0.0005, offsetLng: 0.0008 },
  5: { exactLat: 6.5102, exactLng: 3.3704, offsetLat: 0.0004, offsetLng: -0.0006 },
  6: { exactLat: 6.4463, exactLng: 3.4208, offsetLat: 0.0007, offsetLng: 0.0007 },
};

export function createMockMapListings(areas, photos = [], count = 300) {
  const kinds = ["flat", "apartment", "terrace", "duplex", "bungalow"];
  if (!areas?.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const areaIndex = Math.floor(index / Math.ceil(count / areas.length)) % areas.length;
    const area = areas[areaIndex];
    const localIndex = index - areaIndex * Math.ceil(count / areas.length);
    const estateIndex = Math.floor(localIndex / 3) % 17;
    const beds = (index % 5) + 1;
    const listingType = index % 2 === 0 ? "rent" : "sale";
    const latitudeOffset = ((estateIndex % 5) - 2) * 0.003;
    const longitudeOffset = (Math.floor(estateIndex / 5) - 1) * 0.004;
    const photo = photos.length ? photos[index % photos.length] : null;
    const images = Array.isArray(photo) ? photo : photo ? [photo] : [];
    return {
      id: `map-mock-${String(index + 1).padStart(3, "0")}`,
      title: `${beds} bedroom ${kinds[index % kinds.length]} in ${area.name}`,
      location: area.name,
      areaName: area.name,
      listingType,
      price: listingType === "rent"
        ? 850_000 + areaIndex * 175_000 + (index % 7) * 50_000
        : 48_000_000 + areaIndex * 9_000_000 + (index % 7) * 2_000_000,
      beds,
      images,
      showExactLocation: false,
      approxLat: area.latitude + latitudeOffset,
      approxLng: area.longitude + longitudeOffset,
      estateName: `${area.name} estate ${estateIndex + 1}`,
    };
  });
}
