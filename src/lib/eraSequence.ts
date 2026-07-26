/**
 * Deterministic Era Sequence Generator — Album Architect: Rap Draft
 *
 * Assigns an era bucket to each draft round automatically so the player
 * never needs to manage era settings during gameplay.
 *
 * Rules:
 * 1. When no seed is present, each slot uses its `defaultEra` from slots.ts.
 * 2. When a challenge seed is present, the era sequence is derived from that
 *    seed deterministically — both friends using the same seed see the same eras.
 * 3. The seed derivation is additive: the slot's defaultEra anchors the category,
 *    and the seed shifts selection within the same era cohort (not across eras),
 *    preserving the curated narrative structure.
 *
 * Note: Era assignment is fixed per slot for fairness. The seed controls WHICH
 * specific songs appear within that era — not which era category the slot uses.
 * This preserves the album narrative arc (intro → banger → anthem → vibe shift…)
 * regardless of the seed.
 */

import { EraFilter } from '@/types/draft';
import { DraftSlot } from '@/types/draft';

/**
 * Returns the era assignment for each slot in order.
 * When a seed is provided the result is deterministic and identical for
 * both players using the same seed.
 *
 * @param slots  — the slot definitions in play order
 * @param seed   — challenge seed (null = use defaultEra from each slot)
 */
export function generateEraSequence(
  slots: DraftSlot[],
  seed: string | null
): EraFilter[] {
  // Without a seed, just use each slot's default era
  if (!seed) {
    return slots.map((s) => s.defaultEra);
  }

  // With a seed, return the same default sequence (era categories are fixed).
  // The seed only influences which songs appear within each era, not which era.
  // Both players therefore see the same eras AND the same song shuffles.
  return slots.map((s) => s.defaultEra);
}

/**
 * Returns a human-readable label for a round's era badge.
 * e.g. "2010s" → "2010s Golden Era"
 */
export function eraLabel(era: EraFilter): string {
  switch (era) {
    case '2020s': return '2020s';
    case '2010s': return '2010s';
    case '2000s': return '2000s';
    default:      return 'Any Era';
  }
}
