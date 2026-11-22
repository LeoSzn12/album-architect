import type { DraftedTrack, EvaluationResult } from '../../types/draft.ts';
import { createSeededRandom } from '../seededRandom.ts';
import { evaluateRuleCards, type RuleCardId } from './ruleCards.ts';
import type { WeeklyTrend } from './weeklyTrend.ts';
import { milestoneFor, type LadderMilestone } from './ladder.ts';

export interface ReleaseReason {
  label: string;
  units: number;
}

export interface ReleaseResult {
  /** Middle of the projected range. */
  projected: number;
  low: number;
  high: number;
  /** Final first week. Solo play uses a simulated crowd inside the range. */
  finalUnits: number;
  /** Units per day, Friday to Thursday. Sums to finalUnits. */
  dailyUnits: number[];
  reasons: ReleaseReason[];
  ruleResults: ReturnType<typeof evaluateRuleCards>;
  trendNote: string;
  milestone: LadderMilestone;
  nextMilestone: LadderMilestone | null;
}

export interface ReleaseInput {
  tracks: DraftedTrack[];
  evaluation: Pick<EvaluationResult, 'overallScore' | 'rawScore'>;
  ruleCards: RuleCardId[];
  mysteryRoundIndex: number | null;
  trend: WeeklyTrend;
  seedKey: string;
}

export const DAY_LABELS = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'];
const DAY_SHARES = [0.36, 0.17, 0.13, 0.1, 0.09, 0.08, 0.07];
const RANGE = 0.1;
const FLOOR = 15_000;

const round1k = (value: number) => Math.round(value / 1000) * 1000;

/** Units earned from album quality on the 0 to 10 grade. Grows faster near the top. */
export function qualityUnits(score: number): number {
  const clamped = Math.max(0, Math.min(10, score));
  return 50_000 + Math.pow(clamped / 10, 2.2) * 420_000;
}

function leadSingle(tracks: DraftedTrack[]): DraftedTrack | undefined {
  return tracks.find((track) => track.slot.id === 'statement-banger') ?? tracks[1] ?? tracks[0];
}

export function simulateRelease(input: ReleaseInput): ReleaseResult {
  const { tracks, evaluation, ruleCards, mysteryRoundIndex, trend, seedKey } = input;
  const reasons: ReleaseReason[] = [];

  const rawQuality = qualityUnits(evaluation.rawScore ?? evaluation.overallScore);
  const quality = qualityUnits(evaluation.overallScore);
  reasons.push({ label: `Album quality (scored ${evaluation.overallScore.toFixed(1)} of 10)`, units: rawQuality });
  if (rawQuality - quality > 500) {
    reasons.push({ label: 'Same artist more than once', units: -(rawQuality - quality) });
  }

  const avgRecognition = tracks.length ? tracks.reduce((sum, track) => sum + track.song.recognition, 0) / tracks.length : 0;
  const starPower = (avgRecognition - 85) * 4_000;
  if (Math.abs(starPower) >= 1_000) {
    reasons.push({ label: starPower > 0 ? 'Big, familiar songs' : 'Lesser-known songs', units: starPower });
  }

  const lead = leadSingle(tracks);
  if (lead) {
    const leadPower = (lead.song.recognition * 0.6 + lead.song.impact * 0.4 - 85) * 5_000;
    if (Math.abs(leadPower) >= 1_000) {
      reasons.push({ label: leadPower > 0 ? `Lead single: ${lead.song.title}` : `Soft lead single: ${lead.song.title}`, units: leadPower });
    }
  }

  const base = Math.max(FLOOR, quality + starPower + (lead ? (lead.song.recognition * 0.6 + lead.song.impact * 0.4 - 85) * 5_000 : 0));

  const ruleResults = evaluateRuleCards(ruleCards, tracks, mysteryRoundIndex);
  for (const { card, outcome } of ruleResults) {
    if (outcome.unitShare !== 0) reasons.push({ label: `${card.name}: ${outcome.note}`, units: base * outcome.unitShare });
  }

  const trendEffect = trend.effect(tracks);
  if (trendEffect.unitShare > 0) {
    reasons.push({ label: `${trend.name}: ${trendEffect.note}`, units: base * trendEffect.unitShare });
  }

  const total = reasons.reduce((sum, reason) => sum + reason.units, 0);
  const projected = round1k(Math.max(FLOOR, total));
  const low = round1k(projected * (1 - RANGE));
  const high = round1k(projected * (1 + RANGE));

  const random = createSeededRandom(`${seedKey}::${tracks.map((track) => track.song.id).join('|')}`);
  const finalUnits = round1k(Math.min(high, Math.max(low, projected * (0.93 + random() * 0.14))));

  const weights = DAY_SHARES.map((dayShare) => dayShare * (0.9 + random() * 0.2));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const dailyUnits = weights.map((weight) => Math.round((weight / weightTotal) * finalUnits));
  dailyUnits[0] += finalUnits - dailyUnits.reduce((sum, units) => sum + units, 0);

  const { current, next } = milestoneFor(finalUnits);

  return {
    projected,
    low,
    high,
    finalUnits,
    dailyUnits,
    reasons: reasons
      .map((reason) => ({ ...reason, units: round1k(reason.units) }))
      .filter((reason) => reason.units !== 0),
    ruleResults,
    trendNote: trendEffect.unitShare > 0 ? trendEffect.note : `${trend.name}: nothing on this album rode the trend.`,
    milestone: current,
    nextMilestone: next,
  };
}
