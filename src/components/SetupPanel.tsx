'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Disc3, SlidersHorizontal, Sparkles, ArrowLeft } from 'lucide-react';
import { SONG_LIBRARY } from '@/data/songs';
import { providers } from '@/lib/providers';
import type { ProviderId } from '@/lib/providers/types';

export type SourceScope = 'all' | ProviderId;

export interface SetupPreferences {
  tasteTags: string[];
  sourceScope: SourceScope;
}

interface SetupPanelProps {
  initialTasteTags?: string[];
  initialSourceScope?: SourceScope;
  onPreferencesChange?: (preferences: SetupPreferences) => void;
  onContinue?: (preferences: SetupPreferences) => void;
  onBackToGame?: () => void;
}

const TAGS = ['Hip-Hop', 'R&B', 'High Energy', 'Cinematic', 'Lyrical', 'Experimental', 'Introspective', 'Club'];

export const SetupPanel: React.FC<SetupPanelProps> = ({
  initialTasteTags = [],
  initialSourceScope = 'all',
  onPreferencesChange,
  onContinue,
  onBackToGame,
}) => {
  const [tasteTags, setTasteTags] = useState(initialTasteTags);
  const [sourceScope, setSourceScope] = useState<SourceScope>(initialSourceScope);
  const catalogGenres = useMemo(() => new Set(SONG_LIBRARY.map((song) => song.genre)).size, []);
  const preferences = { tasteTags, sourceScope };

  const update = (next: Partial<SetupPreferences>) => {
    const updated = { ...preferences, ...next };
    if (next.tasteTags) setTasteTags(next.tasteTags);
    if (next.sourceScope) setSourceScope(next.sourceScope);
    onPreferencesChange?.(updated);
  };

  return (
    <section aria-labelledby="setup-panel-title" className="w-full max-w-5xl rounded-3xl border border-white/[0.08] bg-[#0e0e12]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
      {onBackToGame && (
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <button
            onClick={onBackToGame}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Draft Board</span>
          </button>
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Session Preferences</span>
        </div>
      )}
      <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-lg">
            <SlidersHorizontal className="h-5 w-5 text-rose-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-400">Session Setup</p>
            <h2 id="setup-panel-title" className="text-2xl font-black tracking-tight text-white">Tune the room before you draft</h2>
            <p className="mt-1 text-sm text-zinc-400">Shape the candidate pool without locking yourself into a genre.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 px-4 py-2.5 text-right text-[11px] text-zinc-400 shadow-sm">
          <span className="block font-black text-white">{SONG_LIBRARY.length} tracks</span>
          <span>{catalogGenres} catalog lanes</span>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.25fr_1fr]">
        <fieldset>
          <legend className="mb-3.5 flex items-center gap-2 text-sm font-extrabold text-zinc-200">
            <Sparkles className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Taste tags <span className="font-normal text-zinc-500">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const selected = tasteTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    update({
                      tasteTags: selected ? tasteTags.filter((item) => item !== tag) : [...tasteTags, tag],
                    })
                  }
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                    selected
                      ? 'border-rose-500/60 bg-rose-500/15 text-rose-300 shadow-sm'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {selected && <Check className="mr-1.5 inline h-3.5 w-3.5 text-rose-400" aria-hidden="true" />}
                  {tag}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            {tasteTags.length ? `${tasteTags.length} preferences active` : 'The full curated catalog stays in rotation.'}
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-3.5 flex items-center gap-2 text-sm font-extrabold text-zinc-200">
            <Disc3 className="h-4 w-4 text-rose-400" aria-hidden="true" />
            Catalog source
          </legend>
          <label className="relative block">
            <span className="sr-only">Choose catalog source</span>
            <select
              value={sourceScope}
              onChange={(event) => update({ sourceScope: event.target.value as SourceScope })}
              className="w-full appearance-none rounded-2xl border border-white/[0.08] bg-[#121216]/90 px-4 py-3 pr-10 text-sm font-bold text-zinc-200 outline-none transition focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30"
            >
              <option value="all">All available sources</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-zinc-500" aria-hidden="true" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Provider availability">
            {providers.map((provider) => (
              <span
                key={provider.id}
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${
                  provider.capabilities.search.enabled
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border-white/[0.08] bg-white/[0.04] text-zinc-500'
                }`}
              >
                {provider.name}: {provider.capabilities.search.enabled ? 'ready' : 'scaffolded'}
              </span>
            ))}
          </div>
          {sourceScope !== 'all' && (
            <button
              type="button"
              onClick={() => {
                window.location.assign(`/api/auth/provider/${sourceScope}/link`);
              }}
              className="mt-3 rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 text-xs font-bold text-zinc-200 transition active:scale-95"
            >
              Connect {providers.find((provider) => provider.id === sourceScope)?.name ?? sourceScope}
            </button>
          )}
        </fieldset>
      </div>

      {onContinue && (
        <button
          type="button"
          onClick={() => onContinue(preferences)}
          className="mt-8 w-full rounded-full bg-white hover:bg-zinc-200 px-6 py-3.5 text-sm font-extrabold text-black shadow-xl transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          Continue to library
        </button>
      )}
    </section>
  );
};
