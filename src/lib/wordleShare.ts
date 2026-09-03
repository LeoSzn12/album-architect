import type { DraftedTrack, EvaluationResult } from '@/types/draft';
import type { CuratorPersona } from './curatorPersona';

export interface WordleShareData {
  projectName: string;
  score: number;
  gradeBadge: string;
  statusText: string;
  curatorPersona?: CuratorPersona;
  streakDays?: number;
  slotsBreakdown: {
    slotName: string;
    emojiSquare: '🟩' | '🟨' | '🟥';
    songTitle: string;
    artist: string;
    synergyScore: number;
  }[];
  challengeCode?: string | null;
  shareUrl?: string;
}

/**
 * Builds a structured Wordle-style data object from the draft evaluation.
 */
export function buildWordleShareData(
  evaluation: EvaluationResult,
  draftedTracks: DraftedTrack[],
  gameMode: string,
  draftSeed: string | null = null,
  curatorPersona?: CuratorPersona,
  streakDays?: number
): WordleShareData {
  const projectLabel =
    gameMode === 'draft'
      ? 'TrackDraft'
      : gameMode === 'ep'
      ? 'EP Builder'
      : gameMode === 'budget'
      ? '$15 Aux Budget'
      : 'Album Builder';

  const statusText =
    evaluation.overallScore >= 8.8
      ? 'AUX PASS APPROVED 🔥'
      : evaluation.overallScore >= 7.5
      ? 'CERTIFIED CRUISE 🔊'
      : evaluation.overallScore >= 6.0
      ? 'SOLID VIBES 🎶'
      : 'AUX CORD REVOKED 💀';

  const slotsBreakdown = draftedTracks.map((dt) => {
    const energyDelta = Math.abs(dt.song.energy - dt.slot.targetEnergy.ideal);
    const flowSynergy = dt.song.flowInsight?.synergyScore ?? 75;

    let emojiSquare: '🟩' | '🟨' | '🟥' = '🟨';
    if (flowSynergy >= 85 || energyDelta <= 8) {
      emojiSquare = '🟩';
    } else if (flowSynergy < 60 || energyDelta >= 22) {
      emojiSquare = '🟥';
    }

    return {
      slotName: dt.slot.name,
      emojiSquare,
      songTitle: dt.song.title,
      artist: dt.song.artist,
      synergyScore: flowSynergy,
    };
  });

  return {
    projectName: projectLabel,
    score: evaluation.overallScore,
    gradeBadge: evaluation.gradeBadge,
    statusText,
    curatorPersona,
    streakDays,
    slotsBreakdown,
    challengeCode: draftSeed,
    shareUrl: typeof window !== 'undefined' ? window.location.href : 'https://trackdraft.app',
  };
}

/**
 * Generates clean, viral emoji text formatted for 1-click clipboard copy to X, Discord, or iMessage.
 */
export function formatWordleShareText(data: WordleShareData): string {
  const scoreFormatted = data.score.toFixed(1);
  const squaresRow = data.slotsBreakdown.map((s) => s.emojiSquare).join('');

  const lines: string[] = [
    `🎧 ${data.projectName} · ${scoreFormatted}/10 (${data.gradeBadge})`,
    `${data.statusText}`,
  ];

  if (data.curatorPersona) {
    lines.push(`👑 Persona: ${data.curatorPersona.title}`);
  }

  if (data.streakDays && data.streakDays > 1) {
    lines.push(`🔥 Daily Streak: ${data.streakDays} Days`);
  }

  lines.push('');
  lines.push(`Grid: ${squaresRow}`);

  data.slotsBreakdown.forEach((s, idx) => {
    lines.push(`${s.emojiSquare} ${idx + 1}. ${s.songTitle} - ${s.artist}`);
  });

  lines.push('');
  if (data.challengeCode) {
    lines.push(`⚔️ 1v1 Code: ${data.challengeCode}`);
  }
  lines.push(`Can you beat my aux score?`);
  lines.push(`${data.shareUrl}`);

  return lines.join('\n');
}
