import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  ALBUM_12_TEMPLATE,
  ALBUM_13_TEMPLATE,
  ALBUM_14_TEMPLATE,
  DRAFT_7_TEMPLATE,
  EP_6_TEMPLATE,
  EP_7_TEMPLATE,
  TRACK_DRAFT_SLOT_KEYS,
  validateGameTemplate,
} from '../src/lib/gameTemplates.ts';

describe('Game templates', () => {
  test('exports the configured TrackDraft templates with valid counts', () => {
    for (const template of [
      DRAFT_7_TEMPLATE,
      EP_6_TEMPLATE,
      EP_7_TEMPLATE,
      ALBUM_12_TEMPLATE,
      ALBUM_13_TEMPLATE,
      ALBUM_14_TEMPLATE,
    ]) {
      assert.deepStrictEqual(validateGameTemplate(template), { valid: true, errors: [] });
      assert.strictEqual(template.slots.length, template.trackCount);
    }
  });

  test('keeps the seven TrackDraft semantic keys as additive metadata', () => {
    assert.deepStrictEqual(DRAFT_7_TEMPLATE.trackDraftSlotKeys, TRACK_DRAFT_SLOT_KEYS);
    assert.deepStrictEqual(
      DRAFT_7_TEMPLATE.slots.map((slot) => slot.key),
      [...TRACK_DRAFT_SLOT_KEYS]
    );
  });

  test('rejects duplicate positions', () => {
    const invalid = {
      ...EP_6_TEMPLATE,
      slots: EP_6_TEMPLATE.slots.map((slot, index) =>
        index === 1 ? { ...slot, position: 1 } : slot
      ),
    };

    const result = validateGameTemplate(invalid);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('Duplicate slot positions')));
  });

  test('rejects invalid mode track counts and mismatched slot counts', () => {
    const invalid = { ...ALBUM_12_TEMPLATE, trackCount: 11 };
    const result = validateGameTemplate(invalid);

    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((error) => error.includes('Invalid track count')));
    assert.ok(result.errors.some((error) => error.includes('slots but declares')));
  });
});
