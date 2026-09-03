'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Disc3,
  Flame,
  Music2,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  Zap,
  ArrowLeft,
  Gauge,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Share2,
  Dna,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  playAirhornSound,
  playTurntableScratchSound,
  playTurntableRewindSound,
  playCrowdCheerSound,
  playHoverSound,
} from '@/lib/audioEngine';
import { useDraftStore } from '@/store/useDraftStore';

interface HowToPlayPanelProps {
  onBackToDraft: () => void;
}

type GuideTab = 'quickstart' | 'scoring' | 'crowd' | 'modes' | 'personas';

export const HowToPlayPanel: React.FC<HowToPlayPanelProps> = ({ onBackToDraft }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart');
  const { audioEnabled } = useDraftStore();

  const handleTabChange = (tab: GuideTab) => {
    playHoverSound(audioEnabled);
    setActiveTab(tab);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Action Navigation Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-[#0e0e12]/90 border border-white/[0.08] backdrop-blur-2xl rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onBackToDraft();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Draft</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300">
            TrackDraft Official Rulebook
          </span>
        </div>

        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onBackToDraft();
          }}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-black text-xs shadow-xl active:scale-95 transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play Draft Now</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e0e12]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        {/* Subtle top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center shadow-xl shrink-0">
              <BookOpen className="w-7 h-7 text-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  How to Play TrackDraft
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300 text-[10px] font-black uppercase tracking-wider">
                  V2.0 Guide
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                Step into the shoes of an executive A&R and master DJ. Draft songs slot-by-slot, manage crowd hype in real-time, engineer seamless BPM transitions, and prove your taste to the AI critic.
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Guide Tabs (Apple Music segmented control style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-6 mt-6 border-t border-white/[0.06]">
          {[
            { id: 'quickstart', label: '1. Quick Start', icon: Zap },
            { id: 'scoring', label: '2. Scoring & Synergy', icon: Gauge },
            { id: 'crowd', label: '3. Crowd & Soundboard', icon: Flame },
            { id: 'modes', label: '4. Game Modes & 1v1', icon: Swords },
            { id: 'personas', label: '5. Curator DNA', icon: Dna },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as GuideTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-lg font-extrabold'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* TAB 1: QUICK START */}
      {activeTab === 'quickstart' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* The 4-Step Core Loop */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Slot Archetype',
                tag: 'Target The Role',
                desc: 'Every round dictates a specific sonic role: Cinematic Intro, Turn Up Anthem, Deep Cut, or Climax. Check the archetype requirements before picking.',
              },
              {
                step: '02',
                title: 'Inspect 5 Candidates',
                tag: 'Compare Stats',
                desc: 'Review BPM, Energy meter (1-10), Era tags, and A&R recommendation badges. Tap or hover over cards to preview live crowd reactions.',
              },
              {
                step: '03',
                title: 'Lock In Your Pick',
                tag: 'Build Momentum',
                desc: 'Select the song that best bridges from your previous track. Watch the live crowd react, sound off with DJ pads, and protect your streak.',
              },
              {
                step: '04',
                title: 'A&R Executive Review',
                tag: 'Verdict & Share',
                desc: 'Complete all rounds to receive your final score (0-100), Curator DNA title, and 1-tap Wordle-style emoji grid to challenge friends.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-between gap-3 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-white/30">{item.step}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-zinc-300">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Anatomy of a Candidate Card */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">Anatomy of a Candidate Card</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 max-w-2xl">
              Each candidate card provides essential musical intelligence designed to help you make professional curatorial decisions:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Mockup Card */}
              <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.12] shadow-2xl relative">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>A&R Top Pick</span>
                </div>

                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                    🎵
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Hip-Hop • 2015
                    </span>
                    <h4 className="text-base font-black text-white">Alright</h4>
                    <p className="text-xs text-zinc-300 font-semibold">Kendrick Lamar</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.08] mb-4 text-center">
                  <div className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block font-bold">TEMPO</span>
                    <span className="text-xs font-black text-white">110 BPM</span>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block font-bold">ENERGY</span>
                    <span className="text-xs font-black text-rose-400">8.5 / 10</span>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2 border border-white/[0.06]">
                    <span className="text-[10px] text-zinc-400 block font-bold">SYNERGY</span>
                    <span className="text-xs font-black text-emerald-400">+12 Hype</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Preview snippet available
                  </span>
                  <div className="px-4 py-2 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg">
                    Draft Track
                  </div>
                </div>
              </div>

              {/* Callouts */}
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <h4 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
                    <span>⚡ Tempo & BPM Delta</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Tracks within <strong className="text-white">±15 BPM</strong> of your previous pick earn high-synergy bonus points. Massive sudden shifts (e.g. 75 BPM to 140 BPM) risk stalling crowd momentum unless placed deliberately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <h4 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
                    <span>🔥 Energy Progression</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    From 1 (ambient/mellow) to 10 (festival trap banger). Great projects craft an emotional journey: building energy into the peak, cooling down for introspection, and culminating in a grand finale.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <h4 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
                    <span>👑 Lead Artist vs Featured Guests</span>
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Only <strong className="text-white">Primary/Lead artists</strong> count toward the 2-artist safety limit. Featured collaborators (e.g. <em>feat. Drake</em>) do NOT trigger the Monopoly Penalty, giving you creative tactical freedom!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCORING & SYNERGY */}
      {activeTab === 'scoring' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Weight Matrix */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">The 5 AI Critic Evaluation Dimensions</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              When your draft finishes, the AI Critic evaluates the overall narrative using weighted algorithmic criteria totaling 100%:
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">Live Crowd Reaction & Hype Meter</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6 max-w-2xl leading-relaxed">
              TrackDraft is an interactive stage. The crowd visualizer at the top of your draft board listens and reacts in real-time as you hover and draft songs.
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
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl backdrop-blur-2xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white font-black text-sm mb-4">
                  7
                </div>
                <h3 className="text-lg font-black text-white">Classic Draft Mode</h3>
                <p className="text-xs text-zinc-400 font-bold mt-1">7 Archetype Rounds</p>
                <p className="text-xs text-zinc-300 mt-3 leading-relaxed">
                  The quintessential TrackDraft challenge. Progress sequentially through 7 classic slots: Intro, Lead Single, Peak Banger, Left Turn, Emotional Core, Safe Bet, and Grand Outro.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-[11px] text-zinc-400">
                ⭐ Best for quick 3-minute rapid play sessions.
              </div>
            </div>

            {/* EP Builder */}
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl backdrop-blur-2xl">
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
            <div className="p-6 rounded-3xl bg-[#0e0e12]/85 border border-white/[0.08] flex flex-col justify-between shadow-xl backdrop-blur-2xl">
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 shadow-xl backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Swords className="w-6 h-6 text-zinc-300" />
              <h2 className="text-lg font-black text-white">1v1 Play Against Friends (Challenge Seeds)</h2>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl mb-4">
              TrackDraft uses a deterministic seed engine. When you challenge a friend or enter a shared seed code (e.g. <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-mono">NEON-9021</code>), both players receive the <strong className="text-white">exact same 5 song candidates in the exact same order for every round</strong>.
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-black text-white">The 6 Curator DNA Archetypes</h2>
            </div>
            <p className="text-xs text-zinc-400 mb-6">
              Our Curator DNA profiler analyzes your entire tracklist to uncover your signature musical identity:
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
          <div className="rounded-3xl border border-white/[0.08] bg-[#0e0e12]/85 p-6 sm:p-8 backdrop-blur-2xl">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <span>Executive Pro Tips for 90+ Scores</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">1. Respect the BPM Gradient</span>
                <p className="text-zinc-400 leading-relaxed">
                  Keep tempo differences between consecutive tracks within 10–15 BPM. If you need to make a drastic jump, use a bridging track with dynamic drum changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">2. Hoard Your Reroll Token</span>
                <p className="text-zinc-400 leading-relaxed">
                  You only have a limited number of reroll tokens. Save your reroll for the Climax or Outro round when you need a specific artist or tempo match to seal the win.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">3. Maximize Feature Exploits</span>
                <p className="text-zinc-400 leading-relaxed">
                  If you already drafted 2 tracks by Kendrick Lamar or Kanye West, look for tracks where they are a <strong className="text-white">featured guest</strong> instead of lead artist. Features bypass the monopoly rule!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="font-black text-white block mb-1">4. Share the Wordle Grid</span>
                <p className="text-zinc-400 leading-relaxed">
                  After receiving your scorecard, click the 1-Tap Copy Share Grid button. Paste it into your iMessage or Discord group chat to challenge your friends to beat your score on the same seed!
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
          <span>Ready? Jump Back into Draft Board</span>
        </button>
      </div>
    </div>
  );
};
