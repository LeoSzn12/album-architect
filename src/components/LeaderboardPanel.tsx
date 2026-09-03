'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { Trophy, Crown, Filter, Trash2, Swords } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';
import { GameMode, DifficultyTier } from '@/types/draft';

export const LeaderboardPanel: React.FC = () => {
  const { leaderboard, clearLeaderboard, audioEnabled } = useDraftStore();
  const [filterMode, setFilterMode] = useState<'all' | GameMode>('all');
  const [filterDiff, setFilterDiff] = useState<'all' | DifficultyTier>('all');

  const filteredEntries = leaderboard.filter((entry) => {
    if (filterMode !== 'all' && entry.gameMode !== filterMode) return false;
    if (filterDiff !== 'all' && entry.difficulty !== filterDiff) return false;
    return true;
  });

  return (
    <div className="box-border min-w-0 w-full bg-[#0e0e12]/95 border border-white/[0.08] rounded-3xl p-6 shadow-2xl backdrop-blur-2xl my-6 flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-white/[0.08] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-amber-400 shadow-md">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Executive Leaderboard & Rankings
            </h3>
            <p className="text-xs text-zinc-400">
              Top curated projects scored by the AI A&R Critic Board across all modes
            </p>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Reset executive leaderboard high scores?')) {
                clearLeaderboard();
              }
            }}
            title="Reset Leaderboard"
            className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-end sm:self-auto active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset High Scores</span>
          </button>
        )}
      </div>

      {/* Filter Category Bar */}
      <div className="flex min-w-0 flex-col items-stretch gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/[0.08] text-xs font-extrabold sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-zinc-300">
          <Filter className="w-3.5 h-3.5 text-rose-500" />
          <span>Format:</span>
          <div className="flex min-w-0 flex-wrap gap-1 ml-1">
            {(['all', 'draft', 'budget', 'ep', 'album'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  playHoverSound(audioEnabled);
                  setFilterMode(m);
                }}
                className={`px-3 py-1 rounded-full transition cursor-pointer active:scale-95 ${
                  filterMode === m
                    ? 'bg-white text-black shadow-md font-black'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {m === 'all' ? 'All' : m === 'draft' ? 'Draft' : m === 'budget' ? '$15 Budget' : m === 'ep' ? 'EP' : 'Album'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-zinc-300">
          <span>Tier:</span>
          <div className="flex min-w-0 flex-wrap gap-1 ml-1">
            {(['all', 'standard', 'veteran', 'hardcore'] as const).map((d) => (
              <button
                key={d}
                onClick={() => {
                  playHoverSound(audioEnabled);
                  setFilterDiff(d);
                }}
                className={`px-2.5 py-1 rounded-full transition cursor-pointer active:scale-95 ${
                  filterDiff === d
                    ? 'bg-white text-black shadow-md font-black'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {d === 'all' ? 'All Tiers' : d.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-10 text-xs text-zinc-500 italic bg-black/40 rounded-2xl border border-white/[0.06]">
          No leaderboard entries found matching the selected filters. Complete a draft to claim your spot!
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry, index) => {
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={entry.id}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-md ${
                  isFirst
                    ? 'bg-[#181822]/90 border-amber-500/40 shadow-lg'
                    : isSecond
                    ? 'bg-[#14141a]/90 border-white/[0.15]'
                    : isThird
                    ? 'bg-[#111115]/90 border-amber-700/30'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isFirst ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center shadow-md">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                    ) : isSecond ? (
                      <div className="w-8 h-8 rounded-xl bg-zinc-300 text-black font-black flex items-center justify-center shadow-md">
                        2
                      </div>
                    ) : isThird ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-700 text-white font-black flex items-center justify-center shadow-md">
                        3
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] text-zinc-400 font-bold text-xs flex items-center justify-center">
                        #{index + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white">{entry.playerAlias}</h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase">
                        {entry.gameMode === 'draft' ? 'DRAFT' : entry.gameMode === 'budget' ? '$15 BUDGET' : entry.gameMode === 'ep' ? 'EP' : 'LP'} • {entry.difficulty}
                      </span>
                      {entry.isDailyDrop && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase flex items-center gap-0.5">
                          🔥 Daily Drop
                        </span>
                      )}
                      {entry.theme && entry.theme !== 'standard' && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] uppercase">
                          {entry.theme}
                        </span>
                      )}
                      {entry.draftSeed && !entry.isDailyDrop && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/50 text-zinc-300 border border-white/[0.08] flex items-center gap-1">
                          <Swords className="w-3 h-3 text-rose-500" /> {entry.draftSeed}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mt-0.5">
                      Lead: <strong className="text-zinc-200">{entry.topTrackTitle}</strong> — {entry.topTrackArtist} • {entry.completedAt}
                    </p>
                  </div>
                </div>

                {/* Score Column */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-semibold">
                    <span title="Slot Fit">SF: <strong className="text-zinc-200">{entry.subScores.slotFit?.toFixed(1) ?? '—'}</strong></span>
                    <span>•</span>
                    <span title="Album Flow">AF: <strong className="text-rose-400">{entry.subScores.albumFlow?.toFixed(1) ?? '—'}</strong></span>
                    <span>•</span>
                    <span title="Cohesion">C: <strong className="text-zinc-200">{entry.subScores.cohesion?.toFixed(1) ?? '—'}</strong></span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      {entry.overallScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 block">
                      {entry.gradeBadge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
