export interface StorageOptions {
  directory?: string;
}

export interface KeyValueStore<K, V> {
  set(key: K, value: V): Promise<void>;
  get(key: K): Promise<V | null>;
  delete(key: K): Promise<void>;
  list(): Promise<K[]>;
  clear(): Promise<void>;
}
