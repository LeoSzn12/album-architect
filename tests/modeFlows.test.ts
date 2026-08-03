import assert from 'node:assert/strict';
import test from 'node:test';
import { ALBUM_12_TEMPLATE, ALBUM_13_TEMPLATE, ALBUM_14_TEMPLATE, EP_6_TEMPLATE, EP_7_TEMPLATE, validateGameTemplate } from '../src/lib/gameTemplates.ts';
import { reorderTracklist } from '../src/lib/tracklistOrder.ts';

test('EP and Album builder templates cover every required save/resume track count', () => {
  for (const template of [EP_6_TEMPLATE, EP_7_TEMPLATE, ALBUM_12_TEMPLATE, ALBUM_13_TEMPLATE, ALBUM_14_TEMPLATE]) {
    assert.equal(validateGameTemplate(template).valid, true);
    assert.equal(template.slots.length, template.trackCount);
    assert.deepEqual(template.slots.map((slot) => slot.position), Array.from({ length: template.trackCount }, (_, index) => index + 1));
  }
});

test('EP and Album reorder flow returns a new ordered snapshot and protects invalid moves', () => {
  const original = ['intro', 'single', 'interlude', 'outro'];
  const reordered = reorderTracklist(original, 2, 1);
  assert.deepEqual(reordered, ['intro', 'interlude', 'single', 'outro']);
  assert.deepEqual(original, ['intro', 'single', 'interlude', 'outro']);
  assert.deepEqual(reorderTracklist(original, -1, 1), original);
  assert.deepEqual(reorderTracklist(original, 0, 8), original);
});
