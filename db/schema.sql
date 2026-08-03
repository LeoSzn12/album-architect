-- TrackDraft relational foundation.
-- The local demo currently uses src/lib/sessionRepository.ts so no database
-- credentials are required. This schema is the swap-in persistence contract.

create table if not exists users (
  id text primary key,
  email text unique,
  display_name text not null,
  avatar_url text,
  preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists songs (
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

create table if not exists song_provider_refs (
  id text primary key,
  song_id text not null references songs(id) on delete cascade,
  provider text not null check (provider in ('demo', 'spotify', 'youtube')),
  provider_item_id text not null,
  canonical_url text,
  artwork_url text,
  raw_metadata_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  unique (provider, provider_item_id)
);

create table if not exists game_sessions (
  id text primary key,
  mode text not null check (mode in ('draft', 'ep', 'album')),
  track_count integer not null check (track_count between 6 and 14),
  creator_id text references users(id) on delete set null,
  creator_alias text not null,
  opponent_type text not null check (opponent_type in ('ai', 'friend')),
  visibility text not null check (visibility in ('public', 'friends', 'private')),
  brief_json jsonb not null default '{}'::jsonb,
  seed text,
  status text not null check (status in ('drafting', 'submitted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists picks (
  id text primary key,
  session_id text not null references game_sessions(id) on delete cascade,
  position integer not null,
  slot_key text not null,
  song_id text not null references songs(id),
  selection_source text not null check (selection_source in ('recommendation', 'search', 'link', 'manual')),
  locked_at timestamptz not null default now(),
  unique (session_id, position)
);

create table if not exists scorecards (
  id text primary key,
  session_id text not null references game_sessions(id) on delete cascade,
  participant_alias text not null,
  rubric_version text not null,
  total_score numeric(5, 2) not null,
  categories_json jsonb not null,
  penalties_json jsonb not null default '[]'::jsonb,
  critique_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists challenges (
  id text primary key,
  source_session_id text not null references game_sessions(id) on delete cascade,
  challenge_code text unique not null,
  recipient_alias text,
  status text not null default 'open',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists song_provider_refs_song_idx on song_provider_refs(song_id);
create index if not exists picks_session_idx on picks(session_id);
create index if not exists scorecards_session_idx on scorecards(session_id);
