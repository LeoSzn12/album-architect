'use client';

import React from 'react';
import { GameMode, DifficultyTier } from '@/types/draft';
import { useDraftStore } from '@/store/useDraftStore';
import { Zap, Disc, Check, X, ShieldAlert, Sparkles, Flame, EyeOff, Award, Swords } from 'lucide-react';
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
  const { gameMode, setGameMode, difficulty, setDifficulty, audioEnabled } = useDraftStore();

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

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-6"
      >
        {/* Glow backdrop decorative */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
              Executive Configuration
            </span>
            <h2 className="text-2xl font-extrabold text-white">Choose Format & Difficulty</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Competitive Draft Mode Card */}
          <div
            onClick={() => handleSelectMode('draft')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
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
              <div className="w-10 h-10 rounded-lg bg-cyan-900/50 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-105 transition-transform">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Draft Mode</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                The core seven-round A&R battle. You and the AI draft from the same five-card pool.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-300 mb-4">
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /><span>5 cards per round</span></li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /><span>Hidden AI pick + reveal</span></li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /><span>Winner and rematch ready</span></li>
              </ul>
            </div>
            <button className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${gameMode === 'draft' ? 'bg-cyan-500 text-gray-950 shadow-md' : 'bg-gray-800 text-gray-300 group-hover:bg-cyan-900 group-hover:text-white'}`}>
              Select Draft Mode
            </button>
          </div>

          {/* Quick EP Mode Card */}
          <div
            onClick={() => handleSelectMode('ep')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
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
              <div className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 mb-3 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Quick EP Draft</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Fast-paced 7-round curation sprint. Perfect for honing sequencing instincts across essential positional slots.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-300 mb-4">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>7 Positional Rounds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{difficulty === 'standard' ? '2 Reroll Tokens' : '1 Reroll Token'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Focused 7-Track EP Evaluation</span>
                </li>
              </ul>
            </div>
            <button
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                gameMode === 'ep'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-800 text-gray-300 group-hover:bg-purple-900 group-hover:text-white'
              }`}
            >
              Select EP Mode
            </button>
          </div>

          {/* Full Album Mode Card */}
          <div
            onClick={() => handleSelectMode('album')}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between relative group ${
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
              <div className="w-10 h-10 rounded-lg bg-pink-900/50 border border-pink-500/30 flex items-center justify-center text-pink-300 mb-3 group-hover:scale-105 transition-transform">
                <Disc className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Full LP Album Draft</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Master-level 14-round marathon. Craft multi-act narratives, handle interludes, and balance fatigue over a full project.
              </p>
              <ul className="space-y-1.5 text-xs text-gray-300 mb-4">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>14 Positional Rounds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>{difficulty === 'standard' ? '3 Reroll Tokens' : '1 Reroll Token'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                  <span>High Monopoly Risk & Fatigue Mechanics</span>
                </li>
              </ul>
            </div>
            <button
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition ${
                gameMode === 'album'
                  ? 'bg-pink-600 text-white shadow-md'
                  : 'bg-gray-800 text-gray-300 group-hover:bg-pink-900 group-hover:text-white'
              }`}
            >
              Select Full LP Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
