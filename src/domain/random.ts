/**
 * Generador pseudoaleatorio determinista (mulberry32).
 * La misma semilla y configuración producen exactamente el mismo escenario.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(
  next: () => number,
  min: number,
  max: number,
): number {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  if (hi <= lo) return lo;
  return lo + Math.floor(next() * (hi - lo + 1));
}

export function randomBetween(
  next: () => number,
  min: number,
  max: number,
): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + next() * (hi - lo);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function newSeed(): number {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  }
  return Math.floor(Math.random() * 1_000_000);
}
