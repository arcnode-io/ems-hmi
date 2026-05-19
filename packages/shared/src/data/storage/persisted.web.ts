/** Web KV store backed by window.localStorage. Async API for symmetry. */

export interface PersistedKv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

function backend(): Storage | null {
  const g = globalThis as unknown as { localStorage?: Storage };
  return g.localStorage ?? null;
}

export const kv: PersistedKv = {
  async get(key) {
    return backend()?.getItem(key) ?? null;
  },
  async set(key, value) {
    backend()?.setItem(key, value);
  },
  async remove(key) {
    backend()?.removeItem(key);
  },
};
