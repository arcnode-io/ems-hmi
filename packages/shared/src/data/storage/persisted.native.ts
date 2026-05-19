/** Native KV store backed by AsyncStorage. */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PersistedKv {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export const kv: PersistedKv = {
  async get(key) {
    return AsyncStorage.getItem(key);
  },
  async set(key, value) {
    await AsyncStorage.setItem(key, value);
  },
  async remove(key) {
    await AsyncStorage.removeItem(key);
  },
};
