import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const COOKIE_PREFIX = 'trackdraft_provider_';

function key() {
  const secret = process.env.PROVIDER_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? createHash('sha256').update(secret).digest() : null;
}

function encode(value: Buffer) {
  return value.toString('base64url');
}

function decode(value: string) {
  return Buffer.from(value, 'base64url');
}

/** Encrypts short-lived OAuth state and provider access tokens for httpOnly cookies. */
export function sealProviderSession(value: string) {
  const secret = key();
  if (!secret) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', secret, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(ciphertext)}`;
}

export function openProviderSession(value: string | undefined) {
  const secret = key();
  if (!secret || !value) return null;
  try {
    const [ivPart, tagPart, ciphertextPart] = value.split('.');
    if (!ivPart || !tagPart || !ciphertextPart) return null;
    const decipher = createDecipheriv('aes-256-gcm', secret, decode(ivPart));
    decipher.setAuthTag(decode(tagPart));
    return Buffer.concat([decipher.update(decode(ciphertextPart)), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function providerCookieName(provider: 'spotify' | 'youtube') {
  return `${COOKIE_PREFIX}${provider}`;
}

export function providerOAuthCookieName(provider: 'spotify' | 'youtube') {
  return `${COOKIE_PREFIX}oauth_${provider}`;
}
