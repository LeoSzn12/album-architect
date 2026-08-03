import assert from 'node:assert/strict';
import test from 'node:test';
import { createRemoteProvider } from '../src/lib/providers/remote.ts';

const originalFetch = globalThis.fetch;

test('Spotify adapter maps search results and exports ordered track URIs', async () => {
  const calls: Array<{ url: string; body?: string }> = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, body: typeof init?.body === 'string' ? init.body : undefined });
    if (url.includes('/search?')) {
      return new Response(JSON.stringify({ tracks: { items: [{ id: '1234567890123456789012', name: 'Imported Cut', artists: [{ name: 'Artist One' }, { name: 'Guest' }], album: { name: 'Set', release_date: '2024-01-01' }, external_urls: { spotify: 'https://open.spotify.com/track/1234567890123456789012' } }] } }), { status: 200 });
    }
    if (url.endsWith('/me/playlists')) return new Response(JSON.stringify({ id: 'playlist-1', external_urls: { spotify: 'https://open.spotify.com/playlist/playlist-1' } }), { status: 201 });
    if (url.includes('/playlists/playlist-1/items')) return new Response(JSON.stringify({ snapshot_id: 'snapshot-1' }), { status: 201 });
    throw new Error(`Unexpected URL ${url}`);
  };
  try {
    const provider = createRemoteProvider('spotify', 'test-token');
    const search = await provider.search('imported cut');
    assert.equal(search.ok, true);
    if (!search.ok) return;
    assert.equal(search.data[0]?.spotifyId, '1234567890123456789012');
    assert.equal(search.data[0]?.rawArtistString, 'Artist One feat. Guest');
    const exported = await provider.exportPlaylist('TrackDraft QA', search.data);
    assert.equal(exported.ok, true);
    assert.equal(calls.length, 3);
    assert.match(calls[2]?.body ?? '', /spotify:track:1234567890123456789012/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('YouTube adapter imports playlist items and preserves video links', async () => {
  const previousKey = process.env.YOUTUBE_DATA_API_KEY;
  process.env.YOUTUBE_DATA_API_KEY = 'test-key';
  globalThis.fetch = async () => new Response(JSON.stringify({ items: [{ contentDetails: { videoId: 'abcdefghijk' }, snippet: { title: 'Playlist Cut', channelTitle: 'Channel', publishedAt: '2023-01-01' } }] }), { status: 200 });
  try {
    const provider = createRemoteProvider('youtube', 'test-token');
    const imported = await provider.importPlaylist('https://www.youtube.com/playlist?list=PL-test');
    assert.equal(imported.ok, true);
    if (!imported.ok) return;
    assert.equal(imported.data.songs[0]?.youtubeId, 'abcdefghijk');
    assert.equal(imported.data.songs[0]?.youtubeUrl, 'https://www.youtube.com/watch?v=abcdefghijk');
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.YOUTUBE_DATA_API_KEY;
    else process.env.YOUTUBE_DATA_API_KEY = previousKey;
  }
});

test('remote providers stay unavailable without server credentials', async () => {
  const oldSpotify = process.env.SPOTIFY_ACCESS_TOKEN;
  delete process.env.SPOTIFY_ACCESS_TOKEN;
  try {
    const result = await createRemoteProvider('spotify').search('anything');
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, 'not-configured');
  } finally {
    if (oldSpotify === undefined) delete process.env.SPOTIFY_ACCESS_TOKEN;
    else process.env.SPOTIFY_ACCESS_TOKEN = oldSpotify;
  }
});
