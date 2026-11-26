import type { PersistStorage, StorageValue } from 'zustand/middleware';

/**
 * localStorage for the saved game, written in batches.
 *
 * The store changes many times per pick (options, rival, crowd, timers). The
 * default storage turns the whole save into text and writes it on every
 * change, which costs a phone real time on each tap. This keeps the newest
 * value in memory and writes it once things settle, and right away when the
 * tab is hidden or closed, so nothing is lost.
 */
export function batchedLocalStorage<S>(delayMs = 400): PersistStorage<S> {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  const pending = new Map<string, StorageValue<S>>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    for (const [name, value] of pending) {
      try {
        window.localStorage.setItem(name, JSON.stringify(value));
      } catch {
        // Storage full or blocked (private mode): the game keeps working in memory.
      }
    }
    pending.clear();
  };

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  return {
    getItem: (name) => {
      const queued = pending.get(name);
      if (queued) return queued;
      try {
        const raw = window.localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as StorageValue<S>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending.set(name, value);
      if (!timer) timer = setTimeout(flush, delayMs);
    },
    removeItem: (name) => {
      pending.delete(name);
      try { window.localStorage.removeItem(name); } catch { /* ignore */ }
    },
  };
}
