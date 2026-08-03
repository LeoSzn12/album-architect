'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Disc3, SlidersHorizontal, Sparkles } from 'lucide-react';
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
}

const TAGS = ['Hip-Hop', 'R&B', 'High Energy', 'Cinematic', 'Lyrical', 'Experimental', 'Introspective', 'Club'];

export const SetupPanel: React.FC<SetupPanelProps> = ({
  initialTasteTags = [],
  initialSourceScope = 'all',
  onPreferencesChange,
  onContinue,
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
    <section aria-labelledby="setup-panel-title" className="w-full max-w-5xl rounded-3xl border border-purple-500/30 bg-gray-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8">
      <div className="mb-7 flex flex-col gap-4 border-b border-gray-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-950/40">
            <SlidersHorizontal className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-pink-400">Session setup</p>
            <h2 id="setup-panel-title" className="text-2xl font-black tracking-tight text-white">Tune the room before you draft</h2>
            <p className="mt-1 text-sm text-gray-400">Shape the candidate pool without locking yourself into a genre.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/70 px-3 py-2 text-right text-[11px] text-gray-400">
          <span className="block font-black text-white">{SONG_LIBRARY.length} tracks</span>
          <span>{catalogGenres} catalog lanes</span>
        </div>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1.25fr_1fr]">
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-200"><Sparkles className="h-4 w-4 text-amber-300" aria-hidden="true" />Taste tags <span className="font-normal text-gray-500">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => {
              const selected = tasteTags.includes(tag);
              return <button key={tag} type="button" aria-pressed={selected} onClick={() => update({ tasteTags: selected ? tasteTags.filter((item) => item !== tag) : [...tasteTags, tag] })} className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${selected ? 'border-pink-500/80 bg-pink-950/60 text-pink-200' : 'border-gray-700 bg-gray-950 text-gray-400 hover:border-purple-500/70 hover:text-white'}`}>
                {selected && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />}{tag}
              </button>;
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">{tasteTags.length ? `${tasteTags.length} preferences active` : 'The full curated catalog stays in rotation.'}</p>
        </fieldset>

        <fieldset>
          <legend className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-200"><Disc3 className="h-4 w-4 text-cyan-300" aria-hidden="true" />Catalog source</legend>
          <label className="relative block">
            <span className="sr-only">Choose catalog source</span>
            <select value={sourceScope} onChange={(event) => update({ sourceScope: event.target.value as SourceScope })} className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 pr-9 text-sm font-bold text-gray-200 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30">
              <option value="all">All available sources</option>
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-gray-500" aria-hidden="true" />
          </label>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Provider availability">
            {providers.map((provider) => <span key={provider.id} className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-wide ${provider.capabilities.search.enabled ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300' : 'border-gray-700 bg-gray-950 text-gray-500'}`}>{provider.name}: {provider.capabilities.search.enabled ? 'ready' : 'scaffolded'}</span>)}
          </div>
          {sourceScope !== 'all' && <button type="button" onClick={() => { window.location.assign(`/api/auth/provider/${sourceScope}/link`); }} className="mt-3 rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-900/60">Connect {providers.find((provider) => provider.id === sourceScope)?.name ?? sourceScope}</button>}
        </fieldset>
      </div>

      {onContinue && <button type="button" onClick={() => onContinue(preferences)} className="mt-8 w-full rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-pink-300">Continue to library</button>}
    </section>
  );
};
