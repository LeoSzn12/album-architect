import type { Song, BudgetReport, DraftedTrack } from '../types/draft.ts';

export const INITIAL_BUDGET = 15;

/**
 * Computes deterministic budget price ($1 to $5) for any song based on impact and cultural recognition.
 */
export function getSongBudgetPrice(song: Song): number {
  if (typeof song.budgetCost === 'number' && song.budgetCost >= 1 && song.budgetCost <= 5) {
    return song.budgetCost;
  }

  const power = Math.max(song.impact, song.recognition);

  if (power >= 92) return 5; // Megastars / Cultural Giants
  if (power >= 84) return 4; // Mainstream Heavy Hitters
  if (power >= 74) return 3; // Fan Favorites / Modern Classics
  if (power >= 62) return 2; // High-Utility Quality Cuts
  return 1;                  // Sleeper Gems / Steals
}

/**
 * Calculates remaining budget based on already drafted tracks.
 */
export function calculateRemainingBudget(
  draftedTracks: { song: Song }[],
  initialBudget: number = INITIAL_BUDGET
): number {
  const spent = draftedTracks.reduce((sum, t) => sum + getSongBudgetPrice(t.song), 0);
  return Math.max(0, initialBudget - spent);
}

/**
 * Checks if a candidate song can be drafted given the remaining budget.
 */
export function canAffordSong(song: Song, budgetRemaining: number): boolean {
  return getSongBudgetPrice(song) <= budgetRemaining;
}

/**
 * Generates an end-of-draft budget report with efficiency score and executive rating.
 */
export function computeBudgetReport(
  draftedTracks: DraftedTrack[],
  rawScore: number,
  initialBudget: number = INITIAL_BUDGET
): BudgetReport {
  const perTrackCost = draftedTracks.map((t) => ({
    title: t.song.title,
    cost: getSongBudgetPrice(t.song),
  }));

  const totalSpent = perTrackCost.reduce((sum, item) => sum + item.cost, 0);
  const remainingBudget = Math.max(0, initialBudget - totalSpent);

  let efficiencyScore = Math.round((rawScore / 10) * 80 + (totalSpent / initialBudget) * 20);
  efficiencyScore = Math.min(100, Math.max(20, efficiencyScore));

  let rating = 'Sound Executive';
  if (totalSpent === initialBudget && rawScore >= 8.5) {
    rating = 'Master Capital Allocator (100% Deployed)';
  } else if (remainingBudget >= 3 && rawScore >= 8.0) {
    rating = 'Thrifty Hitmaker (Massive ROI)';
  } else if (remainingBudget >= 4) {
    rating = 'Left Capital on the Table';
  } else if (rawScore >= 9.0) {
    rating = 'Elite A&R Strategist';
  }

  return {
    initialBudget,
    totalSpent,
    remainingBudget,
    efficiencyScore,
    rating,
    executiveRating: rating,
    perTrackCost,
  };
}
