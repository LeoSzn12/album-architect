-- TrackDraft production foundation for Supabase Postgres.
-- This migration is intentionally RLS-first: all user-owned records are scoped
-- by auth.uid(), while demo-catalog gameplay remains local when Supabase is unset.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text not null,
  avatar_url text,
  preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null check (provider in ('spotify', 'youtube')),
  provider_user_id text,
  encrypted_tokens text,
  scopes text[] not null default '{}',
  expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.songs (
  id text primary key,
  canonical_title text not null,
  canonical_artist_text text not null,
  duration_ms integer,
  release_year integer,
  explicit boolean not null default false,
  normalized_key text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.song_provider_refs (
  id uuid primary key default gen_random_uuid(),
  song_id text not null references public.songs(id) on delete cascade,
  provider text not null check (provider in ('demo', 'spotify', 'youtube')),
  provider_item_id text not null,
  canonical_url text,
  artwork_url text,
  raw_metadata_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  unique (provider, provider_item_id)
);

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  song_id text not null references public.songs(id) on delete cascade,
  source text not null check (source in ('import', 'search', 'link', 'manual')),
  source_playlist_id text,
  favorite boolean not null default false,
  hidden boolean not null default false,
  tags_json jsonb not null default '[]'::jsonb,
  added_at timestamptz not null default now(),
  unique (user_id, song_id, source_playlist_id)
);

create table if not exists public.game_templates (
  id text primary key,
  mode text not null check (mode in ('draft', 'ep', 'album')),
  name text not null,
  track_count integer not null check (track_count between 6 and 14),
  slots_json jsonb not null,
  rules_json jsonb not null default '{}'::jsonb,
  scoring_weights_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.game_sessions (
  id text primary key,
  mode text not null check (mode in ('draft', 'ep', 'album')),
  track_count integer not null check (track_count between 6 and 14),
  creator_id uuid not null references public.users(id) on delete cascade,
  creator_alias text not null,
  opponent_type text not null check (opponent_type in ('ai', 'friend')),
  visibility text not null check (visibility in ('public', 'friends', 'private')),
  brief_json jsonb not null default '{}'::jsonb,
  seed text,
  status text not null check (status in ('drafting', 'submitted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.game_sessions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  ai_profile text,
  seat text not null check (seat in ('a', 'b')),
  final_score numeric(5, 2),
  outcome text,
  unique (session_id, seat)
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.game_sessions(id) on delete cascade,
  round_index integer not null,
  slot_key text not null,
  status text not null default 'open' check (status in ('open', 'locked', 'revealed', 'complete')),
  pool_seed text,
  deadline_at timestamptz,
  unique (session_id, round_index)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  song_id text not null references public.songs(id) on delete cascade,
  rank integer not null,
  reason text not null,
  tags_json jsonb not null default '[]'::jsonb,
  source_type text not null default 'deterministic',
  unique (round_id, rank),
  unique (round_id, song_id)
);

create table if not exists public.picks (
  id text primary key,
  session_id text not null references public.game_sessions(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  position integer not null,
  slot_key text not null,
  song_id text not null references public.songs(id),
  selection_source text not null check (selection_source in ('recommendation', 'search', 'link', 'manual')),
  locked_at timestamptz not null default now(),
  unique (session_id, position)
);

create table if not exists public.scorecards (
  id uuid primary key default gen_random_uuid(),
  session_id text not null references public.game_sessions(id) on delete cascade,
  creator_id uuid not null references public.users(id) on delete cascade,
  participant_alias text not null,
  rubric_version text not null,
  total_score numeric(5, 2) not null,
  categories_json jsonb not null,
  penalties_json jsonb not null default '[]'::jsonb,
  critique_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  source_session_id text not null references public.game_sessions(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete set null,
  challenge_code text unique not null,
  status text not null default 'open',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_items (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references public.users(id) on delete cascade,
  song_provider_ref_id uuid references public.song_provider_refs(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists provider_accounts_user_idx on public.provider_accounts(user_id);
create index if not exists song_provider_refs_song_idx on public.song_provider_refs(song_id);
create index if not exists library_items_user_idx on public.library_items(user_id);
create index if not exists game_sessions_creator_idx on public.game_sessions(creator_id);
create index if not exists participants_session_idx on public.participants(session_id);
create index if not exists rounds_session_idx on public.rounds(session_id);
create index if not exists picks_session_idx on public.picks(session_id);
create index if not exists picks_creator_idx on public.picks(creator_id);
create index if not exists scorecards_session_idx on public.scorecards(session_id);

alter table public.users enable row level security;
alter table public.provider_accounts enable row level security;
alter table public.songs enable row level security;
alter table public.song_provider_refs enable row level security;
alter table public.library_items enable row level security;
alter table public.game_templates enable row level security;
alter table public.game_sessions enable row level security;
alter table public.participants enable row level security;
alter table public.rounds enable row level security;
alter table public.recommendations enable row level security;
alter table public.picks enable row level security;
alter table public.scorecards enable row level security;
alter table public.challenges enable row level security;
alter table public.moderation_items enable row level security;

create policy "users can read their own profile" on public.users for select to authenticated using ((select auth.uid()) = id);
create policy "users can create their own profile" on public.users for insert to authenticated with check ((select auth.uid()) = id);
create policy "users can update their own profile" on public.users for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "users own provider accounts" on public.provider_accounts for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "authenticated users can read templates" on public.game_templates for select to authenticated using (true);

create policy "users can read songs in their picks" on public.songs for select to authenticated using (exists (select 1 from public.picks where picks.song_id = songs.id and picks.creator_id = (select auth.uid())));
create policy "authenticated users can add song snapshots" on public.songs for insert to authenticated with check ((select auth.uid()) is not null);
create policy "authenticated users can update song snapshots" on public.songs for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy "users can read provider refs in their library" on public.song_provider_refs for select to authenticated using (exists (select 1 from public.library_items where library_items.song_id = song_provider_refs.song_id and library_items.user_id = (select auth.uid())));

create policy "users own library items" on public.library_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users own sessions" on public.game_sessions for all to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "users own participants" on public.participants for all to authenticated using (exists (select 1 from public.game_sessions where game_sessions.id = participants.session_id and game_sessions.creator_id = (select auth.uid()))) with check (exists (select 1 from public.game_sessions where game_sessions.id = participants.session_id and game_sessions.creator_id = (select auth.uid())));
create policy "users own rounds" on public.rounds for all to authenticated using (exists (select 1 from public.game_sessions where game_sessions.id = rounds.session_id and game_sessions.creator_id = (select auth.uid()))) with check (exists (select 1 from public.game_sessions where game_sessions.id = rounds.session_id and game_sessions.creator_id = (select auth.uid())));
create policy "users own recommendations" on public.recommendations for all to authenticated using (exists (select 1 from public.rounds join public.game_sessions on game_sessions.id = rounds.session_id where rounds.id = recommendations.round_id and game_sessions.creator_id = (select auth.uid()))) with check (exists (select 1 from public.rounds join public.game_sessions on game_sessions.id = rounds.session_id where rounds.id = recommendations.round_id and game_sessions.creator_id = (select auth.uid())));
create policy "users own picks" on public.picks for all to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "users own scorecards" on public.scorecards for all to authenticated using ((select auth.uid()) = creator_id) with check ((select auth.uid()) = creator_id);
create policy "users own challenges" on public.challenges for all to authenticated using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id) with check ((select auth.uid()) = sender_id);
create policy "users own moderation submissions" on public.moderation_items for insert to authenticated with check ((select auth.uid()) = submitted_by);
create policy "users can read their moderation submissions" on public.moderation_items for select to authenticated using ((select auth.uid()) = submitted_by);
