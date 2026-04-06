import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export const APP_DIR = path.join(os.homedir(), '.deepwork');
export const DB_PATH = path.join(APP_DIR, 'data.db');

export function ensureAppDir(): void {
  if (!fs.existsSync(APP_DIR)) {
    fs.mkdirSync(APP_DIR, { recursive: true });
  }
}

export function getDbPath(): string {
  ensureAppDir();
  return DB_PATH;
}
