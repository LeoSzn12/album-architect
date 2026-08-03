'use client';

import React, { useState } from 'react';
import { useDraftStore } from '@/store/useDraftStore';
import { useModalA11y } from '@/hooks/useModalA11y';
import { generateChallengeSeed } from '@/lib/seededRandom';
import { playDraftLockSound } from '@/lib/audioEngine';
import {
  Users,
  Swords,
  Copy,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Trophy,
  Play,
  RotateCcw,
} from 'lucide-react';
import { VersusMatchup } from '@/types/draft';

interface PlayAgainstFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayAgainstFriendsModal: React.FC<PlayAgainstFriendsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    draftSeed,
    setDraftSeed,
    startNewDraft,
    playerAlias,
    setPlayerAlias,
    evaluationResult,
    gameMode,
    difficulty,
    selectedEra,
    draftedTracks,
    versusMatchup,
    setVersusMatchup,
    audioEnabled,
  } = useDraftStore();

  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen,
    onClose,
  });

  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'versus'>('create');
  const [inputSeed, setInputSeed] = useState('');
  const [inputMatchupCode, setInputMatchupCode] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [generatedSeed, setGeneratedSeed] = useState(() => generateChallengeSeed());

  if (!isOpen) return null;

  const challengeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?seed=${generatedSeed}&mode=${gameMode}&diff=${difficulty}&era=${selectedEra}`
    : `https://album-architect.vercel.app/?seed=${generatedSeed}&mode=${gameMode}&diff=${difficulty}&era=${selectedEra}`;

  const handleCreateAndStart = () => {
    playDraftLockSound(audioEnabled);
    // Pass seed directly to startNewDraft — do NOT also call setDraftSeed,
    // which would trigger a second startNewDraft internally. Audit H1.
    startNewDraft(gameMode, selectedEra, difficulty, generatedSeed);
    onClose();
  };


  const handleJoinSeed = (seedToJoin: string) => {
    const cleanSeed = seedToJoin.trim().toUpperCase();
    if (!cleanSeed) return;
    playDraftLockSound(audioEnabled);
    setDraftSeed(cleanSeed);
    startNewDraft(gameMode, undefined, difficulty, cleanSeed);
    onClose();
  };

  const handleCopyLink = () => {
    playDraftLockSound(audioEnabled);
    navigator.clipboard.writeText(challengeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Generate short 1v1 Result Matchup Code for current completed draft
  const generateMatchupShareCode = (): string => {
    if (!evaluationResult) return '';
    const payload = {
      alias: playerAlias,
      score: evaluationResult.overallScore,
      grade: evaluationResult.gradeBadge,
      sub: evaluationResult.subScores,
      seed: draftSeed || 'FREE',
      mode: gameMode,
      diff: difficulty,
      topTitle: draftedTracks[0]?.song.title || 'Opener',
      topArtist: draftedTracks[0]?.song.artist || 'Artist',
    };
    try {
      return btoa(JSON.stringify(payload));
    } catch {
      return '';
    }
  };

  const handleCopyMatchupCode = () => {
    const code = generateMatchupShareCode();
    if (!code) return;
    playDraftLockSound(audioEnabled);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleImportMatchupCode = () => {
    try {
      const rawJson = atob(inputMatchupCode.trim());
      const decoded = JSON.parse(rawJson);

      // Validate & sanitize decoded fields (H3 / M2)
      if (!decoded || typeof decoded !== 'object') {
        throw new Error('Invalid payload shape');
      }

      const clampNum = (val: unknown, min: number, max: number, fallback: number) => {
        if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
        return Math.min(max, Math.max(min, val));
      };

      const sanitizeString = (val: unknown, fallback: string, maxLen = 30) => {
        if (typeof val !== 'string') return fallback;
        const cleaned = val.replace(/[<>]/g, '').trim();
        return cleaned.substring(0, maxLen) || fallback;
      };

      const rawScore = decoded.score;
      if (typeof rawScore !== 'number' || !Number.isFinite(rawScore) || rawScore < 0 || rawScore > 10) {
        alert('Invalid score value in matchup code (must be 0-10).');
        return;
      }

      const rawSub = decoded.sub || {};
      // Support both old (pacing/synergy/starPower) and new (slotFit/albumFlow/impact) shapes
      const matchup: VersusMatchup = {
        challengerAlias: sanitizeString(decoded.alias, 'Executive Opponent', 24),
        challengerScore: Math.round(rawScore * 10) / 10,
        challengerGrade: sanitizeString(decoded.grade, 'Gold Solid', 20),
        challengerSubScores: {
          slotFit:   clampNum(rawSub.slotFit   ?? rawSub.pacing,    0, 10, 7.5),
          albumFlow: clampNum(rawSub.albumFlow  ?? rawSub.synergy,   0, 10, 7.5),
          cohesion:  clampNum(rawSub.cohesion,                       0, 10, 7.5),
          impact:    clampNum(rawSub.impact     ?? rawSub.starPower, 0, 10, 7.5),
        },
        seed: sanitizeString(decoded.seed, 'ARCH-1v1', 12),
        gameMode: decoded.mode === 'album' ? 'album' : decoded.mode === 'draft' ? 'draft' : 'ep',
        difficulty:
          decoded.diff === 'veteran' || decoded.diff === 'hardcore'
            ? decoded.diff
            : 'standard',
        topTrackTitle: sanitizeString(decoded.topTitle, 'Opener Track', 40),
        topTrackArtist: sanitizeString(decoded.topArtist, 'Various Artists', 40),
      };

      playDraftLockSound(audioEnabled);
      setVersusMatchup(matchup);
      setActiveTab('versus');
    } catch {
      alert('Invalid matchup code! Please paste a valid 1v1 share code from a friend.');
    }
  };

  // Compute 1v1 Winner if versusMatchup is present
  const myScore = evaluationResult?.overallScore || 0;
  const friendScore = versusMatchup?.challengerScore || 0;
  const isWinner = myScore > friendScore;
  const isTie = myScore === friendScore;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="bg-gray-900 border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-6"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-pink-400" />
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
                1v1 Head-to-Head Mode
              </span>
              <h2 className="text-2xl font-extrabold text-white">Play Against Friends</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Alias Input */}
        <div className="bg-gray-950/80 p-3.5 rounded-2xl border border-purple-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" /> Your Executive Alias:
          </label>
          <input
            type="text"
            value={playerAlias}
            onChange={(e) => setPlayerAlias(e.target.value)}
            placeholder="Enter your handle..."
            maxLength={24}
            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs font-extrabold text-white focus:outline-none focus:border-purple-500 w-full sm:w-60"
          />
        </div>

        {/* Nav Tabs: Create / Join / 1v1 Matchup */}
        <div className="flex border-b border-gray-800 bg-gray-950 p-1.5 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create 1v1 Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Join Seed Code</span>
          </button>

          <button
            onClick={() => setActiveTab('versus')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'versus'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>1v1 Matchup Card</span>
          </button>
        </div>

        {/* Tab 1: Create Challenge */}
        {activeTab === 'create' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-300">Generated Matched Seed Code:</span>
                <button
                  onClick={() => setGeneratedSeed(generateChallengeSeed())}
                  className="text-[11px] font-bold text-pink-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> New Seed
                </button>
              </div>

              <div className="flex items-center justify-between bg-gray-950 p-3 rounded-xl border border-purple-700/60 font-mono text-xl font-black text-amber-300 tracking-wider">
                <span>{generatedSeed}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white font-sans text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                </button>
              </div>

              <p className="text-[11px] text-purple-200 leading-relaxed">
                Send this link or seed to a friend. Under seed <strong>{generatedSeed}</strong>, both players receive identical candidate choices every round for a 100% fair sequencing battle!
              </p>
            </div>

            <button
              onClick={handleCreateAndStart}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:opacity-95 text-white font-black rounded-xl shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Matched Draft With Seed {generatedSeed}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Join Seed Code */}
        {activeTab === 'join' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-300">
                Enter Friend&apos;s Challenge Seed Code or URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSeed}
                  onChange={(e) => setInputSeed(e.target.value)}
                  placeholder="e.g. ARCH-7X9K or paste full URL..."
                  className="flex-1 px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs font-bold text-white uppercase focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => {
                    let seedToUse = inputSeed.trim();
                    if (seedToUse.includes('seed=')) {
                      const match = seedToUse.match(/seed=([a-zA-Z0-9-]+)/);
                      if (match?.[1]) seedToUse = match[1];
                    }
                    handleJoinSeed(seedToUse);
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs transition cursor-pointer"
                >
                  Join Draft
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Joining a seed sets your round candidate pools to match your friend&apos;s exact draft candidates.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: 1v1 Versus Matchup Card */}
        {activeTab === 'versus' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Share My Code Section */}
            {evaluationResult && (
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-purple-300 block">
                    Share Your Score Matchup Code with Friend:
                  </span>
                  <span className="text-xs font-extrabold text-white">
                    Score: {evaluationResult.overallScore.toFixed(1)} / 10 ({evaluationResult.gradeBadge})
                  </span>
                </div>
                <button
                  onClick={handleCopyMatchupCode}
                  className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer flex-shrink-0"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Code Copied!' : 'Copy Result Code'}</span>
                </button>
              </div>
            )}

            {/* Paste Friend Code Input */}
            <div className="p-3.5 rounded-2xl bg-gray-950 border border-gray-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-300">
                Paste Friend&apos;s Result Matchup Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMatchupCode}
                  onChange={(e) => setInputMatchupCode(e.target.value)}
                  placeholder="Paste base64 matchup code here..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleImportMatchupCode}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Compare 1v1
                </button>
              </div>
            </div>

            {/* Side-by-Side 1v1 Scorecard */}
            {versusMatchup && evaluationResult ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-950 via-purple-950/60 to-gray-950 border border-purple-500/50 shadow-2xl flex flex-col gap-4">
                <div className="text-center pb-3 border-b border-gray-800">
                  <span className="px-3 py-1 rounded-full bg-purple-900 text-purple-200 text-[10px] font-black uppercase tracking-widest border border-purple-700">
                    1v1 Matchup: {versusMatchup.seed} ({versusMatchup.gameMode.toUpperCase()})
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">
                    {isWinner ? (
                      <span className="text-amber-300 flex items-center justify-center gap-1.5">
                        <Trophy className="w-5 h-5" /> VICTORY! You Beat {versusMatchup.challengerAlias}!
                      </span>
                    ) : isTie ? (
                      <span className="text-purple-300">DRAW! Perfect Tie Matchup</span>
                    ) : (
                      <span className="text-pink-400">
                        {versusMatchup.challengerAlias} Took The Crown!
                      </span>
                    )}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  {/* Player Score Column */}
                  <div className="p-3.5 rounded-xl bg-purple-950/60 border border-purple-700/60">
                    <span className="text-xs font-extrabold text-purple-300 block truncate">
                      {playerAlias} (You)
                    </span>
                    <span className="text-3xl font-black text-white block mt-1">
                      {myScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-purple-300 block">
                      {evaluationResult.gradeBadge}
                    </span>
                  </div>

                  {/* Friend Score Column */}
                  <div className="p-3.5 rounded-xl bg-pink-950/60 border border-pink-700/60">
                    <span className="text-xs font-extrabold text-pink-300 block truncate">
                      {versusMatchup.challengerAlias}
                    </span>
                    <span className="text-3xl font-black text-white block mt-1">
                      {friendScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-pink-300 block">
                      {versusMatchup.challengerGrade}
                    </span>
                  </div>
                </div>

                {/* Sub-scores comparison table */}
                <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 text-xs space-y-2">
                  <div className="flex justify-between text-gray-400 text-[10px] font-bold uppercase pb-1 border-b border-gray-800">
                    <span>Category</span>
                    <span>You</span>
                    <span>{versusMatchup.challengerAlias}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Slot Fit</span>
                    <span className="font-bold text-purple-300">{evaluationResult.subScores.slotFit.toFixed(1)}</span>
                    <span className="font-bold text-pink-300">{versusMatchup.challengerSubScores.slotFit.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Album Flow</span>
                    <span className="font-bold text-purple-300">{evaluationResult.subScores.albumFlow.toFixed(1)}</span>
                    <span className="font-bold text-pink-300">{versusMatchup.challengerSubScores.albumFlow.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Cohesion</span>
                    <span className="font-bold text-purple-300">{evaluationResult.subScores.cohesion.toFixed(1)}</span>
                    <span className="font-bold text-pink-300">{versusMatchup.challengerSubScores.cohesion.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">Impact</span>
                    <span className="font-bold text-purple-300">{evaluationResult.subScores.impact.toFixed(1)}</span>
                    <span className="font-bold text-pink-300">{versusMatchup.challengerSubScores.impact.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ) : versusMatchup ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-xs text-amber-200 text-center">
                Matchup code loaded for <strong>{versusMatchup.challengerAlias}</strong> (Score: {versusMatchup.challengerScore.toFixed(1)}). Finish your current draft under seed <strong>{versusMatchup.seed}</strong> to unlock the side-by-side scorecard!
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
