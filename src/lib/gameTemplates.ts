import { ALBUM_SLOTS, EP_SLOTS } from '../data/slots.ts';
import type { DraftSlot, GameMode, SlotId } from '../types/draft.ts';

/** The stable semantic keys used by the seven-round TrackDraft mode. */
export const TRACK_DRAFT_SLOT_KEYS = [
  'intro_statement',
  'lead_single',
  'club_banger',
  'feature_collaboration',
  'rnb_emotional_turn',
  'deep_cut_risk',
  'outro_resolution',
] as const;

export type TrackDraftSlotKey = (typeof TRACK_DRAFT_SLOT_KEYS)[number];
export type TemplateMode = GameMode | 'draft';

/** A DraftSlot with template-local position and stable semantic metadata. */
export type TemplateSlot = DraftSlot & {
  position: number;
  key: string;
};

export interface GameTemplate {
  id: 'draft-7' | 'ep-6' | 'ep-7' | 'album-12' | 'album-13' | 'album-14';
  mode: TemplateMode;
  name: string;
  trackCount: number;
  slots: readonly TemplateSlot[];
  /** Present for Draft to preserve the product-level TrackDraft slot vocabulary. */
  trackDraftSlotKeys?: readonly TrackDraftSlotKey[];
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
}

const TRACK_COUNT_RULES: Record<TemplateMode, readonly number[]> = {
  draft: [7],
  ep: [6, 7],
  album: [12, 13, 14],
};

function templateSlot(
  source: DraftSlot,
  position: number,
  key: string,
  overrides: Partial<Pick<DraftSlot, 'name' | 'description'>> = {}
): TemplateSlot {
  return {
    ...source,
    ...overrides,
    roundNumber: position,
    position,
    key,
  };
}

function sourceSlot(id: SlotId): DraftSlot {
  return [...EP_SLOTS, ...ALBUM_SLOTS].find((slot) => slot.id === id) as DraftSlot;
}

const draftSlots: readonly TemplateSlot[] = [
  templateSlot(sourceSlot('cinematic-intro'), 1, 'intro_statement', { name: 'Intro / Statement' }),
  templateSlot(sourceSlot('statement-banger'), 2, 'lead_single', { name: 'Lead Single' }),
  templateSlot(sourceSlot('club-bounce'), 3, 'club_banger', { name: 'Club Banger / Energy Peak' }),
  templateSlot(sourceSlot('experimental-flex'), 4, 'feature_collaboration', { name: 'Feature / Collaboration' }),
  templateSlot(sourceSlot('late-night-rnb'), 5, 'rnb_emotional_turn', { name: 'R&B / Emotional Turn' }),
  templateSlot(sourceSlot('storyteller-cut'), 6, 'deep_cut_risk', { name: 'Deep Cut / Risk' }),
  templateSlot(sourceSlot('cinematic-outro'), 7, 'outro_resolution', { name: 'Outro / Resolution' }),
];

function slotsFrom(source: readonly DraftSlot[], count: number): readonly TemplateSlot[] {
  return source.slice(0, count).map((slot, index) =>
    templateSlot(slot, index + 1, slot.id)
  );
}

export const DRAFT_7_TEMPLATE: GameTemplate = {
  id: 'draft-7',
  mode: 'draft',
  name: 'Seven-Round TrackDraft',
  trackCount: 7,
  slots: draftSlots,
  trackDraftSlotKeys: TRACK_DRAFT_SLOT_KEYS,
};

export const EP_6_TEMPLATE: GameTemplate = {
  id: 'ep-6',
  mode: 'ep',
  name: 'Compact EP (6 tracks)',
  trackCount: 6,
  slots: slotsFrom(EP_SLOTS, 6),
};

export const EP_7_TEMPLATE: GameTemplate = {
  id: 'ep-7',
  mode: 'ep',
  name: 'Guided EP (7 tracks)',
  trackCount: 7,
  slots: slotsFrom(EP_SLOTS, 7),
};

export const ALBUM_12_TEMPLATE: GameTemplate = {
  id: 'album-12',
  mode: 'album',
  name: 'Album (12 tracks)',
  trackCount: 12,
  slots: slotsFrom(ALBUM_SLOTS, 12),
};

export const ALBUM_13_TEMPLATE: GameTemplate = {
  id: 'album-13',
  mode: 'album',
  name: 'Album (13 tracks)',
  trackCount: 13,
  slots: slotsFrom(ALBUM_SLOTS, 13),
};

export const ALBUM_14_TEMPLATE: GameTemplate = {
  id: 'album-14',
  mode: 'album',
  name: 'Album (14 tracks)',
  trackCount: 14,
  slots: slotsFrom(ALBUM_SLOTS, 14),
};

export const GAME_TEMPLATES = {
  'draft-7': DRAFT_7_TEMPLATE,
  'ep-6': EP_6_TEMPLATE,
  'ep-7': EP_7_TEMPLATE,
  'album-12': ALBUM_12_TEMPLATE,
  'album-13': ALBUM_13_TEMPLATE,
  'album-14': ALBUM_14_TEMPLATE,
} as const;

export function validateGameTemplate(template: GameTemplate): TemplateValidationResult {
  const errors: string[] = [];
  const allowedTrackCounts = TRACK_COUNT_RULES[template.mode] ?? [];

  if (!Number.isInteger(template.trackCount) || !allowedTrackCounts.includes(template.trackCount)) {
    errors.push(`Invalid track count ${template.trackCount} for ${template.mode}; expected ${allowedTrackCounts.join(' or ')}.`);
  }

  if (template.slots.length !== template.trackCount) {
    errors.push(`Template has ${template.slots.length} slots but declares ${template.trackCount} tracks.`);
  }

  const positions = template.slots.map((slot) => slot.position);
  const duplicatePositions = positions.filter((position, index) => positions.indexOf(position) !== index);
  if (duplicatePositions.length > 0) {
    errors.push(`Duplicate slot positions: ${[...new Set(duplicatePositions)].join(', ')}.`);
  }

  const expectedPositions = Number.isInteger(template.trackCount) && template.trackCount > 0
    ? Array.from({ length: template.trackCount }, (_, index) => index + 1)
    : [];
  if (positions.some((position) => !Number.isInteger(position) || position < 1 || position > template.trackCount)
    || positions.length === template.trackCount && expectedPositions.some((position) => !positions.includes(position))) {
    errors.push(`Slot positions must be the consecutive values 1 through ${template.trackCount}.`);
  }

  if (template.id === 'draft-7' && template.trackDraftSlotKeys?.length !== TRACK_DRAFT_SLOT_KEYS.length) {
    errors.push('draft-7 must include all seven TrackDraft slot keys as metadata.');
  }

  return { valid: errors.length === 0, errors };
}

export const validateTemplate = validateGameTemplate;

export function assertValidGameTemplate(template: GameTemplate): void {
  const result = validateGameTemplate(template);
  if (!result.valid) {
    throw new Error(`Invalid game template "${template.id}": ${result.errors.join(' ')}`);
  }
}

export function isValidGameTemplate(template: GameTemplate): boolean {
  return validateGameTemplate(template).valid;
}
