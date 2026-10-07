/**
 * Genera una imagen placeholder SVG (data URI) determinística a partir
 * de una semilla (normalmente el slug de la impresión). La API actual
 * no persiste imágenes, así que las cards usan este placeholder cuando
 * la impresión no tiene `imagen`.
 */
const PALETTES: readonly [string, string][] = [
  ['#ff6000', '#431407'],
  ['#0ea5e9', '#082f49'],
  ['#8b5cf6', '#2e1065'],
  ['#10b981', '#022c22'],
  ['#f43f5e', '#4c0519'],
  ['#eab308', '#422006'],
];

export function placeholderImage(seed: string, label?: string): string {
  const text = seed || 'fusions3d';
  let hash = 7;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  const [from, to] = PALETTES[hash % PALETTES.length];

  const initials = (label ?? text)
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='400' viewBox='0 0 640 400'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/>` +
    `</linearGradient></defs>` +
    `<rect width='640' height='400' fill='url(#g)'/>` +
    `<g fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='2'>` +
    `<circle cx='530' cy='80' r='110'/><circle cx='90' cy='330' r='70'/>` +
    `</g>` +
    `<text x='50%' y='52%' text-anchor='middle' dominant-baseline='middle' ` +
    `font-family='Arial, sans-serif' font-size='120' font-weight='700' fill='rgba(255,255,255,0.9)'>${initials}</text>` +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
