export const MAP_CONFIG = {
  center: [3.42, 6.53],
  initialZoom: 9,
  propertyZoom: 11,
  singlePinZoom: 14,
  propertyPriceLabelZoom: 16,
  clusterRadius: 48,
  propertyLimit: 200,
  circleRadiusMeters: 500,
  minZoom: 7,
  maxZoom: 18,
};

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export function getMapStyle(theme = "light") {
  return MAP_STYLES[theme === "dark" ? "dark" : "light"];
}
