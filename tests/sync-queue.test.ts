import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabaseConnection } from '../electron/services/database/connection';
import { runMigrations } from '../electron/services/database/migrations';
import { SyncEngine } from '../electron/services/sync/SyncEngine';

describe('SyncEngine & sync_changes Queue (Local-First)', () => {
  const tempDir = path.join(process.cwd(), 'temp_sync_test_db');
  const dbPath = path.join(tempDir, 'test_sync.sqlite');
  let sqlite: Database.Database;
  let syncEngine: SyncEngine;

  beforeEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    const conn = createDatabaseConnection(dbPath);
    sqlite = conn.sqlite;
    runMigrations(sqlite);
    syncEngine = new SyncEngine(conn.db, 'DEVICE-7F3A91');
  });

  afterEach(() => {
    if (sqlite) sqlite.close();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should queue a mutation with base_version and snapshot into local SQLite', async () => {
    const studentId = 'st-001';
    const baseSnapshot = { id: studentId, phone: '0555 111 0000', version: 1 };
    const payload = { id: studentId, phone: '0555 222 3333', version: 2 };

    syncEngine.queueChange(
      'students',
      studentId,
      'update',
      1, // baseVersion
      2, // newVersion
      baseSnapshot,
      payload
    );

    const status = syncEngine.getStatus();
    expect(status.state).toBe('synced');

    const row = sqlite.prepare('SELECT * FROM sync_changes WHERE entity_id = ?').get(studentId) as any;
    expect(row).toBeDefined();
    expect(row.base_version).toBe(1);
    expect(row.new_version).toBe(2);
    expect(JSON.parse(row.base_snapshot).phone).toBe('0555 111 0000');
    expect(JSON.parse(row.payload).phone).toBe('0555 222 3333');
    expect(row.synced_at).not.toBeNull();
  });
});
