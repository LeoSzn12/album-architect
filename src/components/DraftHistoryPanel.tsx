'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { History, Trash2, Sparkles } from 'lucide-react';
import { playHoverSound } from '@/lib/audioEngine';

export const DraftHistoryPanel: React.FC = () => {
  const { pastDrafts, clearHistory, audioEnabled, gameMode } = useDraftStore();
  const [isOpen, setIsOpen] = useState(false);

  const currentProjectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';

  if (pastDrafts.length === 0) {
    return (
      <div className="w-full rounded-3xl border border-dashed border-white/[0.08] bg-[#0e0e12]/60 p-6 text-center backdrop-blur-xl">
        <History className="mx-auto h-5 w-5 text-zinc-600" />
        <h3 className="mt-2 text-sm font-extrabold uppercase tracking-wider text-zinc-300">No completed builds yet</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Your completed {currentProjectLabel.toLowerCase()} reviews will appear here after submission.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0e0e12]/90 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-2xl shadow-xl my-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <History className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Completed Build History ({pastDrafts.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            {isOpen ? 'Collapse History' : 'View Past Projects'}
          </button>

          {isOpen && (
            <button
              onClick={() => {
                if (confirm('Clear all draft history entries?')) {
                  clearHistory();
                }
              }}
              title="Clear Draft History"
              className="p-2 rounded-full bg-white/[0.04] hover:bg-rose-950/50 text-zinc-400 hover:text-rose-300 border border-white/[0.08] transition active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 animate-fade-in">
          {pastDrafts.map((draft) => (
            <div
              key={draft.id}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="bg-[#121216]/90 p-4 rounded-2xl border border-white/[0.08] hover:border-white/20 transition flex flex-col justify-between shadow-md"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/[0.06] text-zinc-300 border border-white/[0.08] rounded-full">
                    {draft.gameMode === 'draft' ? 'TrackDraft Match' : draft.gameMode === 'ep' ? `EP Builder · ${draft.trackCount} tracks` : `Album Builder · ${draft.trackCount} tracks`} • {draft.difficulty.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">{draft.completedAt}</span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white">
                    {draft.overallScore.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">/ 10</span>
                  </span>
                  <span className="text-xs font-extrabold text-rose-400">
                    {draft.gradeBadge}
                  </span>
                </div>

                <div className="mt-2.5 text-xs text-zinc-300">
                  <p className="font-semibold text-white truncate">
                    Lead: {draft.topTrackTitle}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {draft.topTrackArtist}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex justify-between items-center text-[10px] text-zinc-400 font-semibold">
                <span>{draft.trackCount} Tracks Reviewed</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
