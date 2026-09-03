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
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-gray-950/80 border border-gray-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onBackToDraft();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-purple-300 font-extrabold text-xs transition active:scale-95 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Draft</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            TrackDraft Official Rulebook
          </span>
        </div>

        <button
          onClick={() => {
            playHoverSound(audioEnabled);
            onBackToDraft();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-xs shadow-lg shadow-purple-950/50 hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Play Draft Now</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-gray-950 to-pink-950/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-900/40 border border-purple-300/30 shrink-0">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  How to Play TrackDraft
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  V2.0 Guide
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Step into the shoes of an executive A&R and master DJ. Draft songs slot-by-slot, manage crowd hype in real-time, engineer seamless BPM transitions, and prove your taste to the AI critic.
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Guide Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-6 mt-6 border-t border-gray-800/80">
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
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 border border-purple-300/40'
                    : 'bg-gray-900/80 hover:bg-gray-800/80 text-gray-400 hover:text-gray-200 border border-gray-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-purple-400'}`} />
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
                gradient: 'from-purple-950/60 to-purple-900/20 border-purple-700/50 text-purple-300',
              },
              {
                step: '02',
                title: 'Inspect 5 Candidates',
                tag: 'Compare Stats',
                desc: 'Review BPM, Energy meter (1-10), Era tags, and A&R recommendation badges. Tap or hover over cards to preview live crowd reactions.',
                gradient: 'from-pink-950/60 to-pink-900/20 border-pink-700/50 text-pink-300',
              },
              {
                step: '03',
                title: 'Lock In Your Pick',
                tag: 'Build Momentum',
                desc: 'Select the song that best bridges from your previous track. Watch the live crowd react, sound off with DJ pads, and protect your streak.',
                gradient: 'from-cyan-950/60 to-cyan-900/20 border-cyan-700/50 text-cyan-300',
              },
              {
                step: '04',
                title: 'A&R Executive Review',
                tag: 'Verdict & Share',
                desc: 'Complete all rounds to receive your final score (0-100), Curator DNA title, and 1-tap Wordle-style emoji grid to challenge friends.',
                gradient: 'from-amber-950/60 to-amber-900/20 border-amber-700/50 text-amber-300',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`p-5 rounded-2xl bg-gradient-to-b ${item.gradient} border flex flex-col justify-between gap-3 shadow-lg`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-white/40">{item.step}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 border border-white/10">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Anatomy of a Candidate Card */}
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-black text-white">Anatomy of a Candidate Card</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6 max-w-2xl">
              Each candidate card provides essential musical intelligence designed to help you make professional curatorial decisions:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Mockup Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 via-gray-950 to-purple-950/40 border-2 border-purple-500/60 shadow-xl shadow-purple-950/40 relative">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>A&R Top Pick</span>
                </div>

                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-md shrink-0">
                    🎵
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                      Hip-Hop • 2015
                    </span>
                    <h4 className="text-base font-black text-white">Alright</h4>
                    <p className="text-xs text-gray-300 font-semibold">Kendrick Lamar</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-800 mb-4 text-center">
                  <div className="bg-gray-900/90 rounded-xl p-2 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block font-bold">TEMPO</span>
                    <span className="text-xs font-black text-cyan-300">110 BPM</span>
                  </div>
                  <div className="bg-gray-900/90 rounded-xl p-2 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block font-bold">ENERGY</span>
                    <span className="text-xs font-black text-pink-400">8.5 / 10</span>
                  </div>
                  <div className="bg-gray-900/90 rounded-xl p-2 border border-gray-800">
                    <span className="text-[10px] text-gray-400 block font-bold">SYNERGY</span>
                    <span className="text-xs font-black text-emerald-400">+12 Hype</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">
                    Preview snippet available
                  </span>
                  <div className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-xs">
                    Draft Track
                  </div>
                </div>
              </div>

              {/* Callouts */}
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <h4 className="text-xs font-black text-cyan-300 mb-1 flex items-center gap-1.5">
                    <span>⚡ Tempo & BPM Delta</span>
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Tracks within <strong className="text-white">±15 BPM</strong> of your previous pick earn high-synergy bonus points. Massive sudden shifts (e.g. 75 BPM to 140 BPM) risk stalling crowd momentum unless placed deliberately.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <h4 className="text-xs font-black text-pink-300 mb-1 flex items-center gap-1.5">
                    <span>🔥 Energy Progression</span>
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    From 1 (ambient/mellow) to 10 (festival trap banger). Great projects craft an emotional journey: building energy into the peak, cooling down for introspection, and culminating in a grand finale.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-900/90 border border-gray-800">
                  <h4 className="text-xs font-black text-emerald-300 mb-1 flex items-center gap-1.5">
                    <span>👑 Lead Artist vs Featured Guests</span>
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed">
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
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-black text-white">The 5 AI Critic Evaluation Dimensions</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              When your draft finishes, the AI Critic evaluates the overall narrative using weighted algorithmic criteria totaling 100%:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  weight: '25%',
                  name: 'Sonic Synergy & Transitions',
                  icon: '🌊',
                  color: 'text-cyan-300 border-cyan-700/50 bg-cyan-950/30',
                  desc: 'Evaluates the acoustic flow between consecutive songs. Calculates tempo gradient, key harmonization, and seamless DJ mix potential.',
                },
                {
                  weight: '20%',
                  name: 'Theme & Archetype Fit',
                  icon: '🎯',
                  color: 'text-purple-300 border-purple-700/50 bg-purple-950/30',
                  desc: 'Measures how accurately each drafted track embodies its designated slot role (e.g. grand anthemic opening, introspective bridge, explosive peak).',
                },
                {
                  weight: '20%',
                  name: 'Energy Arc & Pacing',
                  icon: '⚡',
                  color: 'text-pink-300 border-pink-700/50 bg-pink-950/30',
                  desc: 'Penalizes flatlining playlists. Looks for dynamic narrative peaks, well-timed breathers, and satisfying emotional resolution.',
                },
                {
                  weight: '20%',
                  name: 'Boldness & Crate Digging',
                  icon: '💎',
                  color: 'text-amber-300 border-amber-700/50 bg-amber-950/30',
                  desc: 'Rewards drafting underground sleepers and unique deep cuts rather than relying exclusively on radio hits.',
                },
                {
                  weight: '15%',
                  name: 'Era & Style Cohesion',
                  icon: '✨',
                  color: 'text-emerald-300 border-emerald-700/50 bg-emerald-950/30',
                  desc: 'Tests whether your genre blends feel purposeful and timeless, bridging 90s boom-bap, 2000s classics, and modern production gracefully.',
                },
                {
                  weight: 'DEDUCTION',
                  name: 'Artist Monopoly Penalty',
                  icon: '⚠️',
                  color: 'text-red-300 border-red-700/50 bg-red-950/30',
                  desc: 'Drafting 3 or more songs by the same solo lead artist incurs harsh deductions. Keep your roster diverse to stay competitive!',
                },
              ].map((dim) => (
                <div key={dim.name} className={`p-4 rounded-2xl border ${dim.color} flex flex-col justify-between gap-3`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{dim.icon}</span>
                      <span className="px-2 py-0.5 rounded-full bg-black/50 text-[10px] font-black tracking-wider">
                        {dim.weight}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white">{dim.name}</h3>
                    <p className="text-xs text-gray-300 mt-2 leading-relaxed">{dim.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verdict Tiers */}
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-4">A&R Scorecard Verdict Tiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/60">
                <span className="text-2xl mb-1 block">🏆</span>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-widest">90 - 100 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">AUX PASS APPROVED 🔥</h4>
                <p className="text-[11px] text-gray-300 mt-1">Instant classic. Undeniable track sequencing ready for stadium festivals.</p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-700/60">
                <span className="text-2xl mb-1 block">✨</span>
                <span className="text-xs font-black text-cyan-300 uppercase tracking-widest">80 - 89 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">CERTIFIED SLAPPER</h4>
                <p className="text-[11px] text-gray-300 mt-1">Exceptional taste and flow. Minor transitions hold it back from hall of fame.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-700/60">
                <span className="text-2xl mb-1 block">🎵</span>
                <span className="text-xs font-black text-amber-300 uppercase tracking-widest">70 - 79 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">SOLID MIXTAPE</h4>
                <p className="text-[11px] text-gray-300 mt-1">Good individual tracks, but pacing or abrupt tempo changes stall the room.</p>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-700/60">
                <span className="text-2xl mb-1 block">🚫</span>
                <span className="text-xs font-black text-red-300 uppercase tracking-widest">&lt; 70 PTS</span>
                <h4 className="text-sm font-black text-white mt-1">AUX PRIVILEGES REVOKED</h4>
                <p className="text-[11px] text-gray-300 mt-1">Severe artist monopoly, jarring key clashes, or dead energy valleys.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CROWD & DJ SOUNDBOARD */}
      {activeTab === 'crowd' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Live Crowd Mechanics */}
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-black text-white">Live Crowd Reaction & Hype Meter</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6 max-w-2xl leading-relaxed">
              TrackDraft is an interactive stage. The crowd visualizer at the top of your draft board listens and reacts in real-time as you hover and draft songs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { range: '0% - 35%', mood: 'Dead / Lukewarm', emoji: '🥱', desc: 'The crowd is disengaged. Low energy tracks or jarring switches kill the vibe.' },
                { range: '36% - 65%', mood: 'Vibing & Moving', emoji: '🎶', desc: 'Solid head-nodding rhythm. Steady transitions keep the dancefloor occupied.' },
                { range: '66% - 84%', mood: 'Turned Up & Electric', emoji: '🔥', desc: 'Hands in the air. Stage lights flare and the room locks into your sonic groove.' },
                { range: '85% - 100%', mood: 'Legendary Hysteria', emoji: '🚀', desc: 'Confetti and lasers ignite. The crowd roars as peak anthems lock in.' },
              ].map((tier) => (
                <div key={tier.mood} className="p-4 rounded-2xl bg-gray-900 border border-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{tier.emoji}</span>
                    <span className="text-[10px] font-black text-purple-300">{tier.range}</span>
                  </div>
                  <h4 className="text-xs font-black text-white mt-1">{tier.mood}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">{tier.desc}</p>
                </div>
              ))}
            </div>

            {/* Live Interactive Soundboard Test Pad */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-gray-900 to-pink-950/50 border border-purple-800/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-white">Test The DJ Soundboard Live</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">Try clicking or press keys!</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => playAirhornSound(true)}
                  className="py-3 px-4 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-200 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span>📢 Airhorn</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-purple-300">H</kbd>
                </button>

                <button
                  onClick={() => playTurntableScratchSound(true)}
                  className="py-3 px-4 rounded-xl bg-pink-900/40 hover:bg-pink-800/60 border border-pink-500/50 text-pink-200 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span>💽 Scratch</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-pink-300">S</kbd>
                </button>

                <button
                  onClick={() => playTurntableRewindSound(true)}
                  className="py-3 px-4 rounded-xl bg-cyan-900/40 hover:bg-cyan-800/60 border border-cyan-500/50 text-cyan-200 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span>⏪ Rewind</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-cyan-300">P</kbd>
                </button>

                <button
                  onClick={() => playCrowdCheerSound(true)}
                  className="py-3 px-4 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/50 text-amber-200 font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer shadow-md"
                >
                  <span>🙌 Roar</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] font-mono text-amber-300">A</kbd>
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
            <div className="p-6 rounded-3xl bg-gray-950/80 border border-purple-800/60 flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/50 flex items-center justify-center text-purple-300 font-black text-sm mb-4">
                  7
                </div>
                <h3 className="text-lg font-black text-white">Classic Draft Mode</h3>
                <p className="text-xs text-purple-300 font-bold mt-1">7 Archetype Rounds</p>
                <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                  The quintessential TrackDraft challenge. Progress sequentially through 7 classic slots: Intro, Lead Single, Peak Banger, Left Turn, Emotional Core, Safe Bet, and Grand Outro.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-400">
                ⭐ Best for quick 3-minute rapid play sessions.
              </div>
            </div>

            {/* EP Builder */}
            <div className="p-6 rounded-3xl bg-gray-950/80 border border-pink-800/60 flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-pink-900/50 border border-pink-500/50 flex items-center justify-center text-pink-300 font-black text-sm mb-4">
                  6-7
                </div>
                <h3 className="text-lg font-black text-white">EP Builder</h3>
                <p className="text-xs text-pink-300 font-bold mt-1">Compact Cohesive Statement</p>
                <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                  Focus on thematic precision. Once you complete drafting, you enter the <strong className="text-white">Sequencer Studio</strong> where you can reorder your tracklist before submitting for review.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-400">
                ⭐ Full reordering support & local session autosave.
              </div>
            </div>

            {/* Album Builder */}
            <div className="p-6 rounded-3xl bg-gray-950/80 border border-cyan-800/60 flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-900/50 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-black text-sm mb-4">
                  12-14
                </div>
                <h3 className="text-lg font-black text-white">Album Builder</h3>
                <p className="text-xs text-cyan-300 font-bold mt-1">Full 3-Act Masterpiece</p>
                <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                  Curate a magnum opus spanning 3 narrative acts: <br />
                  • <strong>Act I</strong>: Exposition & Tone Setting <br />
                  • <strong>Act II</strong>: Conflict, Commercial Peak & Risks <br />
                  • <strong>Act III</strong>: Climax, Introspection & Finale
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-800 text-[11px] text-gray-400">
                ⭐ Deepest curatorial challenge with rich story arcs.
              </div>
            </div>
          </div>

          {/* 1v1 Battle Guide */}
          <div className="rounded-3xl border border-pink-700/40 bg-gradient-to-r from-pink-950/30 via-gray-950 to-purple-950/30 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <Swords className="w-6 h-6 text-pink-400" />
              <h2 className="text-lg font-black text-white">1v1 Play Against Friends (Challenge Seeds)</h2>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-3xl mb-4">
              TrackDraft uses a deterministic seed engine. When you challenge a friend or enter a shared seed code (e.g. <code className="px-1.5 py-0.5 rounded bg-black/60 text-pink-300 font-mono">NEON-9021</code>), both players receive the <strong className="text-white">exact same 5 song candidates in the exact same order for every round</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-black/40 border border-gray-800">
                <span className="font-black text-white block mb-1">1. Generate or Enter Seed</span>
                <p className="text-gray-400">Click the 1v1 button in the header or menu to create a match link or custom seed.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-gray-800">
                <span className="font-black text-white block mb-1">2. Draft Your Tracklist</span>
                <p className="text-gray-400">Pick from identical pools. Your sequencing strategy determines your score.</p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-gray-800">
                <span className="font-black text-white block mb-1">3. Compare & Share</span>
                <p className="text-gray-400">Copy the Wordle share grid with match code to see who proved superior A&R ears.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CURATOR PERSONAS & PRO STRATEGIES */}
      {activeTab === 'personas' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* The 6 DNA Personas */}
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white">The 6 Curator DNA Archetypes</h2>
            </div>
            <p className="text-xs text-gray-400 mb-6">
              Our Curator DNA profiler analyzes your entire tracklist to uncover your signature musical identity:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: '⚡ The 808 Architect', color: 'border-yellow-700/50 bg-yellow-950/20 text-yellow-300', desc: 'Heavy sub-bass, club trap anthems, high-voltage energy, and relentless drops.' },
                { title: '👑 The Golden Era Purist', color: 'border-amber-700/50 bg-amber-950/20 text-amber-300', desc: 'Vintage boom-bap, lyrical wordplay, soulful chopped samples, and 90s/2000s classics.' },
                { title: '💎 Certified Crate Digger', color: 'border-emerald-700/50 bg-emerald-950/20 text-emerald-300', desc: 'Unearthing hidden value, overlooked B-sides, and sleeper tracks outside the mainstream.' },
                { title: '🌙 Late Night Cruise Specialist', color: 'border-purple-700/50 bg-purple-950/20 text-purple-300', desc: 'Nocturnal synths, silky R&B chords, introspective lyricism, and moody atmosphere.' },
                { title: '✨ The Renaissance A&R', color: 'border-pink-700/50 bg-pink-950/20 text-pink-300', desc: 'Perfect curatorial balance seamlessly blending disparate eras and styles with zero penalties.' },
                { title: '🎯 The Hitmaker Executive', color: 'border-cyan-700/50 bg-cyan-950/20 text-cyan-300', desc: 'Stadium singalongs, platinum anthems, undeniable hooks, and infectious crowd energy.' },
              ].map((persona) => (
                <div key={persona.title} className={`p-4 rounded-2xl border ${persona.color}`}>
                  <h4 className="text-xs font-black text-white">{persona.title}</h4>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">{persona.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="rounded-3xl border border-gray-800 bg-gray-950/80 p-6 sm:p-8">
            <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Executive Pro Tips for 90+ Scores</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <span className="font-black text-purple-300 block mb-1">1. Respect the BPM Gradient</span>
                <p className="text-gray-300 leading-relaxed">
                  Keep tempo differences between consecutive tracks within 10–15 BPM. If you need to make a drastic jump, use a bridging track with dynamic drum changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <span className="font-black text-pink-300 block mb-1">2. Hoard Your Reroll Token</span>
                <p className="text-gray-300 leading-relaxed">
                  You only have a limited number of reroll tokens. Save your reroll for the Climax or Outro round when you need a specific artist or tempo match to seal the win.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <span className="font-black text-cyan-300 block mb-1">3. Maximize Feature Exploits</span>
                <p className="text-gray-300 leading-relaxed">
                  If you already drafted 2 tracks by Kendrick Lamar or Kanye West, look for tracks where they are a <strong className="text-white">featured guest</strong> instead of lead artist. Features bypass the monopoly rule!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <span className="font-black text-amber-300 block mb-1">4. Share the Wordle Grid</span>
                <p className="text-gray-300 leading-relaxed">
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
          className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 text-white font-black text-sm shadow-xl shadow-purple-950/60 hover:scale-102 active:scale-98 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Ready? Jump Back into Draft Board</span>
        </button>
      </div>
    </div>
  );
};
