import type { GameMode, Song } from '@/types/draft';
import type { GameSessionRecord, SessionPick, SessionVisibility } from '@/types/session';
import { createSupabaseServerClient } from './server';

export interface PersistentSessionInput {
  mode: GameMode;
  trackCount: number;
  creatorAlias?: string;
  brief?: string;
  visibility?: SessionVisibility;
  opponentType?: 'ai' | 'friend';
  seed?: string | null;
}

type PersistentResult<T> =
  | { configured: false; data: null }
  | { configured: true; data: T | null; error?: string; unauthenticated?: boolean };

interface SessionRow {
  id: string;
  mode: GameMode;
  track_count: number;
  creator_alias: string;
  opponent_type: 'ai' | 'friend';
  visibility: SessionVisibility;
  brief_json: { text?: string } | null;
  seed: string | null;
  status: 'drafting' | 'submitted' | 'abandoned';
  created_at: string;
  updated_at: string;
}

interface PickRow {
  id: string;
  position: number;
  slot_key: string;
  song_id: string;
  selection_source: SessionPick['selectionSource'];
  locked_at: string;
}

interface SongRow {
  id: string;
  metadata_json: unknown;
}

function cleanAlias(value: string | undefined) {
  return (value ?? 'Executive Architect').trim().slice(0, 40) || 'Executive Architect';
}

function cleanBrief(value: string | undefined) {
  return (value ?? 'Build the strongest project under the current brief.').trim().slice(0, 240);
}

function normalizedSongKey(song: Song) {
  return `${song.title}::${song.rawArtistString}`.toLowerCase().replace(/[^a-z0-9:]+/g, '-').slice(0, 240);
}

function rowToSong(row: SongRow) {
  if (!row.metadata_json || typeof row.metadata_json !== 'object') return null;
  const song = row.metadata_json as Song;
  return song.id === row.id ? song : { ...song, id: row.id };
}

async function authenticatedClient() {
  const client = await createSupabaseServerClient();
  if (!client) return { configured: false as const, client: null, userId: null };

  const { data, error } = await client.auth.getClaims();
  const userId = !error && data?.claims?.sub ? String(data.claims.sub) : null;
  return { configured: true as const, client, userId };
}

async function ensureUserProfile(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, userId: string, alias: string) {
  const { data } = await client.auth.getUser();
  const { error } = await client.from('users').upsert({
    id: userId,
    email: data.user?.email ?? null,
    display_name: alias,
  }, { onConflict: 'id' });
  return error;
}

async function hydrateSession(
  client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  row: SessionRow,
  userId: string,
): Promise<{ data: GameSessionRecord | null; error?: string }> {
  const { data: pickRows, error: picksError } = await client
    .from('picks')
    .select('id, position, slot_key, song_id, selection_source, locked_at')
    .eq('session_id', row.id)
    .eq('creator_id', userId)
    .order('position', { ascending: true });
  if (picksError) return { data: null, error: picksError.message };

  const typedPicks = (pickRows ?? []) as PickRow[];
  const songIds = typedPicks.map((pick) => pick.song_id);
  const { data: songRows, error: songsError } = songIds.length
    ? await client.from('songs').select('id, metadata_json').in('id', songIds)
    : { data: [], error: null };
  if (songsError) return { data: null, error: songsError.message };

  const songs = new Map(((songRows ?? []) as SongRow[]).flatMap((songRow) => {
    const song = rowToSong(songRow);
    return song ? [[songRow.id, song] as const] : [];
  }));

  return {
    data: {
      id: row.id,
      mode: row.mode,
      trackCount: row.track_count,
      creatorAlias: row.creator_alias,
      brief: row.brief_json?.text ?? '',
      visibility: row.visibility,
      opponentType: row.opponent_type,
      seed: row.seed,
      status: row.status,
      picks: typedPicks.flatMap((pick) => {
        const song = songs.get(pick.song_id);
        return song ? [{ position: pick.position, slotId: pick.slot_key, song, selectionSource: pick.selection_source, lockedAt: pick.locked_at }] : [];
      }),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

async function fetchOwnedSession(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, id: string, userId: string) {
  const { data, error } = await client
    .from('game_sessions')
    .select('id, mode, track_count, creator_alias, opponent_type, visibility, brief_json, seed, status, created_at, updated_at')
    .eq('id', id)
    .eq('creator_id', userId)
    .maybeSingle();
  if (error) return { row: null, error: error.message };
  return { row: data as SessionRow | null, error: undefined };
}

async function upsertSong(client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, song: Song) {
  const { error } = await client.from('songs').upsert({
    id: song.id,
    canonical_title: song.title,
    canonical_artist_text: song.rawArtistString,
    release_year: song.year ?? null,
    normalized_key: normalizedSongKey(song),
    metadata_json: song,
  }, { onConflict: 'id' });
  return error;
}

export async function createPersistentSession(input: PersistentSessionInput): Promise<PersistentResult<GameSessionRecord>> {
  const context = await authenticatedClient();
  if (!context.configured) return { configured: false, data: null };
  if (!context.userId || !context.client) return { configured: true, data: null, unauthenticated: true };

  const alias = cleanAlias(input.creatorAlias);
  const profileError = await ensureUserProfile(context.client, context.userId, alias);
  if (profileError) return { configured: true, data: null, error: profileError.message };

  const id = `session_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await context.client.from('game_sessions').insert({
    id,
    mode: input.mode,
    track_count: input.trackCount,
    creator_id: context.userId,
    creator_alias: alias,
    opponent_type: input.opponentType ?? 'ai',
    visibility: input.visibility ?? 'private',
    brief_json: { text: cleanBrief(input.brief) },
    seed: input.seed ?? null,
    status: 'drafting',
  }).select('id, mode, track_count, creator_alias, opponent_type, visibility, brief_json, seed, status, created_at, updated_at').single();
  if (error || !data) return { configured: true, data: null, error: error?.message ?? 'Session was not created.' };

  return { configured: true, ...(await hydrateSession(context.client, data as SessionRow, context.userId)) };
}

export async function getPersistentSession(id: string): Promise<PersistentResult<GameSessionRecord>> {
  const context = await authenticatedClient();
  if (!context.configured) return { configured: false, data: null };
  if (!context.userId || !context.client) return { configured: true, data: null, unauthenticated: true };

  const session = await fetchOwnedSession(context.client, id, context.userId);
  if (session.error) return { configured: true, data: null, error: session.error };
  if (!session.row) return { configured: true, data: null };
  return { configured: true, ...(await hydrateSession(context.client, session.row, context.userId)) };
}

export async function savePersistentSessionPick(id: string, pick: SessionPick): Promise<PersistentResult<GameSessionRecord>> {
  const context = await authenticatedClient();
  if (!context.configured) return { configured: false, data: null };
  if (!context.userId || !context.client) return { configured: true, data: null, unauthenticated: true };

  const session = await fetchOwnedSession(context.client, id, context.userId);
  if (session.error) return { configured: true, data: null, error: session.error };
  if (!session.row) return { configured: true, data: null };
  if (session.row.status !== 'drafting') return { configured: true, data: null, error: 'Session is not accepting picks.' };

  const songError = await upsertSong(context.client, pick.song);
  if (songError) return { configured: true, data: null, error: songError.message };
  const { error } = await context.client.from('picks').upsert({
    id: `${id}:${pick.position}`,
    session_id: id,
    creator_id: context.userId,
    position: pick.position,
    slot_key: pick.slotId,
    song_id: pick.song.id,
    selection_source: pick.selectionSource,
    locked_at: pick.lockedAt,
  }, { onConflict: 'session_id,position' });
  if (error) return { configured: true, data: null, error: error.message };

  const updated = await fetchOwnedSession(context.client, id, context.userId);
  if (updated.error || !updated.row) return { configured: true, data: null, error: updated.error ?? 'Session not found.' };
  return { configured: true, ...(await hydrateSession(context.client, updated.row, context.userId)) };
}

export async function submitPersistentSession(id: string): Promise<PersistentResult<GameSessionRecord>> {
  const context = await authenticatedClient();
  if (!context.configured) return { configured: false, data: null };
  if (!context.userId || !context.client) return { configured: true, data: null, unauthenticated: true };

  const session = await fetchOwnedSession(context.client, id, context.userId);
  if (session.error) return { configured: true, data: null, error: session.error };
  if (!session.row) return { configured: true, data: null };

  const { count, error: countError } = await context.client
    .from('picks')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id)
    .eq('creator_id', context.userId);
  if (countError) return { configured: true, data: null, error: countError.message };
  if (count !== session.row.track_count) return { configured: true, data: null, error: 'Session is incomplete.' };

  const { data, error } = await context.client.from('game_sessions')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('creator_id', context.userId)
    .eq('status', 'drafting')
    .select('id, mode, track_count, creator_alias, opponent_type, visibility, brief_json, seed, status, created_at, updated_at')
    .single();
  if (error || !data) return { configured: true, data: null, error: error?.message ?? 'Session was not submitted.' };
  return { configured: true, ...(await hydrateSession(context.client, data as SessionRow, context.userId)) };
}
