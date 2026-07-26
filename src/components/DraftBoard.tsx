'use client';

import React, { useEffect } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { EraFilter } from '@/types/draft';
import { DraftCard } from './DraftCard';
import { RefreshCw, Sparkles, Trophy, Calendar, Undo2, AlertCircle, EyeOff, Swords } from 'lucide-react';
import { playHoverSound, playRerollSound, playDraftLockSound } from '@/lib/audioEngine';

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
    selectedEra,
    setSelectedEra,
    difficulty,
    draftSeed,
    audioEnabled,
  } = useDraftStore();

  const isCompleted = currentRoundIndex >= slots.length;
  const currentSlot = slots[currentRoundIndex];

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

  const eraTabs: { id: EraFilter; label: string; badge: string }[] = [
    { id: 'all', label: 'All Eras', badge: '1990s–2026' },
    { id: '2020s', label: '2020s / Modern', badge: '2020+' },
    { id: '2010s', label: '2010s Golden Era', badge: '2010–2019' },
    { id: '2000s', label: '2000s & Classics', badge: '1990–2009' },
  ];

  if (isCompleted) {
    return (
      <div className="w-full bg-gray-900/90 border border-purple-500/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-md relative overflow-hidden my-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 p-0.5 shadow-2xl shadow-purple-900/50 mb-4 animate-bounce">
          <div className="w-full h-full bg-gray-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-1">
          Curating Complete
        </span>
        <h2 className="text-3xl font-extrabold text-white mb-2">Master Tracklist Locked In!</h2>
        <p className="text-sm text-gray-300 max-w-lg mb-6 leading-relaxed">
          Your project sequencing is finalized. Send your tracklist to the AI Critic Evaluation Board (Marcus, Chloe, and Julian) to receive your overall score and badge!
        </p>

        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onEvaluateTrigger();
          }}
          onMouseEnter={() => playHoverSound(audioEnabled)}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold rounded-2xl shadow-xl shadow-purple-900/40 text-base tracking-wide transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
          <span>Summon AI Critic Panel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 my-4">
      {/* Era / Decade Category Selector Bar */}
      <div className="bg-gray-950/90 border border-purple-900/40 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-extrabold text-purple-300">
          <Calendar className="w-4 h-4 text-pink-400" />
          <span>Candidate Era Category:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {eraTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playHoverSound(audioEnabled);
                setSelectedEra(tab.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedEra === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-950/50'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Current Draft Slot Banner */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 text-xs font-bold uppercase tracking-wider border border-purple-800">
              Round {currentSlot.roundNumber} / {slots.length}
            </span>
            {draftSeed && (
              <span className="px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 text-xs font-mono font-extrabold tracking-wider border border-amber-800 flex items-center gap-1">
                <Swords className="w-3 h-3 text-amber-400" /> 1v1 Seed: {draftSeed}
              </span>
            )}
            {difficulty === 'hardcore' ? (
              <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Target Energy: Classified (Hardcore)
              </span>
            ) : (
              <span className="text-xs text-gray-400 font-semibold">
                Slot Target Energy: {currentSlot.targetEnergy.ideal}%
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Draft Your {currentSlot.name}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
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
              <span>Undo Pick</span>
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
            title="Refresh candidates for this round"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rerollTokens > 0 ? 'text-pink-400' : ''}`} />
            <span>Reroll Pool ({rerollTokens})</span>
          </button>
        </div>
      </div>

      {/* 4-Card Positional Draft Options Grid OR Empty State */}
      {currentOptions.length === 0 ? (
        <div className="w-full bg-gray-950 border border-purple-900/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-amber-400 animate-pulse" />
          <h3 className="text-base font-extrabold text-white">No Tracks Found in Era Pool</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            There are no candidates matching &quot;{selectedEra}&quot; for {currentSlot.name}. Widen your era category filter or use a reroll token.
          </p>
          <button
            onClick={() => setSelectedEra('all')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer mt-2"
          >
            Switch to All Eras
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {currentOptions.map((song) => (
            <DraftCard key={song.id} song={song} onDraft={draftSong} />
          ))}
        </div>
      )}
    </div>
  );
};
