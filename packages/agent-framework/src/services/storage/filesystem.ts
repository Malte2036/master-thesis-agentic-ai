import { promises as fs } from 'fs';
import path from 'path';
import { KeyValueStore, StorageOptions } from './types';

export class FileSystemStore<K extends string, V>
  implements KeyValueStore<K, V>
{
  private readonly baseDirectory: string;

  constructor(options: StorageOptions = {}) {
    this.baseDirectory = options.directory || path.join(process.cwd(), 'data');
  }

  private getFilePath(key: K): string {
    return path.join(this.baseDirectory, `${key}.json`);
  }

  async set(key: K, value: V): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.mkdir(this.baseDirectory, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to set value: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async get(key: K): Promise<V | null> {
    const filePath = this.getFilePath(key);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as V;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new Error(
        `Failed to get value: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(key: K): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw new Error(
        `Failed to delete value: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async list(): Promise<K[]> {
    try {
      await fs.mkdir(this.baseDirectory, { recursive: true });
      const files = await fs.readdir(this.baseDirectory);
      return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', '') as K);
    } catch (error) {
      throw new Error(
        `Failed to list keys: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await this.list();
      await Promise.all(files.map((key) => this.delete(key)));
    } catch (error) {
      throw new Error(
        `Failed to clear store: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
