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
    <div className="w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-6 shadow-2xl backdrop-blur-md my-6 flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Executive Leaderboard & Rankings
            </h3>
            <p className="text-xs text-gray-400">
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
            className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-red-950/60 border border-gray-800 text-gray-400 hover:text-red-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset High Scores</span>
          </button>
        )}
      </div>

      {/* Filter Category Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/90 p-3 rounded-2xl border border-purple-900/40 text-xs font-extrabold">
        <div className="flex items-center gap-1.5 text-purple-300">
          <Filter className="w-3.5 h-3.5 text-pink-400" />
          <span>Format:</span>
          <div className="flex gap-1 ml-1">
            {(['all', 'ep', 'album'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  playHoverSound(audioEnabled);
                  setFilterMode(m);
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterMode === m
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
                }`}
              >
                {m === 'all' ? 'All Formats' : m === 'ep' ? 'EP (7)' : 'LP (14)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-purple-300">
          <span>Tier:</span>
          <div className="flex gap-1 ml-1">
            {(['all', 'standard', 'veteran', 'hardcore'] as const).map((d) => (
              <button
                key={d}
                onClick={() => {
                  playHoverSound(audioEnabled);
                  setFilterDiff(d);
                }}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  filterDiff === d
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                    : 'bg-gray-900 text-gray-400 hover:text-white'
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
        <div className="text-center py-10 text-xs text-gray-500 italic bg-gray-950 rounded-2xl border border-gray-800">
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
                    ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/40 to-gray-950 border-amber-500/60 shadow-lg shadow-amber-950/30'
                    : isSecond
                    ? 'bg-gradient-to-r from-slate-900 via-purple-950/30 to-gray-950 border-slate-600/60'
                    : isThird
                    ? 'bg-gradient-to-r from-orange-950/40 via-purple-950/20 to-gray-950 border-orange-700/50'
                    : 'bg-gray-950/90 border-gray-800 hover:border-purple-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isFirst ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-gray-950 font-black flex items-center justify-center shadow-md">
                        <Crown className="w-5 h-5 fill-current" />
                      </div>
                    ) : isSecond ? (
                      <div className="w-8 h-8 rounded-xl bg-slate-300 text-gray-950 font-black flex items-center justify-center shadow-md">
                        2
                      </div>
                    ) : isThird ? (
                      <div className="w-8 h-8 rounded-xl bg-amber-700 text-white font-black flex items-center justify-center shadow-md">
                        3
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 font-bold text-xs flex items-center justify-center">
                        #{index + 1}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-white">{entry.playerAlias}</h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase">
                        {entry.gameMode === 'ep' ? 'EP' : 'LP'} • {entry.difficulty}
                      </span>
                      {entry.draftSeed && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                          <Swords className="w-3 h-3" /> {entry.draftSeed}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">
                      Lead: <strong className="text-gray-200">{entry.topTrackTitle}</strong> — {entry.topTrackArtist} • {entry.completedAt}
                    </p>
                  </div>
                </div>

                {/* Score Column */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span title="Pacing">P: <strong className="text-purple-300">{entry.subScores.pacing.toFixed(1)}</strong></span>
                    <span>•</span>
                    <span title="Synergy">S: <strong className="text-pink-300">{entry.subScores.synergy.toFixed(1)}</strong></span>
                    <span>•</span>
                    <span title="Cohesion">C: <strong className="text-cyan-300">{entry.subScores.cohesion.toFixed(1)}</strong></span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-white bg-gradient-to-r from-purple-300 to-pink-400 bg-clip-text text-transparent">
                      {entry.overallScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-pink-400 block">
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
