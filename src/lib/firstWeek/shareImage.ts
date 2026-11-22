import { DAY_LABELS, type ReleaseResult } from './releaseSim.ts';
import { formatUnits } from './ladder.ts';

export interface ShareImageInput {
  release: ReleaseResult;
  tracks: { title: string; artist: string }[];
  rival?: { name: string; units: number } | null;
  label?: string | null;
}

const WIDTH = 1080;
const HEIGHT = 1350;

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) trimmed = trimmed.slice(0, -1);
  return `${trimmed}…`;
}

/** Draws a portrait share card and returns it as a PNG blob. Browser only. */
export async function renderShareImage({ release, tracks, rival, label }: ShareImageInput): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#1a0b14');
  background.addColorStop(0.55, '#0c0c14');
  background.addColorStop(1, '#0a1020');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = ctx.createRadialGradient(WIDTH / 2, 380, 40, WIDTH / 2, 380, 520);
  glow.addColorStop(0, 'rgba(250, 35, 59, 0.28)');
  glow.addColorStop(1, 'rgba(250, 35, 59, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#fa233b';
  ctx.font = '800 40px system-ui, -apple-system, sans-serif';
  ctx.fillText('FIRST WEEK', WIDTH / 2, 120);
  if (label) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 30px system-ui, -apple-system, sans-serif';
    ctx.fillText(fitText(ctx, label, WIDTH - 160), WIDTH / 2, 168);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 210px system-ui, -apple-system, sans-serif';
  ctx.fillText(formatUnits(release.finalUnits), WIDTH / 2, 410);
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '700 40px system-ui, -apple-system, sans-serif';
  ctx.fillText('units in week one', WIDTH / 2, 470);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 52px system-ui, -apple-system, sans-serif';
  ctx.fillText(release.milestone.label, WIDTH / 2, 560);

  // Daily bars
  const chartLeft = 160;
  const chartWidth = WIDTH - 320;
  const chartBottom = 820;
  const chartHeight = 200;
  const peak = Math.max(1, ...release.dailyUnits);
  const slot = chartWidth / release.dailyUnits.length;
  release.dailyUnits.forEach((units, index) => {
    const height = Math.max(6, (units / peak) * chartHeight);
    const x = chartLeft + index * slot + slot * 0.18;
    ctx.fillStyle = index === 0 ? '#fa233b' : 'rgba(255,255,255,0.55)';
    ctx.fillRect(x, chartBottom - height, slot * 0.64, height);
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '600 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(DAY_LABELS[index] ?? '', x + slot * 0.32, chartBottom + 40);
  });

  let y = 960;
  if (rival) {
    const won = release.finalUnits > rival.units;
    ctx.fillStyle = won ? '#34d399' : '#fb7185';
    ctx.font = '800 40px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      fitText(ctx, `${won ? 'Beat' : 'Lost to'} ${rival.name} · ${formatUnits(rival.units)}`, WIDTH - 160),
      WIDTH / 2,
      y,
    );
    y += 70;
  }

  ctx.font = '600 30px system-ui, -apple-system, sans-serif';
  tracks.slice(0, 3).forEach((track, index) => {
    ctx.fillStyle = '#e4e4e7';
    ctx.fillText(fitText(ctx, `${index + 1}. ${track.title} · ${track.artist}`, WIDTH - 200), WIDTH / 2, y);
    y += 46;
  });

  ctx.fillStyle = '#71717a';
  ctx.font = '700 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('Can you outsell me?', WIDTH / 2, HEIGHT - 70);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}
