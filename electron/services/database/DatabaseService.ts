import Database from 'better-sqlite3';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import * as schema from '@database/schema';
import { createDatabaseConnection } from './connection';
import { runMigrations } from './migrations';
import { logger } from '../logger/Logger';
import { SystemCatalogService } from '../surveys/SystemCatalogService';
import { MasterKeyService } from '../security/MasterKeyService';

export class DatabaseService {
  private sqlite: Database.Database | null = null;
  private db: BetterSQLite3Database<typeof schema> | null = null;
  private dynamicDb: BetterSQLite3Database<typeof schema> | null = null;
  private dynamicSqlite: Database.Database | null = null;
  private dbPath: string = '';
  private emergencyBackupDir: string = '';
  private masterKeyService: MasterKeyService | null = null;

  public getDynamicDb(): BetterSQLite3Database<typeof schema> {
    if (!this.dynamicDb) {
      this.dynamicDb = new Proxy({} as BetterSQLite3Database<typeof schema>, {
        get: (_target, prop, receiver) => {
          const activeDb = this.getRawDb();
          const value = Reflect.get(activeDb as any, prop, receiver);
          if (typeof value === 'function') {
            return value.bind(activeDb);
          }
          return value;
        }
      });
    }
    return this.dynamicDb;
  }

  public getDynamicSqlite(): Database.Database {
    if (!this.dynamicSqlite) {
      this.dynamicSqlite = new Proxy({} as Database.Database, {
        get: (_target, prop, receiver) => {
          const activeSqlite = this.getRawSqlite();
          const value = Reflect.get(activeSqlite as any, prop, receiver);
          if (typeof value === 'function') {
            return value.bind(activeSqlite);
          }
          return value;
        },
        set: (_target, prop, value, receiver) => {
          const activeSqlite = this.getRawSqlite();
          return Reflect.set(activeSqlite as any, prop, value, receiver);
        }
      });
    }
    return this.dynamicSqlite;
  }

  public init(userDataPath: string): { db: BetterSQLite3Database<typeof schema>; sqlite: Database.Database } {
    const dbDir = path.join(userDataPath, 'database');
    this.dbPath = path.join(dbDir, 'pdr.sqlite');
    this.emergencyBackupDir = path.join(userDataPath, 'backups', 'local_emergency');

    // Initialize machine-bound Master Identity Service
    this.masterKeyService = new MasterKeyService(userDataPath);

    const conn = createDatabaseConnection(this.dbPath);
    this.sqlite = conn.sqlite;
    this.db = conn.db;

    // Run schema migrations
    runMigrations(this.sqlite, this.emergencyBackupDir);

    // Initialize or get Device ID from Master Identity Service
    const deviceId = this.ensureDeviceId();

    // Ensure default school and school_years records exist for foreign key integrity
    this.ensureDefaultInstitutionalRecords(deviceId);

    // Ensure official system catalogs (e.g. Devamsızlık Nedenleri Anketi) are seeded
    SystemCatalogService.seedAllCatalogs(this.sqlite, deviceId);

    return { db: this.getDynamicDb(), sqlite: this.getDynamicSqlite() };
  }

  public getMasterKeyService(): MasterKeyService {
    if (!this.masterKeyService) {
      const fallbackDir = this.dbPath ? path.dirname(path.dirname(this.dbPath)) : process.cwd();
      this.masterKeyService = new MasterKeyService(fallbackDir);
    }
    return this.masterKeyService;
  }

  public ensureDefaultInstitutionalRecords(deviceId: string): void {
    if (!this.sqlite) return;

    const now = Date.now();
    const schoolName = this.getMeta('school_name') || 'Cumhuriyet Anadolu Lisesi';
    const counselorName = this.getMeta('counselor_name') || 'Psikolojik Danışman';
    const academicYear = this.getMeta('academic_year') || '2026-2027';

    // 1. Ensure default school exists
    const existingSchool = this.sqlite.prepare('SELECT id FROM schools WHERE id = ?').get('default-school');
    if (!existingSchool) {
      this.sqlite.prepare(`
        INSERT INTO schools (id, name, counselor_name, created_at, updated_at, version, last_modified_device_id)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run('default-school', schoolName, counselorName, now, now, deviceId);
      logger.info('Initialized default school record (default-school)');
    }

    // 2. Ensure default school_year exists
    const existingYear = this.sqlite.prepare('SELECT id FROM school_years WHERE id = ?').get('default-year');
    if (!existingYear) {
      this.sqlite.prepare(`
        INSERT INTO school_years (id, name, start_date, end_date, is_active, is_archived, created_at, updated_at, version, last_modified_device_id)
        VALUES (?, ?, ?, ?, 1, 0, ?, ?, 1, ?)
      `).run('default-year', academicYear, '2026-09-01', '2027-06-30', now, now, deviceId);
      logger.info('Initialized default school year record (default-year)');
    }

    // 3. Ensure active_school_year_id meta is set
    if (!this.getMeta('active_school_year_id')) {
      this.setMeta('active_school_year_id', 'default-year');
    }
  }

  public checkpoint(): void {
    if (this.sqlite) {
      try {
        this.sqlite.pragma('wal_checkpoint(FULL)');
      } catch (err) {
        logger.warn('WAL checkpoint error:', err);
      }
    }
  }

  public getRawDb(): BetterSQLite3Database<typeof schema> {
    if (!this.db) throw new Error('DatabaseService has not been initialized');
    return this.db;
  }

  public getRawSqlite(): Database.Database {
    if (!this.sqlite) throw new Error('DatabaseService has not been initialized');
    return this.sqlite;
  }

  public getDb(): BetterSQLite3Database<typeof schema> {
    return this.getDynamicDb();
  }

  public getSqlite(): Database.Database {
    return this.getDynamicSqlite();
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public getMeta(key: string): string | null {
    if (!this.sqlite) return null;
    const row = this.sqlite.prepare('SELECT value FROM app_meta WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  public setMeta(key: string, value: string): void {
    if (!this.sqlite) return;
    this.sqlite.prepare(`
      INSERT INTO app_meta (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, Date.now());
  }

  public ensureDeviceId(): string {
    const masterSvc = this.getMasterKeyService();
    const deviceId = masterSvc.getDeviceId();

    // Register in devices table for SQLite foreign keys and local record reference
    if (this.sqlite) {
      try {
        const existing = this.sqlite.prepare('SELECT id FROM devices WHERE id = ?').get(deviceId);
        if (!existing) {
          this.sqlite.prepare(`
            INSERT INTO devices (id, name, app_version, registered_at, last_seen_at, is_current_device)
            VALUES (?, ?, ?, ?, ?, 1)
          `).run(deviceId, 'Primary PC', '2.0.0', Date.now(), Date.now());
          logger.info(`Registered device in database devices table: ${deviceId}`);
        }
      } catch (err) {
        logger.warn('Could not insert device record into devices table:', err);
      }
    }
    return deviceId;
  }

  public close(): void {
    if (this.sqlite) {
      this.sqlite.close();
      this.sqlite = null;
      this.db = null;
      logger.info('Closed SQLite database connection');
    }
  }
}

export const databaseService = new DatabaseService();
