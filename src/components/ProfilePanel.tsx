'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, Check, Disc3, Heart, Pencil, UserRound, ArrowLeft } from 'lucide-react';

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
  onBackToGame?: () => void;
}

interface AuthState {
  configured: boolean;
  authenticated: boolean;
  user: { email?: string | null } | null;
}

const DEFAULT_STATS: ProfileStats = { draftsCompleted: 0, wins: 0, tracksDrafted: 0, favoriteGenre: 'Not enough data', averageScore: 0 };

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ displayName: initialName = 'New curator', initialBio = 'Building a point of view, one track at a time.', stats = {}, favoriteCount = 0, onProfileChange, onBackToGame }) => {
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [editing, setEditing] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const profileStats = { ...DEFAULT_STATS, ...stats };
  const save = () => { setEditing(false); onProfileChange?.({ displayName: displayName.trim() || 'New curator', bio: bio.trim() }); };
  useEffect(() => {
    fetch('/api/auth/session').then((response) => response.ok ? response.json() : null).then((nextState: AuthState | null) => { if (nextState) setAuthState(nextState); }).catch(() => undefined);
  }, []);
  const signIn = (provider: 'google' | 'github') => { window.location.assign(`/api/auth/supabase/link?provider=${provider}`); };
  const signOut = async () => { setAuthBusy(true); try { await fetch('/api/auth/supabase/signout', { method: 'POST' }); setAuthState({ configured: true, authenticated: false, user: null }); } finally { setAuthBusy(false); } };
  const deleteAccount = async () => {
    if (!window.confirm('Delete your account and all saved TrackDraft data? This cannot be undone.')) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const response = await fetch('/api/auth/account', { method: 'DELETE' });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error || 'Account deletion could not be completed.');
      }
      setAuthState({ configured: true, authenticated: false, user: null });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Account deletion could not be completed.');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <section aria-labelledby="profile-panel-title" className="w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-[#0e0e12]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-8">
      {onBackToGame && (
        <div className="mb-6 flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <button
            onClick={onBackToGame}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-200 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Draft Board</span>
          </button>
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Executive Curator ID</span>
        </div>
      )}

      <div className="mb-7 flex items-start justify-between border-b border-white/[0.08] pb-6">
        <div className="flex gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-lg">
            <UserRound className="h-6 w-6 text-rose-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-400">Curator Profile</p>
            <h2 id="profile-panel-title" className="text-2xl font-black text-white tracking-tight">Your A&R Card</h2>
            <p className="mt-1 text-sm text-zinc-400">A compact read on your taste and draft history.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => (editing ? save() : setEditing(true))}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-4 py-2 text-xs font-bold text-zinc-200 transition active:scale-95"
        >
          {editing ? <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_1.25fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 p-5 shadow-lg">
          {editing ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-zinc-400">
                Display name
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-400">
                Bio
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.08] bg-black/40 px-3.5 py-2 text-sm text-white outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30"
                />
              </label>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-black text-white">{displayName}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{bio}</p>
            </>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-300">
              <Heart className="mr-1 inline h-3 w-3 fill-current" aria-hidden="true" />
              {favoriteCount} favorites
            </span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-zinc-300">
              <Disc3 className="mr-1 inline h-3 w-3" aria-hidden="true" />
              {profileStats.favoriteGenre}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Account</p>
            {!authState ? (
              <p className="mt-1 text-xs text-zinc-500">Checking sign-in status…</p>
            ) : !authState.configured ? (
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Guest demo mode is active. Configure Supabase to save builds across devices.
              </p>
            ) : authState.authenticated ? (
              <>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-zinc-300">
                    Connected{authState.user?.email ? ` · ${authState.user.email}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={authBusy || deleteBusy}
                    onClick={signOut}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1 text-[10px] font-bold uppercase text-zinc-300 transition active:scale-95"
                  >
                    {authBusy ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
                <button
                  type="button"
                  disabled={authBusy || deleteBusy}
                  onClick={deleteAccount}
                  className="mt-3 rounded-full border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/50 px-3 py-1 text-[10px] font-bold uppercase text-rose-400 hover:text-rose-300 transition active:scale-95"
                >
                  {deleteBusy ? 'Deleting account…' : 'Delete account'}
                </button>
                {deleteError ? (
                  <p role="alert" className="mt-2 text-xs text-rose-300">{deleteError}</p>
                ) : null}
              </>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className="rounded-full bg-white hover:bg-zinc-200 px-4 py-1.5 text-[11px] font-extrabold text-black active:scale-95 transition shadow"
                >
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={() => signIn('github')}
                  className="rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] px-4 py-1.5 text-[11px] font-bold text-zinc-200 active:scale-95 transition"
                >
                  GitHub
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3.5 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-zinc-200">
            <BarChart3 className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Draft Record
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Drafts', profileStats.draftsCompleted],
              ['Wins', profileStats.wins],
              ['Tracks', profileStats.tracksDrafted],
              ['Avg score', profileStats.averageScore ? profileStats.averageScore.toFixed(1) : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#121216]/90 p-3.5 shadow-sm text-center">
                <span className="block text-2xl font-black text-white">{value}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Curator Signal</p>
            <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">
              {profileStats.draftsCompleted
                ? `${profileStats.wins} wins across ${profileStats.draftsCompleted} completed drafts.`
                : 'Complete your first draft to start building your curator profile.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
