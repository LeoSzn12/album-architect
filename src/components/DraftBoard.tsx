'use client';

import React, { useEffect } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { DraftCard } from './DraftCard';
import { ProgressStrip } from './ProgressStrip';
import { RefreshCw, Sparkles, Trophy, Undo2, AlertCircle, Swords, EyeOff } from 'lucide-react';
import { playHoverSound, playRerollSound, playDraftLockSound } from '@/lib/audioEngine';
import { eraLabel } from '@/lib/eraSequence';

interface DraftBoardProps {
  onEvaluateTrigger: () => void;
}

export const DraftBoard: React.FC<DraftBoardProps> = ({ onEvaluateTrigger }) => {
  const {
    slots,
    currentRoundIndex,
    currentOptions,
    draftSong,
    draftedTracks,
    undoLastPick,
    rerollTokens,
    useRerollToken: triggerRerollToken,
    difficulty,
    draftSeed,
    audioEnabled,
    eraSequence,
    gameMode,
    lastOpponentReveal,
  } = useDraftStore();

  const isCompleted = currentRoundIndex >= slots.length;
  const currentSlot = slots[currentRoundIndex];
  const projectLabel = gameMode === 'draft' ? 'Draft' : gameMode === 'ep' ? 'EP' : 'Album';
  const trackLabel = gameMode === 'draft' ? 'Round' : `${projectLabel} Track`;
  const completionLabel = gameMode === 'draft' ? 'Draft Complete' : `${projectLabel} Ready for Review`;
  const reviewActionLabel = gameMode === 'draft' ? 'Get Your Score' : `Review ${projectLabel}`;

  // Auto-assigned era for this round
  const currentEra = eraSequence[currentRoundIndex];
  const currentEraLabel = currentEra ? eraLabel(currentEra) : null;

  // Cmd+Z / Ctrl+Z shortcut for Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (draftedTracks.length > 0 && !isCompleted) {
          e.preventDefault();
          playDraftLockSound(audioEnabled);
          undoLastPick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draftedTracks.length, isCompleted, undoLastPick, audioEnabled]);

  const handleReroll = () => {
    if (rerollTokens > 0) {
      playRerollSound(audioEnabled);
      triggerRerollToken();
    }
  };

  const handleUndo = () => {
    if (draftedTracks.length > 0) {
      playDraftLockSound(audioEnabled);
      undoLastPick();
    }
  };

  if (isCompleted) {
    return (
      <div className="w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md relative overflow-hidden my-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-0.5 shadow-2xl shadow-purple-900/50 mb-4 animate-bounce">
          <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-1">
          {completionLabel}
        </span>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          {gameMode === 'draft' ? 'Tracklist Locked In!' : `${projectLabel} Tracklist Locked In`}
        </h2>
        <p className="text-sm text-gray-300 max-w-lg mb-6 leading-relaxed">
          {slots.length} tracks selected for your {gameMode === 'draft' ? 'draft' : projectLabel.toLowerCase()}. Reorder the sequence from the tracklist drawer, then submit when the build is ready for its final review.
        </p>

        {gameMode !== 'draft' && (
          <span className="mb-5 rounded-full border border-emerald-800/70 bg-emerald-950/30 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Build saved locally · ready to review
          </span>
        )}

        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onEvaluateTrigger();
          }}
          onMouseEnter={() => playHoverSound(audioEnabled)}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold rounded-2xl shadow-xl shadow-purple-900/40 text-base tracking-wide transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span>{reviewActionLabel}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 my-4">
      {/* Persistent progress strip */}
      <ProgressStrip />

      {/* Current Draft Slot Banner */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-800">
              {trackLabel} {currentSlot.roundNumber} of {slots.length}
            </span>

            {/* Auto-era badge */}
            {currentEraLabel && (
              <span className="px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-800">
                {currentEraLabel}
              </span>
            )}

            {draftSeed && (
              <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 text-xs font-mono font-extrabold tracking-wider border border-amber-800 flex items-center gap-1">
                <Swords className="w-3 h-3 text-amber-400" /> 1v1: {draftSeed}
              </span>
            )}

            {difficulty === 'hardcore' ? (
              <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Target: Classified
              </span>
            ) : (
              <span className="text-xs text-gray-500 font-medium">
                Target energy: {currentSlot.targetEnergy.ideal}%
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {gameMode === 'draft' ? 'Pick your' : `Select a track for your ${projectLabel.toLowerCase()}:`} <span className="text-purple-300">{currentSlot.name}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-xl leading-relaxed">
            {currentSlot.description}
          </p>
        </div>

        {/* Action Controls: Undo Pick + Reroll Token */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {draftedTracks.length > 0 && (
            <button
              onClick={handleUndo}
              onMouseEnter={() => playHoverSound(audioEnabled)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Undo last draft pick (Cmd+Z / Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Undo</span>
            </button>
          )}

          <button
            onClick={handleReroll}
            disabled={rerollTokens <= 0}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
              rerollTokens > 0
                ? 'bg-purple-950/80 hover:bg-purple-900 border-purple-700 text-purple-200 shadow-md shadow-purple-950/40 hover:scale-105'
                : 'bg-gray-950 border-gray-800 text-gray-600 cursor-not-allowed opacity-60'
            }`}
            title="Refresh the candidate pool for this round"
            aria-label={`Reroll candidate pool — ${rerollTokens} remaining`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rerollTokens > 0 ? 'text-pink-400' : ''}`} />
            <span>Reroll ({rerollTokens})</span>
          </button>
        </div>
      </div>

      {/* Draft mode reveals the AI choice only after the human locks a pick. */}
      {gameMode === 'draft' && lastOpponentReveal && (
        <div className="rounded-2xl border border-cyan-800/70 bg-cyan-950/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-black text-cyan-300">AI pick revealed</span>
              <span className="text-[10px] text-gray-500">Round {lastOpponentReveal.roundIndex + 1}</span>
            </div>
            <p className="text-sm font-extrabold text-white truncate">
              {lastOpponentReveal.song.title} <span className="text-gray-400 font-normal">— {lastOpponentReveal.song.rawArtistString}</span>
            </p>
            <p className="text-xs text-cyan-200/80">{lastOpponentReveal.reason}</p>
          </div>
          <span className="text-xs font-black text-cyan-300 whitespace-nowrap">{lastOpponentReveal.song.energy}% energy</span>
        </div>
      )}

      {/* Five-card recommendation pool in TrackDraft mode; builders use the same safe empty state with mode-specific copy. */}
      {currentOptions.length === 0 ? (
        <div className="w-full bg-gray-950 border border-purple-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
          <h3 className="text-base font-extrabold text-white">
            No {projectLabel} candidates available
          </h3>
          <p className="text-xs text-gray-400 max-w-sm">
            The catalog doesn&apos;t have enough {currentEraLabel ?? 'matching'} songs for {currentSlot.name}. {rerollTokens > 0 ? 'Use a reroll token to try another pool.' : 'No rerolls remain, so this slot is waiting for a new session.'}
          </p>
          <button
            onClick={handleReroll}
            disabled={rerollTokens <= 0}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer mt-2"
          >
            {rerollTokens > 0 ? `Try another pool (${rerollTokens})` : 'No rerolls available'}
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${currentOptions.length >= 5 ? 'md:grid-cols-5' : 'sm:grid-cols-2'} gap-4`}>
          {currentOptions.map((song) => (
            <DraftCard key={song.id} song={song} onDraft={draftSong} />
          ))}
        </div>
      )}
    </div>
  );
};
