/**
 * Simple deterministic Pseudo-Random Number Generator (PRNG) using Mulberry32.
 * Converts a text seed into a numeric hash and returns pseudo-random floats in [0, 1).
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string) {
  let state = hashString(seed) || 123456789;

  return function random(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffles an array using a seeded PRNG.
 */
export function seededShuffle<T>(array: T[], seed: string): T[] {
  const rng = createSeededRandom(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates a random 6-character uppercase challenge seed code (e.g., ARCH-7K9P).
 */
export function generateChallengeSeed(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ARCH-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
