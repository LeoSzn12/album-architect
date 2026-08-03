'use client';

import React, { useState } from 'react';
import { BarChart3, Check, Disc3, Heart, Pencil, UserRound } from 'lucide-react';

export interface ProfileStats {
  draftsCompleted: number;
  wins: number;
  tracksDrafted: number;
  favoriteGenre?: string;
  averageScore?: number;
}

interface ProfilePanelProps {
  displayName?: string;
  initialBio?: string;
  stats?: Partial<ProfileStats>;
  favoriteCount?: number;
  onProfileChange?: (profile: { displayName: string; bio: string }) => void;
}

const DEFAULT_STATS: ProfileStats = { draftsCompleted: 0, wins: 0, tracksDrafted: 0, favoriteGenre: 'Not enough data', averageScore: 0 };

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ displayName: initialName = 'New curator', initialBio = 'Building a point of view, one track at a time.', stats = {}, favoriteCount = 0, onProfileChange }) => {
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const profileStats = { ...DEFAULT_STATS, ...stats };
  const save = () => { setEditing(false); onProfileChange?.({ displayName: displayName.trim() || 'New curator', bio: bio.trim() }); };

  return <section aria-labelledby="profile-panel-title" className="w-full max-w-4xl rounded-3xl border border-purple-500/30 bg-gray-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8"><div className="mb-7 flex items-start justify-between border-b border-gray-800 pb-6"><div className="flex gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg"><UserRound className="h-6 w-6 text-white" aria-hidden="true" /></div><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400">Curator profile</p><h2 id="profile-panel-title" className="text-2xl font-black text-white">Your A&R card</h2><p className="mt-1 text-sm text-gray-400">A compact read on your taste and draft history.</p></div></div><button type="button" onClick={() => editing ? save() : setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-xs font-black text-gray-300 hover:border-purple-500 hover:text-white">{editing ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}{editing ? 'Save' : 'Edit'}</button></div>
    <div className="grid gap-7 lg:grid-cols-[1fr_1.25fr]"><div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-5">{editing ? <div className="space-y-4"><label className="block text-xs font-bold text-gray-400">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-400" /></label><label className="block text-xs font-bold text-gray-400">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-400" /></label></div> : <><h3 className="text-xl font-black text-white">{displayName}</h3><p className="mt-2 text-sm leading-6 text-gray-400">{bio}</p></>}<div className="mt-5 flex flex-wrap gap-2"><span className="rounded-lg border border-pink-500/30 bg-pink-950/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-pink-300"><Heart className="mr-1 inline h-3 w-3" aria-hidden="true" />{favoriteCount} favorites</span><span className="rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1.5 text-[10px] font-black uppercase text-purple-300"><Disc3 className="mr-1 inline h-3 w-3" aria-hidden="true" />{profileStats.favoriteGenre}</span></div></div>
      <div><h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-200"><BarChart3 className="h-4 w-4 text-amber-300" aria-hidden="true" />Draft record</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Drafts', profileStats.draftsCompleted], ['Wins', profileStats.wins], ['Tracks', profileStats.tracksDrafted], ['Avg score', profileStats.averageScore ? profileStats.averageScore.toFixed(1) : '—']].map(([label, value]) => <div key={label} className="rounded-xl border border-gray-800 bg-gray-950 p-3"><span className="block text-2xl font-black text-white">{value}</span><span className="text-[10px] font-black uppercase tracking-wider text-gray-500">{label}</span></div>)}</div><div className="mt-4 rounded-xl border border-gray-800 bg-gray-950/60 p-4"><p className="text-xs font-bold text-gray-400">Profile signal</p><p className="mt-1 text-sm text-gray-200">{profileStats.draftsCompleted ? `${profileStats.wins} wins across ${profileStats.draftsCompleted} completed drafts.` : 'Complete your first draft to start building your curator profile.'}</p></div></div></div>
  </section>;
};
