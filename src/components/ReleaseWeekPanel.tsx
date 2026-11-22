'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Disc3, Download, Share2, TrendingUp, Trophy } from 'lucide-react';
import { useDraftStore } from '@/store/useDraftStore';
import { simulateRelease, DAY_LABELS } from '@/lib/firstWeek/releaseSim';
import { getWeeklyTrend } from '@/lib/firstWeek/weeklyTrend';
import { formatUnits, LADDER_MILESTONES } from '@/lib/firstWeek/ladder';
import { RIVALS } from '@/lib/firstWeek/rivals';
import { formatFirstWeekShare } from '@/lib/firstWeek/shareText';
import { renderShareImage } from '@/lib/firstWeek/shareImage';
import { buildChallengeInvite } from '@/lib/challengeInvite';
import { getCategoryLabel } from '@/lib/firstWeek/categories';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const ReleaseWeekPanel: React.FC = () => {
  const {
    draftedTracks,
    evaluationResult,
    opponentDraftedTracks,
    opponentEvaluationResult,
    rivalId,
    ruleCardIds,
    mysteryRoundIndex,
    releaseSeed,
    gameMode,
    draftSeed,
    difficulty,
    selectedEra,
    challengeTheme,
  } = useDraftStore();

  const trend = useMemo(() => getWeeklyTrend(), []);

  const release = useMemo(() => {
    if (!evaluationResult) return null;
    return simulateRelease({ tracks: draftedTracks, evaluation: evaluationResult, ruleCards: ruleCardIds, mysteryRoundIndex, trend, seedKey: releaseSeed });
  }, [draftedTracks, evaluationResult, ruleCardIds, mysteryRoundIndex, trend, releaseSeed]);

  const rival = useMemo(() => {
    if (gameMode !== 'draft' || !opponentEvaluationResult || opponentDraftedTracks.length === 0) return null;
    const result = simulateRelease({
      tracks: opponentDraftedTracks,
      evaluation: opponentEvaluationResult,
      ruleCards: ruleCardIds,
      mysteryRoundIndex: null,
      trend,
      seedKey: `${releaseSeed}::rival`,
    });
    return { name: RIVALS[rivalId]?.name ?? 'Your rival', units: result.finalUnits };
  }, [gameMode, opponentEvaluationResult, opponentDraftedTracks, ruleCardIds, trend, releaseSeed, rivalId]);

  // Drop animation: reveal one day at a time.
  const [daysShown, setDaysShown] = useState(() => (prefersReducedMotion() ? 7 : 0));
  useEffect(() => {
    if (!release || daysShown >= 7) return;
    const timer = setTimeout(() => setDaysShown((days) => days + 1), daysShown === 0 ? 500 : 420);
    return () => clearTimeout(timer);
  }, [release, daysShown]);

  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!release) return null;

  const revealed = release.dailyUnits.slice(0, daysShown).reduce((sum, units) => sum + units, 0);
  const done = daysShown >= 7;
  const peak = Math.max(1, ...release.dailyUnits);
  const rangeSpan = Math.max(1, release.high - release.low);
  const markerLeft = Math.min(100, Math.max(0, ((release.finalUnits - release.low) / rangeSpan) * 100));
  const ladderTop = LADDER_MILESTONES[LADDER_MILESTONES.length - 1].units;
  const categoryLabel = getCategoryLabel(challengeTheme);
  const isDaily = draftSeed?.startsWith('DAILY-') ?? false;
  const label = isDaily ? "Today's Drop" : categoryLabel;

  const shareUrl = () => {
    if (typeof window === 'undefined') return null;
    if (!draftSeed) return window.location.origin;
    return buildChallengeInvite(window.location.origin, { seed: draftSeed, mode: gameMode, difficulty, era: selectedEra, theme: challengeTheme });
  };
  const shareText = () => formatFirstWeekShare({ release, rival, label, url: shareUrl() });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleShareImage = async () => {
    setImageError(false);
    const blob = await renderShareImage({
      release,
      rival,
      label,
      tracks: draftedTracks.map((track) => ({ title: track.song.title, artist: track.song.artist })),
    });
    if (!blob) {
      setImageError(true);
      return;
    }
    const file = new File([blob], 'first-week.png', { type: 'image/png' });
    if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText() });
        return;
      } catch {
        // Fall through to download when the share sheet is closed or fails.
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'first-week.png';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section aria-label="First week results" className="rounded-3xl border border-white/[0.1] bg-[#121218]/95 p-5 sm:p-7 shadow-2xl flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center items-center">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-rose-400">
          <Disc3 className={`w-4 h-4 ${done ? '' : 'animate-spin'}`} aria-hidden="true" />
          {done ? 'Your first week is in' : 'Release week in progress'}
        </span>
        {label && <span className="text-xs font-semibold text-zinc-400">{label}</span>}
      </header>

      <div className="text-center" aria-live="polite">
        <div className="text-6xl sm:text-7xl font-black tracking-tight text-white tabular-nums">
          {formatUnits(done ? release.finalUnits : revealed)}
        </div>
        <div className="mt-1 text-sm font-bold text-zinc-400">units in week one</div>
        {done && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-black text-amber-300">
            <Trophy className="w-4 h-4" aria-hidden="true" />
            {release.milestone.label}
          </div>
        )}
      </div>

      {/* Daily chart */}
      <div className="grid grid-cols-7 gap-2 items-end h-32" role="img" aria-label={`Units per day: ${release.dailyUnits.map((units, index) => `${DAY_LABELS[index]} ${formatUnits(units)}`).join(', ')}`}>
        {release.dailyUnits.map((units, index) => (
          <div key={DAY_LABELS[index]} className="flex flex-col items-center gap-1 h-full justify-end">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${index === 0 ? 'bg-rose-500' : 'bg-white/50'}`}
              style={{ height: index < daysShown ? `${Math.max(4, (units / peak) * 100)}%` : '0%' }}
            />
            <span className="text-[10px] font-bold text-zinc-500">{DAY_LABELS[index]}</span>
          </div>
        ))}
      </div>

      {done && (
        <>
          {rival && (
            <div className={`rounded-2xl border p-4 text-center ${release.finalUnits > rival.units ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
              <div className="text-lg font-black text-white">
                {release.finalUnits > rival.units ? `You outsold ${rival.name}` : release.finalUnits === rival.units ? `Dead heat with ${rival.name}` : `${rival.name} outsold you`}
              </div>
              <div className="text-sm text-zinc-300">
                You {formatUnits(release.finalUnits)} · {rival.name} {formatUnits(rival.units)}
              </div>
            </div>
          )}

          {/* Range */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-zinc-400">
              <span>{formatUnits(release.low)}</span>
              <span>Projected range</span>
              <span>{formatUnits(release.high)}</span>
            </div>
            <div className="relative mt-1.5 h-2 rounded-full bg-white/[0.08]">
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-rose-500" style={{ left: `calc(${markerLeft}% - 7px)` }} />
            </div>
            <p className="mt-2 text-[11px] text-zinc-500">The crowd decides where you land inside the range.</p>
          </div>

          {/* Why */}
          <div>
            <h3 className="text-sm font-black text-white mb-2">Why it sold</h3>
            <ul className="flex flex-col gap-1.5">
              {release.reasons.map((reason) => (
                <li key={reason.label} className="flex justify-between gap-3 text-xs">
                  <span className="text-zinc-300">{reason.label}</span>
                  <span className={`font-black tabular-nums ${reason.units >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {reason.units >= 0 ? '+' : '−'}{formatUnits(Math.abs(reason.units))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              This week: {trend.name}. {release.trendNote}
            </p>
          </div>

          {/* Ladder */}
          <div>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-zinc-300">{release.milestone.label}</span>
              {release.nextMilestone && (
                <span className="text-zinc-500">
                  {formatUnits(release.nextMilestone.units - release.finalUnits)} to {release.nextMilestone.label}
                </span>
              )}
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${Math.min(100, (release.finalUnits / ladderTop) * 100)}%` }} />
            </div>
          </div>

          {/* Share */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleShareImage}
              className="min-h-[44px] flex-1 rounded-full bg-white px-5 py-2.5 text-xs font-black text-black hover:bg-zinc-200 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {typeof navigator !== 'undefined' && 'share' in navigator ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              Share your first week
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] flex-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-5 py-2.5 text-xs font-black text-white hover:bg-white/[0.12] active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy text'}
            </button>
          </div>
          {imageError && <p className="text-[11px] text-rose-400 text-center">Couldn&apos;t make the image on this device. Copy the text instead.</p>}
        </>
      )}
    </section>
  );
};
