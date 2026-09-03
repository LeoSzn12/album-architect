'use client';

import React, { useState } from 'react';
import type { SharePayload } from '@/lib/sharePayload';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareCardProps {
  payload: SharePayload;
}

export function ShareCard({ payload }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyWordle = () => {
    const lines = [
      `🎧 TrackDraft: ${payload.projectTitle} (Curated by ${payload.creator})`,
      `Score: ${payload.score.toFixed(1)}/10 (${payload.grade}) · AUX PASS APPROVED 🔥`,
      '',
      'Top Picks:',
      ...payload.topTracks.map((t, idx) => `🟩 ${idx + 1}. ${t.title} - ${t.artist}`),
      '',
      `⚔️ Challenge Code: ${payload.challengeCode}`,
      'Can you beat my aux score?',
      typeof window !== 'undefined' ? window.location.href : 'https://trackdraft.app',
    ];

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <article className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e0e12]/95 shadow-2xl backdrop-blur-2xl">
      <div className="bg-[#121216]/90 border-b border-white/[0.08] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400">TrackDraft Result</p>
            <h1 className="mt-1.5 text-3xl font-black tracking-tight text-white sm:text-4xl">{payload.projectTitle}</h1>
            <p className="mt-1 text-sm text-zinc-400">Curated by {payload.creator}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-3 text-center shadow-sm">
            <div className="text-4xl font-black text-white">{payload.score.toFixed(1)}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-rose-400">{payload.grade} · /10</div>
          </div>
        </div>

        <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
          {payload.topTracks.map((track, index) => (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5 shadow-sm" key={`${track.title}-${track.artist}`}>
              <div className="text-xs font-black text-rose-400">0{index + 1}</div>
              <div className="mt-1 truncate font-bold text-white">{track.title}</div>
              <div className="truncate text-xs text-zinc-400">{track.artist}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Challenge Code</p>
            <p className="font-mono text-lg font-bold tracking-widest text-white">{payload.challengeCode}</p>
          </div>
          <div className="flex items-center gap-2">
            {payload.opponentScore !== undefined && (
              <p className="rounded-full bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 text-xs font-bold text-zinc-300">
                Opponent {payload.opponentScore.toFixed(1)} / 10
              </p>
            )}
            <button
              onClick={handleCopyWordle}
              className={`px-4 py-2 rounded-full font-bold text-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black font-extrabold'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Share Grid'}</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">Transparent Scorecard</h2>
          <div className="space-y-3.5">
            {payload.categories.map((category) => (
              <div key={category.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs font-bold">
                  <span className="truncate text-zinc-300">{category.label}</span>
                  <span className="text-white font-black">{category.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]" role="progressbar" aria-label={category.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.score}>
                  <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400" style={{ width: `${category.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
