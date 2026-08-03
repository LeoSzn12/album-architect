'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EyeOff, Heart, Library, Link2, Play, Search, Tag, X } from 'lucide-react';
import { SONG_LIBRARY } from '@/data/songs';
import { providers } from '@/lib/providers';
import type { Song } from '@/types/draft';
import type { ProviderId } from '@/lib/providers/types';

interface LibraryPanelProps {
  songs?: Song[];
  sourceScope?: 'all' | ProviderId;
  onSelectSong?: (song: Song) => void;
  onFavoritesChange?: (songIds: string[]) => void;
  onTagsChange?: (tags: Record<string, string[]>) => void;
  onHiddenChange?: (songIds: string[]) => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ songs = SONG_LIBRARY, sourceScope = 'all', onSelectSong, onFavoritesChange, onTagsChange, onHiddenChange }) => {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('all');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('trackdraft-library-favorites') ?? '[]') as string[]; } catch { return []; }
  });
  const [hidden, setHidden] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('trackdraft-library-hidden') ?? '[]') as string[]; } catch { return []; }
  });
  const [tags, setTags] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('trackdraft-library-tags') ?? '{}') as Record<string, string[]>; } catch { return {}; }
  });
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [linkUrl, setLinkUrl] = useState('');
  const [resolveState, setResolveState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
  const genres = useMemo(() => ['all', ...Array.from(new Set(songs.map((song) => song.genre))).sort()], [songs]);
  const provider = sourceScope === 'all' ? undefined : providers.find((item) => item.id === sourceScope);
  const visibleSongs = songs.filter((song) => !hidden.includes(song.id) && (genre === 'all' || song.genre === genre) && [song.title, song.artist, song.album, song.genre, song.typeTag].filter(Boolean).join(' ').toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { localStorage.setItem('trackdraft-library-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('trackdraft-library-hidden', JSON.stringify(hidden)); }, [hidden]);
  useEffect(() => { localStorage.setItem('trackdraft-library-tags', JSON.stringify(tags)); }, [tags]);

  const toggleFavorite = (id: string) => { const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id]; setFavorites(next); onFavoritesChange?.(next); };
  const hideSong = (id: string) => { const next = [...hidden, id]; setHidden(next); onHiddenChange?.(next); };
  const addTag = (songId: string) => { const value = tagInput[songId]?.trim(); if (!value) return; const next = { ...tags, [songId]: Array.from(new Set([...(tags[songId] ?? []), value])) }; setTags(next); setTagInput({ ...tagInput, [songId]: '' }); onTagsChange?.(next); };
  const resolveLink = async () => {
    setResolveState({ status: 'loading', message: '' });
    try {
      const response = await fetch('/api/songs/resolve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: linkUrl }) });
      const body = await response.json() as { song?: Song | null; error?: { message?: string } | string; notice?: string };
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : body.error?.message ?? body.notice ?? 'Provider resolution is unavailable.');
      if (!body.song) throw new Error('No playable song was found at that URL.');
      setResolveState({ status: 'success', message: `${body.song.title} by ${body.song.rawArtistString || body.song.artist} resolved.` });
      onSelectSong?.(body.song);
    } catch (error) {
      setResolveState({ status: 'error', message: error instanceof Error ? error.message : 'Provider resolution is unavailable.' });
    }
  };

  return <section aria-labelledby="library-panel-title" className="w-full max-w-6xl rounded-3xl border border-purple-500/30 bg-gray-900/90 p-5 shadow-2xl backdrop-blur-md sm:p-7">
    <div className="mb-5 flex flex-col gap-3 border-b border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">Catalog desk</p><h2 id="library-panel-title" className="flex items-center gap-2 text-2xl font-black text-white"><Library className="h-5 w-5 text-purple-300" aria-hidden="true" />Library</h2><p className="mt-1 text-sm text-gray-400">Search, mark, and shape your personal cut list.</p></div>{provider && <span className="rounded-lg border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-[10px] font-black uppercase text-gray-400">{provider.name} · {provider.capabilities.search.enabled ? 'search ready' : 'scaffolded'}</span>}</div>
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]"><label className="relative"><span className="sr-only">Search catalog</span><Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, artist, album, or mood" className="w-full rounded-xl border border-gray-700 bg-gray-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30" /></label><label><span className="sr-only">Filter by genre</span><select value={genre} onChange={(event) => setGenre(event.target.value)} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm font-bold text-gray-300 outline-none focus:border-purple-400 md:w-56">{genres.map((item) => <option key={item} value={item}>{item === 'all' ? 'All genres' : item}</option>)}</select></label></div>
    <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-200"><Link2 className="h-3.5 w-3.5" aria-hidden="true" />Resolve an official song link</div><div className="flex flex-col gap-2 sm:flex-row"><input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://open.spotify.com/... or https://music.youtube.com/..." className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-cyan-400" /><button type="button" disabled={!linkUrl.trim() || resolveState.status === 'loading'} onClick={resolveLink} className="rounded-xl border border-cyan-500/40 bg-cyan-950/50 px-4 py-2.5 text-xs font-black text-cyan-100 transition hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-50">{resolveState.status === 'loading' ? 'Resolving…' : 'Resolve link'}</button></div>{resolveState.message && <p className={`mt-2 text-xs ${resolveState.status === 'success' ? 'text-emerald-300' : 'text-amber-300'}`}>{resolveState.message}</p>}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visibleSongs.map((song) => <article key={song.id} className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 transition hover:border-purple-700/70"><div className={`mb-3 h-16 rounded-xl bg-gradient-to-br ${song.gradient} p-3`}><div className="flex items-start justify-between"><span className="line-clamp-1 text-[10px] font-black uppercase tracking-wider text-white/70">{song.genre}</span><button type="button" aria-label={`Hide ${song.title}`} onClick={() => hideSong(song.id)} className="rounded-lg p-1 text-white/60 hover:bg-black/30 hover:text-white"><EyeOff className="h-3.5 w-3.5" aria-hidden="true" /></button></div></div><h3 className="line-clamp-1 font-black text-white">{song.title}</h3><p className="line-clamp-1 text-xs text-gray-400">{song.rawArtistString}</p><p className="mt-2 text-[11px] text-gray-500">{song.year ?? '—'} · {song.typeTag} · Energy {song.energy}</p><div className="mt-3 flex items-center gap-2"><button type="button" onClick={() => onSelectSong?.(song)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-800/70 bg-purple-950/50 px-2 py-2 text-xs font-black text-purple-200 hover:bg-purple-900/70"><Play className="h-3.5 w-3.5" aria-hidden="true" />Use track</button><button type="button" aria-pressed={favorites.includes(song.id)} aria-label={`${favorites.includes(song.id) ? 'Remove' : 'Add'} ${song.title} ${favorites.includes(song.id) ? 'from' : 'to'} favorites`} onClick={() => toggleFavorite(song.id)} className={`rounded-lg border p-2 ${favorites.includes(song.id) ? 'border-pink-500/60 bg-pink-950/60 text-pink-300' : 'border-gray-700 text-gray-500 hover:text-pink-300'}`}><Heart className="h-4 w-4" fill={favorites.includes(song.id) ? 'currentColor' : 'none'} aria-hidden="true" /></button></div><div className="mt-3 flex flex-wrap gap-1.5">{(tags[song.id] ?? []).map((tag) => <span key={tag} className="rounded bg-cyan-950/50 px-2 py-1 text-[10px] font-bold text-cyan-300">{tag}</span>)}<label className="flex min-w-0 flex-1 items-center gap-1 rounded border border-dashed border-gray-700 px-2"><Tag className="h-3 w-3 shrink-0 text-gray-500" aria-hidden="true" /><span className="sr-only">Add tag to {song.title}</span><input value={tagInput[song.id] ?? ''} onChange={(event) => setTagInput({ ...tagInput, [song.id]: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') addTag(song.id); }} placeholder="tag + enter" className="min-w-0 w-full bg-transparent py-1 text-[10px] text-white outline-none placeholder:text-gray-600" /></label></div></article>)}</div>
    {visibleSongs.length === 0 && <div className="rounded-2xl border border-dashed border-gray-700 py-12 text-center text-sm text-gray-500">No tracks match this cut. Try another search or filter.</div>}
    {hidden.length > 0 && <button type="button" onClick={() => { setHidden([]); onHiddenChange?.([]); }} className="mt-5 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-white"><X className="h-3.5 w-3.5" aria-hidden="true" />Restore {hidden.length} hidden track{hidden.length === 1 ? '' : 's'}</button>}
  </section>;
};
