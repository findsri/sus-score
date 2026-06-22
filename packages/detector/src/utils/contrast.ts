// eslint-disable-next-line @typescript-eslint/no-require-imports
const wcagContrast = require('wcag-contrast') as { hex: (a: string, b: string) => number };

/**
 * Parse any CSS color string into [r, g, b] 0-255.
 * Returns null if unparseable.
 */
export function parseCssColor(color: string): [number, number, number] | null {
  if (!color || color === 'transparent' || color === 'inherit' || color === 'initial') {
    return null;
  }

  // rgb(a) format
  const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  }

  // hex format
  const hex = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex) {
    return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
  }

  // short hex
  const shortHex = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHex) {
    return [
      parseInt(shortHex[1] + shortHex[1], 16),
      parseInt(shortHex[2] + shortHex[2], 16),
      parseInt(shortHex[3] + shortHex[3], 16),
    ];
  }

  // named colors (common subset)
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
    silver: [192, 192, 192],
    transparent: [255, 255, 255],
  };
  return named[color.toLowerCase()] ?? null;
}

export function getContrastRatio(fg: string, bg: string): number | null {
  const fgRgb = parseCssColor(fg);
  const bgRgb = parseCssColor(bg);
  if (!fgRgb || !bgRgb) return null;

  try {
    return wcagContrast.hex(rgbToHex(...fgRgb), rgbToHex(...bgRgb));
  } catch {
    return null;
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
