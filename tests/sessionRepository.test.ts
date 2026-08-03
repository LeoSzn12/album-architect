import assert from 'node:assert';
import { test, describe } from 'node:test';
import { clearSessionsForTests, createSession, getSession, reorderSessionPicks, saveSessionPick, submitSession } from '../src/lib/sessionRepository.ts';
import { SONG_LIBRARY } from '../src/data/songs.ts';

describe('prototype session repository contract', () => {
  test('creates, replaces, and submits a complete session', () => {
    clearSessionsForTests();
    const session = createSession({ mode: 'draft', trackCount: 2, creatorAlias: '  Curator  ' });
    assert.strictEqual(session.creatorAlias, 'Curator');
    assert.strictEqual(session.status, 'drafting');
    const first = saveSessionPick(session.id, {
      position: 1,
      slotId: 'cinematic-intro',
      song: SONG_LIBRARY[0],
      selectionSource: 'recommendation',
      lockedAt: new Date().toISOString(),
    });
    assert.ok(first);
    const replaced = saveSessionPick(session.id, {
      position: 1,
      slotId: 'cinematic-intro',
      song: SONG_LIBRARY[1],
      selectionSource: 'search',
      lockedAt: new Date().toISOString(),
    });
    assert.strictEqual(replaced?.picks.length, 1);
    assert.strictEqual(replaced?.picks[0].song.id, SONG_LIBRARY[1].id);
    saveSessionPick(session.id, {
      position: 2,
      slotId: 'statement-banger',
      song: SONG_LIBRARY[2],
      selectionSource: 'link',
      lockedAt: new Date().toISOString(),
    });
    const submitted = submitSession(session.id);
    assert.strictEqual(submitted?.status, 'submitted');
    assert.strictEqual(getSession(session.id)?.status, 'submitted');
  });

  test('does not submit incomplete sessions', () => {
    clearSessionsForTests();
    const session = createSession({ mode: 'ep', trackCount: 6 });
    assert.strictEqual(submitSession(session.id), null);
  });

  test('reorders a drafting session by original positions', () => {
    clearSessionsForTests();
    const session = createSession({ mode: 'ep', trackCount: 3 });
    for (const [index, song] of SONG_LIBRARY.slice(0, 3).entries()) {
      saveSessionPick(session.id, {
        position: index + 1,
        slotId: `slot-${index + 1}`,
        song,
        selectionSource: 'recommendation',
        lockedAt: new Date().toISOString(),
      });
    }
    const reordered = reorderSessionPicks(session.id, [3, 1, 2]);
    assert.deepStrictEqual(reordered?.picks.map((pick) => pick.song.id), SONG_LIBRARY.slice(0, 3).map((song) => song.id).reverse().slice(0, 1).concat(SONG_LIBRARY.slice(0, 2).map((song) => song.id)));
    assert.deepStrictEqual(reordered?.picks.map((pick) => pick.position), [1, 2, 3]);
  });
});
