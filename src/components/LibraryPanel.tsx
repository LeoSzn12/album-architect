'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EyeOff, Heart, Library, Link2, Play, Search, Tag, X, ArrowLeft } from 'lucide-react';
import { SONG_LIBRARY } from '@/data/songs';
import { providers } from '@/lib/providers';
import type { Song } from '@/types/draft';
import type { ProviderId } from '@/lib/providers/types';

interface LibraryPanelProps {
  songs?: Song[];
  exportSongs?: Song[];
  sourceScope?: 'all' | ProviderId;
  onSelectSong?: (song: Song) => void;
  onFavoritesChange?: (songIds: string[]) => void;
  onTagsChange?: (tags: Record<string, string[]>) => void;
  onHiddenChange?: (songIds: string[]) => void;
  onBackToGame?: () => void;
}

export const LibraryPanel: React.FC<LibraryPanelProps> = ({ songs = SONG_LIBRARY, exportSongs = [], sourceScope = 'all', onSelectSong, onFavoritesChange, onTagsChange, onHiddenChange, onBackToGame }) => {
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
  const [providerQuery, setProviderQuery] = useState('');
  const [providerSongs, setProviderSongs] = useState<Song[]>([]);
  const [playlistReference, setPlaylistReference] = useState('');
  const [exportName, setExportName] = useState('TrackDraft playlist');
  const [providerState, setProviderState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });
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
  const remoteProvider = sourceScope === 'spotify' || sourceScope === 'youtube' ? sourceScope : null;
  const searchRemote = async () => {
    if (!remoteProvider || !providerQuery.trim()) return;
    setProviderState({ status: 'loading', message: '' });
    try {
      const response = await fetch(`/api/providers/search?provider=${remoteProvider}&q=${encodeURIComponent(providerQuery.trim())}`);
      const body = await response.json() as { songs?: Song[]; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? 'Connect this provider before searching.');
      setProviderSongs(body.songs ?? []);
      setProviderState({ status: 'success', message: `${body.songs?.length ?? 0} provider results loaded.` });
    } catch (error) {
      setProviderState({ status: 'error', message: error instanceof Error ? error.message : 'Provider search is unavailable.' });
    }
  };
  const importPlaylist = async () => {
    if (!remoteProvider || !playlistReference.trim()) return;
    setProviderState({ status: 'loading', message: '' });
    try {
      const response = await fetch('/api/providers/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: remoteProvider, reference: playlistReference.trim() }) });
      const body = await response.json() as { playlist?: { name: string; songs: Song[] }; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? 'Connect this provider before importing.');
      setProviderSongs(body.playlist?.songs ?? []);
      setProviderState({ status: 'success', message: `Imported ${body.playlist?.songs.length ?? 0} tracks from ${body.playlist?.name ?? 'playlist'}.` });
    } catch (error) {
      setProviderState({ status: 'error', message: error instanceof Error ? error.message : 'Playlist import is unavailable.' });
    }
  };
  const exportPlaylist = async () => {
    if (!remoteProvider || !exportSongs.length) return;
    setProviderState({ status: 'loading', message: '' });
    try {
      const response = await fetch('/api/providers/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider: remoteProvider, name: exportName, songs: exportSongs }) });
      const body = await response.json() as { playlist?: { url?: string }; error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? 'Connect this provider before exporting.');
      setProviderState({ status: 'success', message: body.playlist?.url ? `Playlist ready: ${body.playlist.url}` : 'Playlist exported.' });
    } catch (error) {
      setProviderState({ status: 'error', message: error instanceof Error ? error.message : 'Playlist export is unavailable.' });
    }
  };

  return (
    <section aria-labelledby="library-panel-title" className="w-full max-w-6xl rounded-3xl border border-white/[0.08] bg-[#0e0e12]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
      {onBackToGame && (
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <button
            onClick={onBackToGame}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Draft Board</span>
          </button>
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Track Catalog & Playlist Desk</span>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-400">Catalog Desk</p>
          <h2 id="library-panel-title" className="flex items-center gap-2.5 text-2xl font-black text-white tracking-tight mt-1">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Library className="h-4 w-4 text-rose-500" aria-hidden="true" />
            </div>
            Library
          </h2>
          <p className="mt-1 text-sm text-zinc-400">Search, mark, and shape your personal cut list.</p>
        </div>
        {provider && (
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
            {provider.name} · {provider.capabilities.search.enabled ? 'search ready' : 'scaffolded'}
          </span>
        )}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">Search catalog</span>
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, artist, album, or mood"
            className="w-full rounded-2xl border border-white/[0.08] bg-[#121216]/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30"
          />
        </label>
        <label>
          <span className="sr-only">Filter by genre</span>
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="w-full rounded-2xl border border-white/[0.08] bg-[#121216]/90 px-4 py-2.5 text-sm font-bold text-zinc-300 outline-none focus:border-rose-500/80 md:w-56"
          >
            {genres.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All genres' : item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs font-black uppercase tracking-wider text-zinc-300">Provider Desk</div>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-black uppercase text-zinc-400">
            {remoteProvider ? `${remoteProvider} account` : 'Select Spotify or YouTube in Setup'}
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <input
            value={providerQuery}
            onChange={(event) => setProviderQuery(event.target.value)}
            placeholder="Search connected provider catalog"
            className="min-w-0 rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/80"
          />
          <button
            type="button"
            disabled={!remoteProvider || !providerQuery.trim() || providerState.status === 'loading'}
            onClick={searchRemote}
            className="rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-5 py-2.5 text-xs font-bold text-zinc-200 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Search provider
          </button>
        </div>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <input
            value={playlistReference}
            onChange={(event) => setPlaylistReference(event.target.value)}
            placeholder="Paste a Spotify or YouTube playlist URL"
            className="min-w-0 rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/80"
          />
          <button
            type="button"
            disabled={!remoteProvider || !playlistReference.trim() || providerState.status === 'loading'}
            onClick={importPlaylist}
            className="rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-5 py-2.5 text-xs font-bold text-zinc-200 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import playlist
          </button>
        </div>
        <div className="mt-2.5 flex flex-col gap-2.5 sm:flex-row">
          <input
            value={exportName}
            onChange={(event) => setExportName(event.target.value)}
            aria-label="Export playlist name"
            className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500/80"
          />
          <button
            type="button"
            disabled={!remoteProvider || !exportSongs.length || providerState.status === 'loading'}
            onClick={exportPlaylist}
            className="rounded-full bg-white hover:bg-zinc-200 px-5 py-2.5 text-xs font-extrabold text-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-md"
          >
            Export {exportSongs.length ? `${exportSongs.length} tracks` : 'draft'}
          </button>
        </div>
        {providerState.message && (
          <p className={`mt-2.5 break-words text-xs ${providerState.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {providerState.message}
          </p>
        )}
        {providerSongs.length > 0 && (
          <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {providerSongs.slice(0, 12).map((song) => (
              <button
                type="button"
                key={song.id}
                onClick={() => onSelectSong?.(song)}
                className="rounded-xl border border-white/[0.08] bg-[#121216]/90 p-3 text-left hover:border-white/20 transition active:scale-95"
              >
                <span className="block truncate text-xs font-bold text-white">{song.title}</span>
                <span className="block truncate text-[11px] text-zinc-500">{song.rawArtistString || song.artist}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300">
          <Link2 className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
          Resolve an official song link
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://open.spotify.com/... or https://music.youtube.com/..."
            className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/80"
          />
          <button
            type="button"
            disabled={!linkUrl.trim() || resolveState.status === 'loading'}
            onClick={resolveLink}
            className="rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-5 py-2.5 text-xs font-bold text-zinc-200 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {resolveState.status === 'loading' ? 'Resolving…' : 'Resolve link'}
          </button>
        </div>
        {resolveState.message && (
          <p className={`mt-2.5 text-xs ${resolveState.status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {resolveState.message}
          </p>
        )}
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleSongs.map((song) => (
          <article
            key={song.id}
            className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 p-4 transition hover:border-white/20 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className={`mb-3 h-16 rounded-xl bg-gradient-to-br ${song.gradient} p-3 relative overflow-hidden border border-white/[0.06]`}>
                <div className="flex items-start justify-between">
                  <span className="line-clamp-1 text-[10px] font-black uppercase tracking-wider text-white/80">
                    {song.genre}
                  </span>
                  <button
                    type="button"
                    aria-label={`Hide ${song.title}`}
                    onClick={() => hideSong(song.id)}
                    className="rounded-full p-1 text-white/60 hover:bg-black/40 hover:text-white transition"
                  >
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <h3 className="line-clamp-1 font-black text-white text-sm">{song.title}</h3>
              <p className="line-clamp-1 text-xs text-zinc-400">{song.rawArtistString}</p>
              <p className="mt-1.5 text-[11px] text-zinc-500 font-medium">
                {song.year ?? '—'} · {song.typeTag} · Energy {song.energy}
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectSong?.(song)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white hover:bg-zinc-200 px-3 py-2 text-xs font-extrabold text-black transition active:scale-95 shadow-sm"
                >
                  <Play className="h-3.5 w-3.5 fill-black" aria-hidden="true" />
                  Use track
                </button>
                <button
                  type="button"
                  aria-pressed={favorites.includes(song.id)}
                  aria-label={`${favorites.includes(song.id) ? 'Remove' : 'Add'} ${song.title} ${favorites.includes(song.id) ? 'from' : 'to'} favorites`}
                  onClick={() => toggleFavorite(song.id)}
                  className={`rounded-full border p-2 transition active:scale-95 ${
                    favorites.includes(song.id)
                      ? 'border-rose-500/50 bg-rose-500/15 text-rose-400'
                      : 'border-white/[0.08] bg-white/[0.04] text-zinc-500 hover:text-rose-400'
                  }`}
                >
                  <Heart className="h-4 w-4" fill={favorites.includes(song.id) ? 'currentColor' : 'none'} aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(tags[song.id] ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2.5 py-0.5 text-[10px] font-bold text-zinc-300">
                    {tag}
                  </span>
                ))}
                <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full border border-dashed border-white/[0.12] px-2.5 py-0.5">
                  <Tag className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden="true" />
                  <span className="sr-only">Add tag to {song.title}</span>
                  <input
                    value={tagInput[song.id] ?? ''}
                    onChange={(event) => setTagInput({ ...tagInput, [song.id]: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') addTag(song.id);
                    }}
                    placeholder="tag + enter"
                    className="min-w-0 w-full bg-transparent py-1 text-[10px] text-white outline-none placeholder:text-zinc-600"
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>
      {visibleSongs.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/[0.08] py-12 text-center text-sm text-zinc-500">
          No tracks match this cut. Try another search or filter.
        </div>
      )}
      {hidden.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setHidden([]);
            onHiddenChange?.([]);
          }}
          className="mt-5 flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Restore {hidden.length} hidden track{hidden.length === 1 ? '' : 's'}
        </button>
      )}
    </section>
  );
};
