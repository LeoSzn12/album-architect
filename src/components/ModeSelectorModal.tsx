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
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
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
    { id: 'standard', label: 'All-Catalog', icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'era-90s', label: '90s Golden Era', icon: <Clock className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'era-2000s', label: '2000s Bling Era', icon: <Crown className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'era-2010s', label: '2010s Streaming', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
    { id: 'era-2020s', label: '2020s Modern', icon: <Zap className="w-3.5 h-3.5 text-red-400" /> },
    { id: 'year-2016', label: 'Class of 2016', icon: <Award className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'genre-hiphop', label: 'Hip-Hop Only', icon: <Disc className="w-3.5 h-3.5 text-cyan-400" /> },
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
        className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Glow backdrop decorative */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Executive Configuration
            </span>
            <h2 className="text-2xl font-extrabold text-white">Choose Build Format & Gauntlet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Gauntlet Theme Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> Active Challenge Gauntlet (Filter Pool)
          </span>
          <div className="flex flex-wrap gap-2">
            {gauntlets.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectTheme(g.id)}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  challengeTheme === g.id
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40 ring-2 ring-purple-400/30'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                {g.icon}
                <span>{g.label}</span>
                {challengeTheme === g.id && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection Bar */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-gray-300 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-pink-400" /> Executive Difficulty Tier
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {difficulties.map((d) => (
              <button
                key={d.id}
                onClick={() => handleSelectDifficulty(d.id)}
                onMouseEnter={() => playHoverSound(audioEnabled)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  difficulty === d.id
                    ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/40'
                    : 'bg-gray-950 border-gray-800 hover:bg-gray-900 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1">
                    {d.icon}
                    <span>{d.label}</span>
                  </span>
                  {difficulty === d.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode Cards (4 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Competitive Draft Mode Card */}
          <div
            onClick={() => handleSelectMode('draft')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'draft'
                ? 'bg-gradient-to-b from-cyan-950/80 to-gray-900 border-cyan-500 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-900/30'
                : 'bg-gray-950/80 border-gray-800 hover:border-cyan-800/80 hover:bg-gray-900/90'
            }`}
          >
            {gameMode === 'draft' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-cyan-500 text-gray-950 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-lg bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-2 group-hover:scale-105 transition-transform">
                <Swords className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Draft Mode</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                7-round A&R battle against AI from the same 5-card pool.
              </p>
            </div>
            <button className={`w-full py-2 rounded-lg text-xs font-bold transition ${gameMode === 'draft' ? 'bg-cyan-500 text-gray-950 shadow-md' : 'bg-gray-800 text-gray-300 group-hover:bg-cyan-900 group-hover:text-white'}`}>
              Select Draft Mode
            </button>
          </div>

          {/* $15 Aux Budget Card */}
          <div
            onClick={() => handleSelectMode('budget')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'budget'
                ? 'bg-gradient-to-b from-emerald-950/80 to-gray-900 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-900/30'
                : 'bg-gray-950/80 border-gray-800 hover:border-emerald-800/80 hover:bg-gray-900/90'
            }`}
          >
            {gameMode === 'budget' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500 text-gray-950 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-2 group-hover:scale-105 transition-transform">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">$15 Aux Budget</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                Build a 5-track project with $15. Cards cost $1 to $5. High ROI required!
              </p>
            </div>
            <button className={`w-full py-2 rounded-lg text-xs font-bold transition ${gameMode === 'budget' ? 'bg-emerald-500 text-gray-950 shadow-md' : 'bg-gray-800 text-gray-300 group-hover:bg-emerald-900 group-hover:text-white'}`}>
              Start $15 Budget
            </button>
          </div>

          {/* Quick EP Mode Card */}
          <div
            onClick={() => handleSelectMode('ep')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'ep'
                ? 'bg-gradient-to-b from-purple-950/80 to-gray-900 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-900/30'
                : 'bg-gray-950/80 border-gray-800 hover:border-purple-800/80 hover:bg-gray-900/90'
            }`}
          >
            {gameMode === 'ep' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-lg bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-2 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">EP Builder</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                Shape a focused 7-track project with a clear opener, turn, and outro.
              </p>
            </div>
            <button className={`w-full py-2 rounded-lg text-xs font-bold transition ${gameMode === 'ep' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 group-hover:bg-purple-900 group-hover:text-white'}`}>
              Start EP Builder
            </button>
          </div>

          {/* Full Album Mode Card */}
          <div
            onClick={() => handleSelectMode('album')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
              gameMode === 'album'
                ? 'bg-gradient-to-b from-pink-950/80 to-gray-900 border-pink-500 ring-2 ring-pink-500/50 shadow-lg shadow-pink-900/30'
                : 'bg-gray-950/80 border-gray-800 hover:border-pink-800/80 hover:bg-gray-900/90'
            }`}
          >
            {gameMode === 'album' && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-pink-500 text-white rounded-full text-[10px] font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            )}
            <div>
              <div className="w-9 h-9 rounded-lg bg-pink-900/50 border border-pink-500/30 flex items-center justify-center text-pink-300 mb-2 group-hover:scale-105 transition-transform">
                <Disc className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Album Builder</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                Full 14-track, three-act album with act pacing and deliberate closing.
              </p>
            </div>
            <button className={`w-full py-2 rounded-lg text-xs font-bold transition ${gameMode === 'album' ? 'bg-pink-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 group-hover:bg-pink-900 group-hover:text-white'}`}>
              Start Album Builder
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-center text-[11px] text-emerald-200">
          EP and Album builds save automatically on this device. Leave and return to resume the current tracklist before review.
        </div>
      </div>
    </div>
  );
};
