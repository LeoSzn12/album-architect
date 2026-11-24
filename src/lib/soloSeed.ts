/**
 * Solo drafts get a hidden seed too, so a "beat my week one" link can drop a
 * friend into the same song pool. Solo seeds start with SOLO- and are never
 * shown as a 1v1 code or carried into the next draft.
 */
export const SOLO_SEED_PREFIX = 'SOLO-';

export function isSoloSeed(seed: string | null | undefined): boolean {
  return Boolean(seed && seed.startsWith(SOLO_SEED_PREFIX));
}

export function makeSoloSeed(random: () => number = Math.random): string {
  let id = '';
  for (let i = 0; i < 8; i++) id += Math.floor(random() * 36).toString(36);
  return `${SOLO_SEED_PREFIX}${id.toUpperCase()}`;
}
