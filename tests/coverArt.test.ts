import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coverSrc, coverSrcSet } from '../src/lib/coverArt.ts';

const big = 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/12/8b/ce/abc/093624947172.jpg/1000x1000bb.jpg';

test('Apple artwork links are resized', () => {
  assert.equal(coverSrc(big), 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/12/8b/ce/abc/093624947172.jpg/300x300bb.jpg');
  assert.equal(coverSrc(big, 'large').endsWith('/600x600bb.jpg'), true);
  assert.equal(coverSrcSet(big), `${coverSrc(big)} 300w, ${coverSrc(big, 'large')} 600w`);
  const deezer = 'https://cdn-images.dzcdn.net/images/cover/ca42a0630c1d60391ac44f3be6abcac0/1000x1000-000000-80-0-0.jpg';
  assert.equal(coverSrc(deezer), 'https://cdn-images.dzcdn.net/images/cover/ca42a0630c1d60391ac44f3be6abcac0/250x250-000000-80-0-0.jpg');
  assert.equal(coverSrc(deezer, 'large').includes('/500x500-'), true);
});

test('other links are left alone', () => {
  for (const url of ['https://example.com/cover.jpg', 'https://is1-ssl.mzstatic.com/image/thumb/x/source.jpg', '']) {
    assert.equal(coverSrc(url), url);
    assert.equal(coverSrcSet(url), undefined);
  }
});

test('every catalogue cover is an Apple link the resizer understands', async () => {
  const { SONG_LIBRARY } = await import('../src/data/songs.ts');
  const covers = SONG_LIBRARY.map((song) => song.artwork).filter((url): url is string => Boolean(url));
  assert.ok(covers.length > 100);
  for (const url of covers) assert.match(coverSrc(url), /\/(300x300bb|250x250-000000-80-0-0)\.jpg$/);
});
