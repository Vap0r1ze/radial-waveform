export function rgbToHex(rgb) {
  return [...rgb]
    .slice(0, 3)
    .map(c => c.toString(16).padStart(2, 0))
    .join('')
}
