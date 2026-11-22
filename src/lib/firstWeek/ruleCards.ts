import type { DraftedTrack } from '../../types/draft.ts';
import { getSongBudgetPrice } from '../budgetEngine.ts';
import { createSeededRandom } from '../seededRandom.ts';

export type RuleCardId =
  | 'snippet-round'
  | 'no-repeats'
  | 'throwback'
  | 'collab-required'
  | 'sleeper-pick'
  | 'crossover'
  | 'mood-late-night'
  | 'mood-gym'
  | 'budget-cap';

export interface RuleOutcome {
  met: boolean;
  /** Share of base first-week units added (positive) or removed (negative). */
  unitShare: number;
  note: string;
}

export interface RuleCard {
  id: RuleCardId;
  name: string;
  description: string;
  evaluate: (tracks: DraftedTrack[], context: { mysteryRoundIndex: number | null }) => RuleOutcome;
}

const THROWBACK_YEAR = 2005;
const BUDGET_CAP = 24;

const primaryAndFeatured = (track: DraftedTrack) =>
  [track.song.artist, ...(track.song.featuredArtists ?? [])].map((name) => name.trim().toLowerCase());

const averageEnergy = (tracks: DraftedTrack[]) =>
  tracks.length ? tracks.reduce((sum, track) => sum + track.song.energy, 0) / tracks.length : 0;

export const RULE_CARDS: Record<RuleCardId, RuleCard> = {
  'snippet-round': {
    id: 'snippet-round',
    name: 'Snippet Round',
    description: 'One round hides titles and covers. Pick from the audio alone.',
    evaluate: (tracks, { mysteryRoundIndex }) => {
      const pick = mysteryRoundIndex === null ? undefined : tracks[mysteryRoundIndex];
      if (!pick) return { met: false, unitShare: 0, note: 'No blind pick this time.' };
      const fit = pick.song.slotAffinity[pick.slot.id] ?? 50;
      return fit >= 80
        ? { met: true, unitShare: 0.06, note: `Your blind pick, ${pick.song.title}, fit its spot.` }
        : { met: true, unitShare: 0.01, note: `Your blind pick, ${pick.song.title}, was a stretch for its spot.` };
    },
  },
  'no-repeats': {
    id: 'no-repeats',
    name: 'No Repeats',
    description: 'No artist twice, not even as a feature.',
    evaluate: (tracks) => {
      const names = tracks.flatMap(primaryAndFeatured);
      const met = new Set(names).size === names.length;
      return met
        ? { met, unitShare: 0.05, note: 'Every artist appears once.' }
        : { met, unitShare: -0.04, note: 'An artist shows up twice.' };
    },
  },
  throwback: {
    id: 'throwback',
    name: 'Throwback Slot',
    description: `At least one song released before ${THROWBACK_YEAR}.`,
    evaluate: (tracks) => {
      const pick = tracks.find((track) => (track.song.year ?? 9999) < THROWBACK_YEAR);
      return pick
        ? { met: true, unitShare: 0.05, note: `${pick.song.title} brought the throwback crowd.` }
        : { met: false, unitShare: -0.03, note: `No song from before ${THROWBACK_YEAR}.` };
    },
  },
  'collab-required': {
    id: 'collab-required',
    name: 'Collab Required',
    description: 'At least two songs with a featured artist.',
    evaluate: (tracks) => {
      const count = tracks.filter((track) => (track.song.featuredArtists ?? []).length > 0).length;
      return count >= 2
        ? { met: true, unitShare: 0.05, note: `${count} songs have features.` }
        : { met: false, unitShare: -0.03, note: `Only ${count} song${count === 1 ? '' : 's'} with a feature.` };
    },
  },
  'sleeper-pick': {
    id: 'sleeper-pick',
    name: 'Sleeper Pick',
    description: 'Include a deep cut. If it fits its spot, it pays double.',
    evaluate: (tracks) => {
      const sleepers = tracks.filter((track) => track.song.recognition < 82);
      const hit = sleepers.find((track) => (track.song.slotAffinity[track.slot.id] ?? 50) >= 75);
      if (hit) return { met: true, unitShare: 0.1, note: `Your sleeper pick, ${hit.song.title}, hit.` };
      if (sleepers.length) return { met: true, unitShare: 0.03, note: `You took a deep cut, ${sleepers[0].song.title}, but it didn't quite land.` };
      return { met: false, unitShare: -0.03, note: 'No deep cut on the album.' };
    },
  },
  crossover: {
    id: 'crossover',
    name: 'Crossover',
    description: 'At least one song from a different genre than the rest.',
    evaluate: (tracks) => {
      const counts = new Map<string, number>();
      for (const track of tracks) counts.set(track.song.genre, (counts.get(track.song.genre) ?? 0) + 1);
      const main = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const odd = tracks.find((track) => track.song.genre !== main);
      return odd
        ? { met: true, unitShare: 0.04, note: `${odd.song.title} pulled in a new audience.` }
        : { met: false, unitShare: -0.02, note: 'Every song is the same genre.' };
    },
  },
  'mood-late-night': {
    id: 'mood-late-night',
    name: 'Mood: Late Night',
    description: 'Keep the average energy at 70% or lower.',
    evaluate: (tracks) => {
      const avg = Math.round(averageEnergy(tracks));
      return avg <= 70
        ? { met: true, unitShare: 0.06, note: `Average energy ${avg}%: a proper late-night record.` }
        : { met: false, unitShare: -0.03, note: `Average energy ${avg}% is too loud for late night.` };
    },
  },
  'mood-gym': {
    id: 'mood-gym',
    name: 'Mood: Gym',
    description: 'Keep the average energy at 82% or higher.',
    evaluate: (tracks) => {
      const avg = Math.round(averageEnergy(tracks));
      return avg >= 82
        ? { met: true, unitShare: 0.06, note: `Average energy ${avg}%: built for the gym.` }
        : { met: false, unitShare: -0.03, note: `Average energy ${avg}% is too soft for the gym.` };
    },
  },
  'budget-cap': {
    id: 'budget-cap',
    name: 'Budget Cap',
    description: `Big hits cost more. Keep the album at $${BUDGET_CAP} or less.`,
    evaluate: (tracks) => {
      const cost = tracks.reduce((sum, track) => sum + getSongBudgetPrice(track.song), 0);
      return cost <= BUDGET_CAP
        ? { met: true, unitShare: 0.06, note: `Album cost $${cost}, under the cap.` }
        : { met: false, unitShare: -0.05, note: `Album cost $${cost}, over the $${BUDGET_CAP} cap.` };
    },
  },
};

export const RULE_CARD_IDS = Object.keys(RULE_CARDS) as RuleCardId[];

export function isRuleCardId(value: unknown): value is RuleCardId {
  return typeof value === 'string' && (RULE_CARD_IDS as string[]).includes(value);
}

/** Deals one or two rule cards that never contradict each other. */
export function dealRuleCards(seedKey: string): RuleCardId[] {
  const random = createSeededRandom(`${seedKey}::rules`);
  const pool = [...RULE_CARD_IDS];
  const first = pool.splice(Math.floor(random() * pool.length), 1)[0] ?? 'no-repeats';
  if (random() < 0.35) return [first];
  const compatible = pool.filter((id) => !(id.startsWith('mood-') && first.startsWith('mood-')));
  const second = compatible[Math.floor(random() * compatible.length)];
  return second ? [first, second] : [first];
}

/** The round shown without titles when Snippet Round is dealt. Never the first round. */
export function pickMysteryRound(seedKey: string, ruleCards: RuleCardId[], slotCount: number): number | null {
  if (!ruleCards.includes('snippet-round') || slotCount < 2) return null;
  const random = createSeededRandom(`${seedKey}::mystery`);
  return 1 + Math.floor(random() * (slotCount - 1));
}

export function evaluateRuleCards(ruleCards: RuleCardId[], tracks: DraftedTrack[], mysteryRoundIndex: number | null) {
  return ruleCards
    .filter(isRuleCardId)
    .map((id) => ({ card: RULE_CARDS[id], outcome: RULE_CARDS[id].evaluate(tracks, { mysteryRoundIndex }) }));
}
