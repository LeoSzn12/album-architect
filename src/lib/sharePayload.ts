/**
 * The public, secret-free contract used by /share.
 * Keep this deliberately smaller than the internal draft/evaluation objects so
 * shared URLs remain stable even when the app's internal state evolves.
 */
export interface ShareTrack {
  title: string;
  artist: string;
}

export interface ShareCategory {
  label: string;
  score: number;
}

export interface SharePayload {
  version: 1;
  projectTitle: string;
  creator: string;
  score: number;
  grade: string;
  topTracks: [ShareTrack, ShareTrack, ShareTrack];
  opponentScore?: number;
  challengeCode: string;
  categories: ShareCategory[];
}

const MAX_TEXT_LENGTH = 120;
const MAX_TRACK_TEXT_LENGTH = 100;
const MAX_CATEGORIES = 7;
const MAX_ENCODED_LENGTH = 8_192;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;

const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key));

function validateTrack(value: unknown): value is ShareTrack {
  if (!isRecord(value) || !hasOnlyKeys(value, ['title', 'artist'])) return false;
  return isText(value.title, MAX_TRACK_TEXT_LENGTH) && isText(value.artist, MAX_TRACK_TEXT_LENGTH);
}

function validateCategory(value: unknown): value is ShareCategory {
  if (!isRecord(value) || !hasOnlyKeys(value, ['label', 'score'])) return false;
  return isText(value.label, MAX_TEXT_LENGTH) && isFiniteNumber(value.score) && value.score >= 0 && value.score <= 100;
}

/** Throws a TypeError when the value is not safe to encode or render. */
export function assertSharePayload(value: unknown): asserts value is SharePayload {
  if (!isRecord(value) || !hasOnlyKeys(value, ['version', 'projectTitle', 'creator', 'score', 'grade', 'topTracks', 'opponentScore', 'challengeCode', 'categories'])) {
    throw new TypeError('Invalid share payload shape.');
  }

  if (value.version !== 1 || !isText(value.projectTitle, MAX_TEXT_LENGTH) || !isText(value.creator, MAX_TEXT_LENGTH)) {
    throw new TypeError('Invalid share payload identity.');
  }
  if (!isFiniteNumber(value.score) || value.score < 0 || value.score > 10) {
    throw new TypeError('Share score must be between 0 and 10.');
  }
  if (!isText(value.grade, MAX_TEXT_LENGTH) || !isText(value.challengeCode, 40)) {
    throw new TypeError('Invalid share payload metadata.');
  }
  if (!Array.isArray(value.topTracks) || value.topTracks.length !== 3 || !value.topTracks.every(validateTrack)) {
    throw new TypeError('Share payload must contain exactly three valid tracks.');
  }
  if (value.opponentScore !== undefined && (!isFiniteNumber(value.opponentScore) || value.opponentScore < 0 || value.opponentScore > 10)) {
    throw new TypeError('Opponent score must be between 0 and 10.');
  }
  if (!Array.isArray(value.categories) || value.categories.length < 1 || value.categories.length > MAX_CATEGORIES || !value.categories.every(validateCategory)) {
    throw new TypeError('Share payload categories are invalid.');
  }
}

function toBase64Url(json: string): string {
  if (typeof btoa === 'function') {
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
  }
  return Buffer.from(json, 'utf8').toString('base64url');
}

function fromBase64Url(encoded: string): string {
  if (!/^[A-Za-z0-9_-]+$/u.test(encoded) || encoded.length > MAX_ENCODED_LENGTH) {
    throw new TypeError('Invalid share data encoding.');
  }
  if (typeof atob === 'function') {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (encoded.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(encoded, 'base64url').toString('utf8');
}

export function encodeSharePayload(payload: SharePayload): string {
  assertSharePayload(payload);
  const encoded = toBase64Url(JSON.stringify(payload));
  if (encoded.length > MAX_ENCODED_LENGTH) throw new TypeError('Share payload is too large.');
  return encoded;
}

export function decodeSharePayload(encoded: string): SharePayload {
  if (typeof encoded !== 'string') throw new TypeError('Share data must be a string.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(encoded));
  } catch {
    throw new TypeError('Share data is not valid JSON.');
  }
  assertSharePayload(parsed);
  return parsed;
}
