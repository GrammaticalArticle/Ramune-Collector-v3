export function getTintedColor(color: string, opacityHex = "1A") {
  if (!color) return "#cccccc" + opacityHex;
  const hex = color.startsWith("#") ? color : `#${color}`;
  return `${hex}${opacityHex}`;
}

export function getFullColor(color: string) {
  if (!color) return "#cccccc";
  return color.startsWith("#") ? color : `#${color}`;
}
