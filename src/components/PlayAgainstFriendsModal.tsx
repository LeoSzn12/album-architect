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
    slots,
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
  const [durableChallengeCode, setDurableChallengeCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const challengeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?seed=${generatedSeed}&mode=${gameMode}&diff=${difficulty}&era=${selectedEra}${durableChallengeCode ? `&challenge=${durableChallengeCode}` : ''}`
    : `https://album-architect.vercel.app/?seed=${generatedSeed}&mode=${gameMode}&diff=${difficulty}&era=${selectedEra}${durableChallengeCode ? `&challenge=${durableChallengeCode}` : ''}`;

  const handleCreateAndStart = async () => {
    playDraftLockSound(audioEnabled);
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: gameMode, trackCount: slots.length, alias: playerAlias, seed: generatedSeed }),
      });
      const body = await response.json() as { challenge?: { challenge_code?: string } };
      if (response.ok && body.challenge?.challenge_code) setDurableChallengeCode(body.challenge.challenge_code);
    } catch {
      // Guest/unenrolled users keep the deterministic seed flow.
    }
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
        className="bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col gap-6"
      >
        <div className="flex justify-between items-center pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Swords className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                1v1 Head-to-Head Mode
              </span>
              <h2 className="text-2xl font-black text-white">Play Against Friends</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Alias Input */}
        <div className="bg-white/[0.03] p-3.5 rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-zinc-400" /> Your Executive Alias:
          </label>
          <input
            type="text"
            value={playerAlias}
            onChange={(e) => setPlayerAlias(e.target.value)}
            placeholder="Enter your handle..."
            maxLength={24}
            className="px-3.5 py-2 bg-black/50 border border-white/[0.12] rounded-xl text-xs font-extrabold text-white focus:outline-none focus:border-rose-500 w-full sm:w-60 transition"
          />
        </div>

        {/* Nav Tabs: Create / Join / 1v1 Matchup */}
        <div className="flex border border-white/[0.08] bg-[#09090c] p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create 1v1 Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Join Seed Code</span>
          </button>

          <button
            onClick={() => setActiveTab('versus')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'versus'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>1v1 Matchup Card</span>
          </button>
        </div>

        {/* Tab 1: Create Challenge */}
        {activeTab === 'create' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#121216]/85 border border-white/[0.08] flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300">Generated Matched Seed Code:</span>
                <button
                  onClick={() => setGeneratedSeed(generateChallengeSeed())}
                  className="text-[11px] font-bold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> New Seed
                </button>
              </div>

              <div className="flex items-center justify-between bg-black/60 p-3 rounded-xl border border-white/[0.08] font-mono text-xl font-black text-white tracking-wider">
                <span>{generatedSeed}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-white font-sans text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Share Link'}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Send this link or seed to a friend. Under seed <strong>{generatedSeed}</strong>, both players receive identical candidate choices every round for a 100% fair sequencing battle!
              </p>
            </div>

            <button
              onClick={handleCreateAndStart}
              className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black font-black rounded-full shadow-xl flex items-center justify-center gap-2 text-sm cursor-pointer transition active:scale-95"
            >
              <Play className="w-4 h-4 fill-current text-rose-500" />
              <span>Start Matched Draft With Seed {generatedSeed}</span>
            </button>
          </div>
        )}

        {/* Tab 2: Join Seed Code */}
        {activeTab === 'join' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#121216]/85 border border-white/[0.08] flex flex-col gap-3">
              <label className="text-xs font-bold text-zinc-300">
                Enter Friend&apos;s Challenge Seed Code or URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputSeed}
                  onChange={(e) => setInputSeed(e.target.value)}
                  placeholder="e.g. ARCH-7X9K or paste full URL..."
                  className="flex-1 px-3 py-2.5 bg-black/60 border border-white/[0.1] rounded-xl text-xs font-bold text-white uppercase focus:outline-none focus:border-rose-500"
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
                  className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-black rounded-xl text-xs transition cursor-pointer active:scale-95"
                >
                  Join Draft
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
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
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 block">
                    Share Your Score Matchup Code with Friend:
                  </span>
                  <span className="text-xs font-extrabold text-white">
                    Score: {evaluationResult.overallScore.toFixed(1)} / 10 ({evaluationResult.gradeBadge})
                  </span>
                </div>
                <button
                  onClick={handleCopyMatchupCode}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs rounded-full flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 active:scale-95 shadow-md"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Code Copied!' : 'Copy Result Code'}</span>
                </button>
              </div>
            )}

            {/* Paste Friend Code Input */}
            <div className="p-3.5 rounded-2xl bg-[#121216]/85 border border-white/[0.08] flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-300">
                Paste Friend&apos;s Result Matchup Code:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMatchupCode}
                  onChange={(e) => setInputMatchupCode(e.target.value)}
                  placeholder="Paste base64 matchup code here..."
                  className="flex-1 px-3 py-2 bg-black/60 border border-white/[0.1] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleImportMatchupCode}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
                >
                  Compare 1v1
                </button>
              </div>
            </div>

            {/* Side-by-Side 1v1 Scorecard */}
            {versusMatchup && evaluationResult ? (
              <div className="p-5 rounded-2xl bg-[#121216]/90 border border-white/[0.08] shadow-2xl flex flex-col gap-4">
                <div className="text-center pb-3 border-b border-white/[0.08]">
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] text-zinc-300 text-[10px] font-black uppercase tracking-widest border border-white/[0.08]">
                    1v1 Matchup: {versusMatchup.seed} ({versusMatchup.gameMode.toUpperCase()})
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">
                    {isWinner ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                        <Trophy className="w-5 h-5 text-amber-400" /> VICTORY! You Beat {versusMatchup.challengerAlias}!
                      </span>
                    ) : isTie ? (
                      <span className="text-zinc-200">DRAW! Perfect Tie Matchup</span>
                    ) : (
                      <span className="text-rose-400">
                        {versusMatchup.challengerAlias} Took The Crown!
                      </span>
                    )}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  {/* Player Score Column */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-xs font-extrabold text-zinc-400 block truncate">
                      {playerAlias} (You)
                    </span>
                    <span className="text-3xl font-black text-white block mt-1">
                      {myScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 block">
                      {evaluationResult.gradeBadge}
                    </span>
                  </div>

                  {/* Friend Score Column */}
                  <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="text-xs font-extrabold text-zinc-400 block truncate">
                      {versusMatchup.challengerAlias}
                    </span>
                    <span className="text-3xl font-black text-white block mt-1">
                      {friendScore.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 block">
                      {versusMatchup.challengerGrade}
                    </span>
                  </div>
                </div>

                {/* Sub-scores comparison table */}
                <div className="bg-black/40 rounded-xl p-3 border border-white/[0.06] text-xs space-y-2">
                  <div className="flex justify-between text-zinc-500 text-[10px] font-bold uppercase pb-1 border-b border-white/[0.06]">
                    <span>Category</span>
                    <span>You</span>
                    <span>{versusMatchup.challengerAlias}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Slot Fit</span>
                    <span className="font-bold text-white">{evaluationResult.subScores.slotFit.toFixed(1)}</span>
                    <span className="font-bold text-zinc-300">{versusMatchup.challengerSubScores.slotFit.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Album Flow</span>
                    <span className="font-bold text-white">{evaluationResult.subScores.albumFlow.toFixed(1)}</span>
                    <span className="font-bold text-zinc-300">{versusMatchup.challengerSubScores.albumFlow.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cohesion</span>
                    <span className="font-bold text-white">{evaluationResult.subScores.cohesion.toFixed(1)}</span>
                    <span className="font-bold text-zinc-300">{versusMatchup.challengerSubScores.cohesion.toFixed(1)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-400">Impact</span>
                    <span className="font-bold text-white">{evaluationResult.subScores.impact.toFixed(1)}</span>
                    <span className="font-bold text-zinc-300">{versusMatchup.challengerSubScores.impact.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ) : versusMatchup ? (
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 text-center">
                Matchup code loaded for <strong>{versusMatchup.challengerAlias}</strong> (Score: {versusMatchup.challengerScore.toFixed(1)}). Finish your current draft under seed <strong>{versusMatchup.seed}</strong> to unlock the side-by-side scorecard!
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
