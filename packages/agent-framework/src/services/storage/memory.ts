import { KeyValueStore } from './types';

export class InMemoryStore<K, V> implements KeyValueStore<K, V> {
  private store: Map<K, V>;

  constructor() {
    this.store = new Map();
  }

  async set(key: K, value: V): Promise<void> {
    this.store.set(key, value);
  }

  async get(key: K): Promise<V | null> {
    return this.store.get(key) || null;
  }

  async delete(key: K): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<K[]> {
    return Array.from(this.store.keys());
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
