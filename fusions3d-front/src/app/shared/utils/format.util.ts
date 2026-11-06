const priceFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** Formatea un importe en euros. Ejemplo: 12.5 → "12,50 €" */
export function formatPrecio(valor: number): string {
  return priceFormatter.format(valor);
}

/** Muestra un precio o un rango. Ejemplo: 12.5 y 15.9 → "12,50 € – 15,90 €" */
export function formatRangoPrecio(min: number, max: number): string {
  return min === max ? formatPrecio(min) : `${formatPrecio(min)} – ${formatPrecio(max)}`;
}

/**
 * Formatea el tiempo de impresión (en minutos) a un texto legible.
 * Ejemplos: 45 → "45 min", 180 → "3 h", 200 → "3 h 20 min"
 */
export function formatTiempoImpresion(minutos: number): string {
  if (minutos <= 0) return '0 min';
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}
