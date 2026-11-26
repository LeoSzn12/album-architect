'use client';

import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Swords,
  Volume2,
  Zap,
  ArrowLeft,
  Gauge,
  Play,
  Dna,
} from 'lucide-react';
import {
  playAirhornSound,
  playTurntableScratchSound,
  playTurntableRewindSound,
  playCrowdCheerSound,
  playHoverSound,
} from '@/lib/audioEngine';
import { useShallow } from 'zustand/react/shallow';
import { useDraftStore } from '@/store/useDraftStore';

interface HowToPlayPanelProps {
  onBackToDraft: () => void;
}

type GuideTab = 'quickstart' | 'scoring' | 'crowd' | 'modes' | 'personas';

export const HowToPlayPanel: React.FC<HowToPlayPanelProps> = ({ onBackToDraft }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart');
  const { audioEnabled } = useDraftStore(useShallow((s) => ({ audioEnabled: s.audioEnabled })));

  const handleTabChange = (tab: GuideTab) => {
    playHoverSound(audioEnabled);
    setActiveTab(tab);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 animate-fade-in pb-12 pt-2">
      {/* Header: back, title, tabs */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/90 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onBackToDraft();
            }}
            className="min-h-[44px] flex items-center gap-2 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back</span>
          </button>
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onBackToDraft();
            }}
            className="min-h-[44px] flex items-center gap-2 px-5 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-sm shadow-xl active:scale-95 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
            <span>Play</span>
          </button>
        </div>

        <h1 className="mt-5 text-3xl sm:text-4xl font-black text-white tracking-tight">How to play</h1>
        <p className="mt-1 text-sm text-zinc-400 max-w-xl leading-relaxed">
          Pick one song per round to build an album, then see how it sells in its first week. A full game takes about three minutes.
        </p>

        <div role="tablist" aria-label="Rules sections" className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-5 mt-5 border-t border-white/[0.06]">
          {[
            { id: 'quickstart', label: 'Basics', icon: Zap },
            { id: 'scoring', label: 'Scoring', icon: Gauge },
            { id: 'crowd', label: 'Crowd', icon: Flame },
            { id: 'modes', label: 'Formats and friends', icon: Swords },
            { id: 'personas', label: 'Your style', icon: Dna },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id as GuideTab)}
                className={`min-h-[44px] flex items-center gap-2 px-4 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BASICS */}
      {activeTab === 'quickstart' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Read the spot', desc: 'Each round asks for one kind of song, like an opener, a hit single or a closer, with an energy level to aim for.' },
              { title: 'Listen to five songs', desc: 'Tap a cover to hear a snippet. Fit and energy show how well each song suits the spot.' },
              { title: 'Pick one', desc: 'Tap Pick. Your rival picks too, and the crowd reacts. Undo if you change your mind.' },
              { title: 'Release it', desc: 'After the last round, see your first-week sales, your score out of 10 and your style. Send a friend the same songs to beat.' },
            ].map((item, i) => (
              <li key={item.title} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex gap-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-black text-sm font-black">{i + 1}</span>
                <div>
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-5 sm:p-6">
            <h2 className="text-lg font-black text-white mb-3">Three things that move your score</h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <li className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">Energy that flows</span>
                <span className="text-zinc-400 leading-relaxed">Build up to a peak, cool down, then finish big. Big jumps between songs cost you.</span>
              </li>
              <li className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">Not too much of one artist</span>
                <span className="text-zinc-400 leading-relaxed">A third song by the same lead artist costs points. The card warns you first.</span>
              </li>
              <li className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">Features are free</span>
                <span className="text-zinc-400 leading-relaxed">Only the lead artist counts. A song where they are featured doesn&apos;t add to their total.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: SCORING & SYNERGY */}
      {activeTab === 'scoring' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Weight Matrix */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">What your score is made of</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              When your draft finishes, the critics score your album out of 10 on these five things:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  weight: '25%',
                  name: 'Sonic Synergy & Transitions',
                  icon: '🌊',
                  color: 'text-zinc-200 border-white/[0.08] bg-white/[0.03]',
                  desc: 'Evaluates the acoustic flow between consecutive songs. Calculates tempo gradient, key harmonization, and seamless DJ mix potential.',
                },
                {
                  weight: '20%',
                  name: 'Theme & Archetype Fit',
                  icon: '🎯',
                  color: 'text-zinc-200 border-white/[0.08] bg-white/[0.03]',
                  desc: 'Measures how accurately each drafted track embodies its designated slot role (e.g. grand anthemic opening, introspective bridge, explosive peak).',
                },
                {
                  weight: '20%',
                  name: 'Energy Arc & Pacing',
                  icon: '⚡',
                  color: 'text-zinc-200 border-white/[0.08] bg-white/[0.03]',
                  desc: 'Penalizes flatlining playlists. Looks for dynamic narrative peaks, well-timed breathers, and satisfying emotional resolution.',
                },
                {
                  weight: '20%',
                  name: 'Boldness & Crate Digging',
                  icon: '💎',
                  color: 'text-zinc-200 border-white/[0.08] bg-white/[0.03]',
                  desc: 'Rewards drafting underground sleepers and unique deep cuts rather than relying exclusively on radio hits.',
                },
                {
                  weight: '15%',
                  name: 'Era & Style Cohesion',
                  icon: '✨',
                  color: 'text-zinc-200 border-white/[0.08] bg-white/[0.03]',
                  desc: 'Tests whether your genre blends feel purposeful and timeless, bridging 90s boom-bap, 2000s classics, and modern production gracefully.',
                },
                {
                  weight: 'DEDUCTION',
                  name: 'Artist Monopoly Penalty',
                  icon: '⚠️',
                  color: 'text-rose-300 border-rose-500/30 bg-rose-950/20',
                  desc: 'Drafting 3 or more songs by the same solo lead artist incurs harsh deductions. Keep your roster diverse to stay competitive!',
                },
              ].map((dim) => (
                <div key={dim.name} className={`p-4 rounded-2xl border ${dim.color} flex flex-col justify-between gap-3`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{dim.icon}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-black tracking-wider text-white">
                        {dim.weight}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white">{dim.name}</h3>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{dim.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict Tiers */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-4">A&R Scorecard Verdict Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40">
                <span className="text-2xl mb-1 block">🏆</span>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-widest">90 - 100 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">AUX PASS APPROVED 🔥</h4>
                <p className="text-[11px] text-zinc-300 mt-1">Instant classic. Undeniable track sequencing ready for stadium festivals.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.1]">
                <span className="text-2xl mb-1 block">✨</span>
                <span className="text-xs font-black text-white uppercase tracking-widest">80 - 89 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">CERTIFIED SLAPPER</h4>
                <p className="text-[11px] text-zinc-400 mt-1">Exceptional taste and flow. Minor transitions hold it back from hall of fame.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40">
                <span className="text-2xl mb-1 block">🎵</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest">70 - 79 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">SOLID MIXTAPE</h4>
                <p className="text-[11px] text-zinc-300 mt-1">Good individual tracks, but pacing or abrupt tempo changes stall the room.</p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40">
                <span className="text-2xl mb-1 block">🚫</span>
                <span className="text-xs font-black text-rose-300 uppercase tracking-widest">&lt; 70 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">AUX PRIVILEGES REVOKED</h4>
                <p className="text-[11px] text-zinc-300 mt-1">Severe artist monopoly, jarring key clashes, or dead energy valleys.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CROWD & DJ SOUNDBOARD */}
      {activeTab === 'crowd' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Live Crowd Mechanics */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">Live Crowd Reaction & Hype Meter</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 max-w-2xl leading-relaxed">
              First Week is an interactive stage. The crowd visualizer at the top of your draft board listens and reacts in real-time as you hover and draft songs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { range: '0% - 35%', mood: 'Dead / Lukewarm', emoji: '🥱', desc: 'The crowd is disengaged. Low energy tracks or jarring switches kill the vibe.' },
                { range: '36% - 65%', mood: 'Vibing & Moving', emoji: '🎶', desc: 'Solid head-nodding rhythm. Steady transitions keep the dancefloor occupied.' },
                { range: '66% - 84%', mood: 'Turned Up & Electric', emoji: '🔥', desc: 'Hands in the air. Stage lights flare and the room locks into your sonic groove.' },
                { range: '85% - 100%', mood: 'Legendary Hysteria', emoji: '🚀', desc: 'Confetti and lasers ignite. The crowd roars as peak anthems lock in.' },
              ].map((tier) => (
                <div key={tier.mood} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{tier.emoji}</span>
                    <span className="text-[10px] font-black text-zinc-400">{tier.range}</span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-1">{tier.mood}</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">{tier.desc}</p>
                </div>
              ))}
            </div>

            {/* Live Interactive Soundboard Test Pad */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-black text-white">Test The DJ Soundboard Live</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold">Try clicking or press keys</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => playAirhornSound(true)}
                  className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span className="text-rose-400">📢 Airhorn</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-400">H</kbd>
                </button>

                <button
                  onClick={() => playTurntableScratchSound(true)}
                  className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span className="text-zinc-300">💽 Scratch</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-400">S</kbd>
                </button>

                <button
                  onClick={() => playTurntableRewindSound(true)}
                  className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span className="text-amber-400">⏪ Rewind</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-400">P</kbd>
                </button>

                <button
                  onClick={() => playCrowdCheerSound(true)}
                  className="py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span className="text-emerald-400">🙌 Roar</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-zinc-400">A</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GAME MODES & 1V1 */}
      {activeTab === 'modes' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Draft Mode */}
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white font-black text-sm mb-4">
                  7
                </div>
                <h3 className="text-lg font-black text-white">Classic Draft Mode</h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">7 Archetype Rounds</p>
                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  The quintessential First Week challenge. Progress sequentially through 7 classic slots: Intro, Lead Single, Peak Banger, Left Turn, Emotional Core, Safe Bet, and Grand Outro.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-400">
                ⭐ Best for quick 3-minute rapid play sessions.
              </div>
            </div>

            {/* EP Builder */}
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white font-black text-sm mb-4">
                  6-7
                </div>
                <h3 className="text-lg font-black text-white">EP Builder</h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">Compact Cohesive Statement</p>
                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  Focus on thematic precision. Once you complete drafting, you enter the <strong className="text-white">Sequencer Studio</strong> where you can reorder your tracklist before submitting for review.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-400">
                ⭐ Full reordering support & local session autosave.
              </div>
            </div>

            {/* Album Builder */}
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white font-black text-sm mb-4">
                  12-14
                </div>
                <h3 className="text-lg font-black text-white">Album Builder</h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">Full 3-Act Masterpiece</p>
                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  Curate a magnum opus spanning 3 narrative acts: <br />
                  • <strong>Act I</strong>: Exposition & Tone Setting <br />
                  • <strong>Act II</strong>: Conflict, Commercial Peak & Risks <br />
                  • <strong>Act III</strong>: Climax, Introspection & Finale
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-400">
                ⭐ Deepest curatorial challenge with rich story arcs.
              </div>
            </div>
          </div>

          {/* 1v1 Battle Guide */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Swords className="w-6 h-6 text-zinc-300" />
              <h2 className="text-lg font-black text-white">1v1 Play Against Friends (Challenge Seeds)</h2>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl mb-4">
              When you challenge a friend or enter a shared seed code (e.g. <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">NEON-9021</code>), both players receive the <strong className="text-white">exact same 5 song candidates in the exact same order for every round</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">1. Generate or Enter Seed</span>
                <p className="text-zinc-400">Click the 1v1 button in the header or menu to create a match link or custom seed.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">2. Draft Your Tracklist</span>
                <p className="text-zinc-400">Pick from identical pools. Your sequencing strategy determines your score.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">3. Compare & Share</span>
                <p className="text-zinc-400">Copy the Wordle share grid with match code to see who proved superior A&R ears.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CURATOR PERSONAS & PRO STRATEGIES */}
      {activeTab === 'personas' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* The 6 DNA Personas */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">The 6 styles</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              Your whole tracklist decides which style you get:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: '⚡ The 808 Architect', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Heavy sub-bass, club trap anthems, high-voltage energy, and relentless drops.' },
                { title: '👑 The Golden Era Purist', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Vintage boom-bap, lyrical wordplay, soulful chopped samples, and 90s/2000s classics.' },
                { title: '💎 Certified Crate Digger', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Unearthing hidden value, overlooked B-sides, and sleeper tracks outside the mainstream.' },
                { title: '🌙 Late Night Cruise Specialist', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Nocturnal synths, silky R&B chords, introspective lyricism, and moody atmosphere.' },
                { title: '✨ The Renaissance A&R', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Perfect curatorial balance seamlessly blending disparate eras and styles with zero penalties.' },
                { title: '🎯 The Hitmaker Executive', color: 'border-white/[0.08] bg-white/[0.03] text-white', desc: 'Stadium singalongs, platinum anthems, undeniable hooks, and infectious crowd energy.' },
              ].map((persona) => (
                <div key={persona.title} className={`p-4 rounded-2xl border ${persona.color}`}>
                  <h4 className="text-xs font-black text-white">{persona.title}</h4>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{persona.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <span>Tips for a higher score</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">1. Respect the BPM Gradient</span>
                <p className="text-zinc-400 leading-relaxed">
                  Keep tempo differences between consecutive tracks within 10–15 BPM. If you need to make a drastic jump, use a bridging track with dynamic drum changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">2. Save your new-song swaps</span>
                <p className="text-zinc-400 leading-relaxed">
                  You only get a few. Keep one for the last rounds, when the right closer matters most.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">3. Use features</span>
                <p className="text-zinc-400 leading-relaxed">
                  If you already drafted 2 tracks by Kendrick Lamar or Kanye West, look for tracks where they are a <strong className="text-white">featured guest</strong> instead of lead artist. Features bypass the monopoly rule!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">4. Challenge a friend</span>
                <p className="text-zinc-400 leading-relaxed">
                  When your results show, tap Share. Your friend gets the same songs and has to beat your first week.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Play CTA */}
      <div className="w-full flex justify-center pt-4">
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onBackToDraft();
          }}
          className="flex items-center gap-3 px-8 py-4 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-sm shadow-2xl hover:scale-102 active:scale-98 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Play now</span>
        </button>
      </div>
    </div>
  );
};
