import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from '@database/schema';
import { logger } from '../logger/Logger';

export function createDatabaseConnection(dbPath: string): { db: BetterSQLite3Database<typeof schema>; sqlite: Database.Database } {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  logger.info(`Opening SQLite database at ${dbPath}`);
  const sqlite = new Database(dbPath);

  // Apply high-performance & safety PRAGMAs
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('temp_store = MEMORY');
  sqlite.pragma('cache_size = -64000'); // 64MB cache
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
