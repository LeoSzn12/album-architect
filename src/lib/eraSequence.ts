import type { EraFilter, DraftSlot, SlotId } from '../types/draft.ts';
import { SONG_LIBRARY, filterByEra } from '../data/songs.ts';

function createPrng(seedStr: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function () {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    const t = (h += h << 5) >>> 0;
    return t / 4294967296;
  };
}

/**
 * Counts eligible songs in the catalog for a given slot and era filter.
 */
export function getEligibleCount(slotId: SlotId, era: EraFilter): number {
  const pool = filterByEra(SONG_LIBRARY, era);
  return pool.filter((song) => {
    const affinity = song.slotAffinity?.[slotId] ?? 0;
    return affinity >= 60 || song.slots.includes(slotId);
  }).length;
}

/**
 * Deterministically substitutes a sparse era (< 8 eligible songs) with a better-covered era.
 * Returns 'all' or another era with >= 8 candidates.
 */
export function resolveSufficientEra(slotId: SlotId, requestedEra: EraFilter): EraFilter {
  if (requestedEra === 'all') return 'all';

  const count = getEligibleCount(slotId, requestedEra);
  if (count >= 8) return requestedEra;

  // Substitute 'all' which aggregates catalog coverage
  return 'all';
}

/**
 * Returns the era assignment for each slot in order.
 * When a seed is provided the result is 100% deterministic and identical for
 * both players using the same seed. Enforces minimum 8-song catalog coverage
 * via deterministic substitution.
 */
export function generateEraSequence(
  slots: DraftSlot[],
  seed: string | null
): EraFilter[] {
  const possibleEras: EraFilter[] = ['2000s', '2010s', '2020s', 'all'];

  if (!seed) {
    // Solo mode: sample uniformly across eras and substitute sparse pools
    return slots.map((s) => {
      const idx = Math.floor(Math.random() * possibleEras.length);
      return resolveSufficientEra(s.id, possibleEras[idx]);
    });
  }

  // Challenge seed mode: deterministic mapping with substitution guarantee
  const prng = createPrng(seed);
  return slots.map((s) => {
    const idx = Math.floor(prng() * possibleEras.length);
    return resolveSufficientEra(s.id, possibleEras[idx]);
  });
}

/**
 * Returns a human-readable label for a round's era badge.
 */
export function eraLabel(era: EraFilter): string {
  switch (era) {
    case '2020s': return '2020s';
    case '2010s': return '2010s';
    case '2000s': return '2000s';
    default:      return 'Any Era';
  }
}
