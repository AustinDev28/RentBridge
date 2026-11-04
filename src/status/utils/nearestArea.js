export function nearestAreaName(latitude, longitude, areas) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !areas.length) return "";
  const distance = (area) => (area.latitude - latitude) ** 2 + (area.longitude - longitude) ** 2;
  return [...areas].sort((first, second) => distance(first) - distance(second))[0]?.name || "";
}
