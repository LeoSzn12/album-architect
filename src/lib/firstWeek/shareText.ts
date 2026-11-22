import { formatUnits } from './ladder.ts';
import type { ReleaseResult } from './releaseSim.ts';

const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** One bar per day, scaled to the biggest day. */
export function dailySparkline(dailyUnits: number[]): string {
  const peak = Math.max(1, ...dailyUnits);
  return dailyUnits.map((units) => BARS[Math.min(BARS.length - 1, Math.round((units / peak) * (BARS.length - 1)))]).join('');
}

export interface ShareTextInput {
  release: ReleaseResult;
  rival?: { name: string; units: number } | null;
  label?: string | null;
  url?: string | null;
}

export function formatFirstWeekShare({ release, rival, label, url }: ShareTextInput): string {
  const lines = [
    `📀 First Week${label ? ` · ${label}` : ''}`,
    `${formatUnits(release.finalUnits)} first week · ${release.milestone.label}`,
    `Fri→Thu ${dailySparkline(release.dailyUnits)}`,
  ];
  if (rival) {
    const won = release.finalUnits > rival.units;
    const tied = release.finalUnits === rival.units;
    lines.push(
      tied
        ? `🤝 Tied ${rival.name} at ${formatUnits(rival.units)}`
        : won
          ? `🏆 Beat ${rival.name} (${formatUnits(rival.units)})`
          : `😤 Lost to ${rival.name} (${formatUnits(rival.units)})`,
    );
  }
  const met = release.ruleResults.filter((result) => result.outcome.met && result.outcome.unitShare > 0).length;
  if (release.ruleResults.length) lines.push(`🃏 Rule cards: ${met}/${release.ruleResults.length}`);
  lines.push('', 'Can you outsell me?');
  if (url) lines.push(url);
  return lines.join('\n');
}
