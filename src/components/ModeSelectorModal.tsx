'use client';

import React from 'react';
import { GameMode, DifficultyTier, ChallengeTheme } from '@/types/draft';
import { useDraftStore } from '@/store/useDraftStore';
import { Zap, Disc, Check, X, ShieldAlert, Sparkles, Flame, EyeOff, Award, Swords, DollarSign, Crown, Heart, Clock } from 'lucide-react';
import { playHoverSound, playDraftLockSound } from '@/lib/audioEngine';
import { useModalA11y } from '@/hooks/useModalA11y';

interface ModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    gameMode,
    setGameMode,
    difficulty,
    setDifficulty,
    challengeTheme,
    setChallengeTheme,
    audioEnabled,
  } = useDraftStore();

  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleSelectMode = (mode: GameMode) => {
    playDraftLockSound(audioEnabled);
    setGameMode(mode);
    onClose();
  };

  const handleSelectDifficulty = (diff: DifficultyTier) => {
    playDraftLockSound(audioEnabled);
    setDifficulty(diff);
  };

  const handleSelectTheme = (theme: ChallengeTheme) => {
    playDraftLockSound(audioEnabled);
    setChallengeTheme(theme);
  };

  const difficulties: { id: DifficultyTier; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'standard',
      label: 'Standard',
      desc: 'Full reroll tokens (2-3) & visible energy targets.',
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'veteran',
      label: 'Veteran',
      desc: 'Strict 1 reroll token per session. High precision required.',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'hardcore',
      label: 'Hardcore',
      desc: 'Hidden target energy numbers! Trust your A&R instincts.',
      icon: <EyeOff className="w-4 h-4 text-red-400" />,
    },
  ];

  const gauntlets: { id: ChallengeTheme; label: string; icon: React.ReactNode }[] = [
    { id: 'standard', label: 'All-Catalog', icon: <Sparkles className="w-3.5 h-3.5 text-zinc-300" /> },
    { id: 'era-90s', label: '90s Golden Era', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'era-2000s', label: '2000s Bling Era', icon: <Crown className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'era-2010s', label: '2010s Streaming', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'era-2020s', label: '2020s Modern', icon: <Zap className="w-3.5 h-3.5 text-red-400" /> },
    { id: 'year-2016', label: 'Class of 2016', icon: <Award className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'genre-hiphop', label: 'Hip-Hop Only', icon: <Disc className="w-3.5 h-3.5 text-zinc-300" /> },
    { id: 'genre-rnb', label: 'R&B / Soul', icon: <Heart className="w-3.5 h-3.5 text-rose-400" /> },
  ];

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Executive Configuration
            </span>
            <h2 className="text-2xl font-black text-white">Choose Build Format & Gauntlet</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Challenge Gauntlet Theme Selector */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Active Challenge Gauntlet (Filter Pool)
          </span>
          <div className="flex flex-wrap gap-2">
            {gauntlets.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectTheme(g.id)}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className={`px-3 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                  challengeTheme === g.id
                    ? 'bg-white border-white text-black shadow-md'
                    : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {g.icon}
                <span>{g.label}</span>
                {challengeTheme === g.id && <Check className="w-3 h-3 text-black" />}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection Bar */}
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-rose-500" /> Executive Difficulty Tier
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDifficulty(d.id)}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  difficulty === d.id
                    ? 'bg-white/[0.08] border-white/[0.2] ring-1 ring-white/30 shadow-lg'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    {d.icon}
                    <span>{d.label}</span>
                  </span>
                  {difficulty === d.id && <Check className="w-3.5 h-3.5 text-rose-500" />}
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode Cards (3 Clean Modes: Draft, EP Builder, Album Builder) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Competitive Draft Mode Card */}
          <div
            onClick={() => handleSelectMode('draft')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'draft'
                ? 'bg-[#15151c] border-white/[0.25] ring-1 ring-white/30 shadow-xl'
                : 'bg-[#121216]/85 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#14141a]'
            }`}
          >
            {gameMode === 'draft' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                <Swords className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-white mb-1">Draft Mode</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                7-round A&R battle against AI from the same 5-card pool.
              </p>
            </div>
            <button className={`w-full py-2.5 rounded-full text-xs font-black transition cursor-pointer active:scale-95 ${gameMode === 'draft' ? 'bg-white text-black shadow-md' : 'bg-white/[0.06] text-zinc-300 group-hover:bg-white/[0.12] group-hover:text-white'}`}>
              Select Draft Mode
            </button>
          </div>

          {/* Quick EP Mode Card */}
          <div
            onClick={() => handleSelectMode('ep')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'ep'
                ? 'bg-[#15151c] border-white/[0.25] ring-1 ring-white/30 shadow-xl'
                : 'bg-[#121216]/85 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#14141a]'
            }`}
          >
            {gameMode === 'ep' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-white mb-1">EP Builder</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Shape a focused 7-track project with a clear opener, turn, and outro.
              </p>
            </div>
            <button className={`w-full py-2.5 rounded-full text-xs font-black transition cursor-pointer active:scale-95 ${gameMode === 'ep' ? 'bg-white text-black shadow-md' : 'bg-white/[0.06] text-zinc-300 group-hover:bg-white/[0.12] group-hover:text-white'}`}>
              Start EP Builder
            </button>
          </div>

          {/* Full Album Mode Card */}
          <div
            onClick={() => handleSelectMode('album')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'album'
                ? 'bg-[#15151c] border-white/[0.25] ring-1 ring-white/30 shadow-xl'
                : 'bg-[#121216]/85 border-white/[0.08] hover:border-white/[0.18] hover:bg-[#14141a]'
            }`}
          >
            {gameMode === 'album' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-sm">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                <Disc className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-white mb-1">Album Builder</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                Full 14-track, three-act album with act pacing and deliberate closing.
              </p>
            </div>
            <button className={`w-full py-2.5 rounded-full text-xs font-black transition cursor-pointer active:scale-95 ${gameMode === 'album' ? 'bg-white text-black shadow-md' : 'bg-white/[0.06] text-zinc-300 group-hover:bg-white/[0.12] group-hover:text-white'}`}>
              Start Album Builder
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-center text-[11px] text-zinc-400">
          EP and Album builds save automatically on this device. Leave and return to resume the current tracklist before review.
        </div>
      </div>
    </div>
  );
};
