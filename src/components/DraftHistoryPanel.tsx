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
      <div className="w-full rounded-2xl border border-dashed border-gray-800 bg-gray-900/50 p-5 text-center">
        <History className="mx-auto h-5 w-5 text-gray-600" />
        <h3 className="mt-2 text-sm font-extrabold uppercase tracking-wider text-gray-300">No completed builds yet</h3>
        <p className="mt-1 text-xs text-gray-500">
          Your completed {currentProjectLabel.toLowerCase()} reviews will appear here after submission.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/80 border border-gray-800 rounded-2xl p-5 backdrop-blur-md shadow-xl my-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Completed Build History ({pastDrafts.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-purple-300 text-xs font-bold transition cursor-pointer"
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
              className="p-1.5 rounded-lg bg-gray-950 hover:bg-red-950/60 text-gray-500 hover:text-red-400 border border-gray-800 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-3 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
          {pastDrafts.map((draft) => (
            <div
              key={draft.id}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="bg-gray-950 p-3.5 rounded-xl border border-gray-800/90 hover:border-purple-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 rounded">
                    {draft.gameMode === 'draft' ? 'TrackDraft Match' : draft.gameMode === 'ep' ? `EP Builder · ${draft.trackCount} tracks` : `Album Builder · ${draft.trackCount} tracks`} • {draft.difficulty.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">{draft.completedAt}</span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black text-white">
                    {draft.overallScore.toFixed(1)} <span className="text-xs text-gray-500 font-normal">/ 10</span>
                  </span>
                  <span className="text-[11px] font-extrabold text-pink-400">
                    {draft.gradeBadge}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-300">
                  <p className="font-semibold text-gray-200 truncate">
                    Lead: {draft.topTrackTitle}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {draft.topTrackArtist}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-900 flex justify-between items-center text-[10px] text-purple-300 font-semibold">
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
