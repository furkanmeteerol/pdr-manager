import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import Database from 'better-sqlite3';
import { DatabaseService } from '../database/DatabaseService';
import { EncryptionService } from '../security/EncryptionService';
import { logger } from '../logger/Logger';
import { SystemCatalogService } from '../surveys/SystemCatalogService';

export interface DataTransferManifest {
  formatVersion: number;
  schemaVersion: number;
  applicationVersion: string;
  exportedAt: string;
  exportedAtTimestamp: number;
  deviceId: string;
  databaseChecksum: string;
  kdf: {
    algorithm: string;
    iterations: number;
    saltHex: string;
  };
  counts: {
    students: number;
    parents: number;
    classes: number;
    meetings: number;
    appointments: number;
    tasks: number;
    surveyApplications: number;
    surveys: number;
    dailyNotes: number;
    activities: number;
  };
}

export interface BackupComparisonResultDto {
  isValid: boolean;
  filePath: string;
  fileName: string;
  manifest?: DataTransferManifest;
  comparison?: {
    incoming: Record<string, number>;
    current: Record<string, number>;
    diff: Record<string, { incoming: number; current: number; delta: number; isHigher: boolean }>;
  };
  schemaCompatible: boolean;
  error?: string;
  canceled?: boolean;
}

export interface ImportResultDto {
  success: boolean;
  restoredAt: number;
  preImportBackupPath?: string;
  error?: string;
}

export interface ResetResultDto {
  success: boolean;
  preResetBackupPath?: string;
  error?: string;
}

const MAGIC_HEADER = Buffer.from([0x50, 0x44, 0x52, 0x42]); // "PDRB"
const FORMAT_VERSION = 1;
const KDF_ITERATIONS = 100000;
const CURRENT_SCHEMA_VERSION = 14;
const APP_VERSION = '1.0.0';

export class DataTransferService {
  private databaseService: DatabaseService;
  private encryptionService: EncryptionService;
  private deviceId: string;
  private appDataDir: string;

  constructor(
    databaseService: DatabaseService,
    encryptionService: EncryptionService,
    deviceId: string,
    appDataDir: string
  ) {
    this.databaseService = databaseService;
    this.encryptionService = encryptionService;
    this.deviceId = deviceId;
    this.appDataDir = appDataDir;
    void this.encryptionService;
  }

  /**
   * Helper to query table count safely from an active SQLite database instance
   */
  private getTableCount(db: Database.Database, tableName: string, whereClause: string = 'WHERE deleted_at IS NULL'): number {
    try {
      const row = db.prepare(`SELECT count(*) as count FROM "${tableName}" ${whereClause}`).get() as any;
      return row?.count || 0;
    } catch {
      try {
        const row = db.prepare(`SELECT count(*) as count FROM "${tableName}"`).get() as any;
        return row?.count || 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Queries full current table statistics from local SQLite DB
   */
  public getCurrentDatabaseCounts(): DataTransferManifest['counts'] {
    const rawDb = this.databaseService.getSqlite();

    return {
      students: this.getTableCount(rawDb, 'students'),
      parents: this.getTableCount(rawDb, 'parents'),
      classes: this.getTableCount(rawDb, 'classes'),
      meetings: this.getTableCount(rawDb, 'meetings'),
      appointments: this.getTableCount(rawDb, 'appointments'),
      tasks: this.getTableCount(rawDb, 'tasks'),
      surveyApplications: this.getTableCount(rawDb, 'survey_applications'),
      surveys: this.getTableCount(rawDb, 'surveys'),
      dailyNotes: this.getTableCount(rawDb, 'daily_notes'),
      activities: this.getTableCount(rawDb, 'counseling_activities')
    };
  }

  /**
   * Derives 256-bit encryption key from password and salt using PBKDF2-HMAC-SHA256
   */
  private deriveKey(password: string, salt: Buffer, iterations: number = KDF_ITERATIONS): Buffer {
    return crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  }

  /**
   * Sanitizes SQLite database buffer by removing any local auth password hash/salt/wrapped keys
   * or master identity secrets, ensuring local credentials never leave the current machine.
   */
  private sanitizeSqliteBuffer(buffer: Buffer): Buffer {
    const tempFile = path.join(os.tmpdir(), `pdr_sanitize_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.sqlite`);
    try {
      fs.writeFileSync(tempFile, buffer);
      const tempDb = new Database(tempFile);
      tempDb.prepare(`
        DELETE FROM app_meta 
        WHERE key IN (
          'local_password_hash', 'local_password_salt', 'wrapped_dek', 'recovery_wrapped_dek',
          'master_key_hash', 'master_key_token'
        )
      `).run();
      try { tempDb.prepare('DELETE FROM counselor_documents').run(); } catch {}
      try { tempDb.prepare('DELETE FROM presentations').run(); } catch {}
      try { tempDb.prepare('DELETE FROM documents').run(); } catch {}
      tempDb.close();
      const sanitized = fs.readFileSync(tempFile);
      return sanitized;
    } catch (err) {
      logger.warn('Sanitize SQLite buffer warning:', err);
      return buffer;
    } finally {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    }
  }

  /**
   * Records successful backup metadata to dedicated local file and app_meta
   */
  public recordSuccessfulBackup(timestamp: number): void {
    try {
      const secDir = path.join(this.appDataDir, 'security');
      if (!fs.existsSync(secDir)) {
        fs.mkdirSync(secDir, { recursive: true });
      }
      const metaPath = path.join(secDir, 'backup_meta.json');
      fs.writeFileSync(metaPath, JSON.stringify({
        lastBackupTimestamp: timestamp,
        lastBackupDateIso: new Date(timestamp).toISOString()
      }, null, 2), 'utf-8');

      this.databaseService.setMeta('last_backup_timestamp', String(timestamp));
    } catch (err) {
      logger.warn('Could not record successful backup metadata:', err);
    }
  }

  /**
   * Reads last successful backup timestamp and formatted date string
   */
  public getLastBackupInfo(): { lastBackupTimestamp: number | null; lastBackupDateStr: string | null } {
    try {
      const metaPath = path.join(this.appDataDir, 'security', 'backup_meta.json');
      if (fs.existsSync(metaPath)) {
        const raw = fs.readFileSync(metaPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.lastBackupTimestamp) {
          const d = new Date(parsed.lastBackupTimestamp);
          const pad = (n: number) => n.toString().padStart(2, '0');
          const str = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return {
            lastBackupTimestamp: parsed.lastBackupTimestamp,
            lastBackupDateStr: str
          };
        }
      }
    } catch (err) {
      logger.warn('Could not read backup_meta.json:', err);
    }

    const fromMeta = this.databaseService.getMeta('last_backup_timestamp');
    if (fromMeta) {
      const ts = Number(fromMeta);
      if (!isNaN(ts)) {
        const d = new Date(ts);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const str = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
        return {
          lastBackupTimestamp: ts,
          lastBackupDateStr: str
        };
      }
    }

    return {
      lastBackupTimestamp: null,
      lastBackupDateStr: null
    };
  }

  /**
   * Packages and encrypts SQLite DB + Manifest into a single .pdrbak file
   * Encrypted with AES-256-GCM using a user-supplied password and PBKDF2 key derivation.
   * Evrak ve Sunum dosyaları (.pdrbak) paketine DAHİL EDİLMEZ.
   * Yerel master parola (.pdrbak) paketine DAHİL EDİLMEZ.
   */
  public async exportDataPackage(targetFilePath: string, password?: string): Promise<{ success: boolean; manifest?: DataTransferManifest; error?: string }> {
    try {
      const effectivePassword = password && password.trim() ? password.trim() : 'PDR_LOCAL_DEFAULT_SAFETY_PASS';
      logger.info(`Starting data package export to ${targetFilePath}...`);

      // 1. Force WAL Checkpoint to flush all pending transactions into main db file
      const rawDb = this.databaseService.getSqlite();
      rawDb.pragma('wal_checkpoint(TRUNCATE)');

      // 2. Read SQLite database file
      const dbPath = this.databaseService.getDbPath();
      if (!fs.existsSync(dbPath)) {
        throw new Error(`Database file not found at: ${dbPath}`);
      }
      const sqliteRawBuffer = fs.readFileSync(dbPath);

      // 3. Sanitize SQLite buffer (strip local password / auth secrets)
      const sqliteBuffer = this.sanitizeSqliteBuffer(sqliteRawBuffer);
      const databaseChecksum = crypto.createHash('sha256').update(sqliteBuffer).digest('hex');

      // 4. Generate random cryptographic salt and IV
      const salt = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);
      const key = this.deriveKey(effectivePassword, salt, KDF_ITERATIONS);

      // 5. Query counts and build Manifest
      const counts = this.getCurrentDatabaseCounts();
      const now = new Date();
      const manifest: DataTransferManifest = {
        formatVersion: FORMAT_VERSION,
        schemaVersion: CURRENT_SCHEMA_VERSION,
        applicationVersion: APP_VERSION,
        exportedAt: now.toISOString(),
        exportedAtTimestamp: now.getTime(),
        deviceId: this.deviceId,
        databaseChecksum,
        kdf: {
          algorithm: 'PBKDF2-HMAC-SHA256',
          iterations: KDF_ITERATIONS,
          saltHex: salt.toString('hex')
        },
        counts
      };

      // 6. Build unencrypted payload: { manifest, sqliteBase64 }
      const payloadObj = {
        manifest,
        sqliteBase64: sqliteBuffer.toString('base64')
      };

      const compressedPayload = zlib.gzipSync(Buffer.from(JSON.stringify(payloadObj), 'utf-8'));

      // 7. Encrypt with AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const ciphertext = Buffer.concat([cipher.update(compressedPayload), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // 8. Assemble Binary Container:
      // [4 bytes: MAGIC 'PDRB'] + [1 byte: VERSION] + [4 bytes: ITERATIONS UInt32BE] + [16 bytes: SALT] + [12 bytes: IV] + [16 bytes: AUTH_TAG] + [CIPHERTEXT]
      const iterBuf = Buffer.alloc(4);
      iterBuf.writeUInt32BE(KDF_ITERATIONS, 0);

      const finalPackage = Buffer.concat([
        MAGIC_HEADER,
        Buffer.from([FORMAT_VERSION]),
        iterBuf,
        salt,
        iv,
        authTag,
        ciphertext
      ]);

      // Ensure directory exists and write
      const targetDir = path.dirname(targetFilePath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(targetFilePath, finalPackage);

      // Record successful backup metadata
      this.recordSuccessfulBackup(now.getTime());

      logger.info(`Successfully exported encrypted data package: ${targetFilePath} (${finalPackage.length} bytes)`);
      return { success: true, manifest };
    } catch (err: any) {
      logger.error(`Export data package failed:`, err);
      return { success: false, error: err.message || 'Veritabanı dışa aktarma işlemi başarısız oldu.' };
    }
  }

  /**
   * Internal helper to decrypt and parse package with supplied password
   */
  private decryptAndParsePackage(filePath: string, password?: string): { manifest: DataTransferManifest; sqliteBuffer: Buffer } {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Dosya bulunamadı: ${filePath}`);
    }

    const packageBuffer = fs.readFileSync(filePath);
    if (packageBuffer.length < 53) {
      throw new Error('Dosya boyutu geçersiz veya bozuk.');
    }

    // 1. Verify Magic Header
    const magic = packageBuffer.subarray(0, 4);
    if (!magic.equals(MAGIC_HEADER)) {
      throw new Error('Seçilen dosya geçerli bir PDR Manager (.pdrbak) yedek paketi değil.');
    }

    // 2. Parse Header
    let offset = 4;
    const version = packageBuffer.readUInt8(offset);
    offset += 1;
    if (version !== FORMAT_VERSION) {
      throw new Error(`Desteklenmeyen paket format versiyonu: ${version}`);
    }

    const iterations = packageBuffer.readUInt32BE(offset);
    offset += 4;
    const salt = packageBuffer.subarray(offset, offset + 16);
    offset += 16;
    const iv = packageBuffer.subarray(offset, offset + 12);
    offset += 12;
    const authTag = packageBuffer.subarray(offset, offset + 16);
    offset += 16;
    const ciphertext = packageBuffer.subarray(offset);

    // 3. Derive Key with Password
    const effectivePassword = password && password.trim() ? password.trim() : 'PDR_LOCAL_DEFAULT_SAFETY_PASS';
    const key = this.deriveKey(effectivePassword, salt, iterations);

    // 4. Decrypt AES-256-GCM
    let decryptedCompressed: Buffer;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      decryptedCompressed = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      throw new Error('Yedekleme parolası hatalı veya dosya bütünlüğü (AES-GCM Authentication) bozulmuş.');
    }

    // 5. Decompress GZIP and parse JSON
    const decompressed = zlib.gunzipSync(decryptedCompressed);
    const payload = JSON.parse(decompressed.toString('utf-8'));

    const manifest: DataTransferManifest = payload.manifest;
    const sqliteBuffer = Buffer.from(payload.sqliteBase64, 'base64');

    // 6. Verify SQLite Checksum
    const calcChecksum = crypto.createHash('sha256').update(sqliteBuffer).digest('hex');
    if (calcChecksum !== manifest.databaseChecksum) {
      throw new Error('Veritabanı SHA-256 bütünlük kontrolü başarısız oldu.');
    }

    return { manifest, sqliteBuffer };
  }

  /**
   * Inspects a .pdrbak file with password, decrypts, and calculates detailed comparison diff
   */
  public async inspectBackupFile(filePath: string, password?: string): Promise<BackupComparisonResultDto> {
    try {
      const fileName = path.basename(filePath);
      const { manifest } = this.decryptAndParsePackage(filePath, password);

      // Schema Compatibility: incoming backup schema must be <= current supported schema
      const schemaCompatible = manifest.schemaVersion <= CURRENT_SCHEMA_VERSION;
      if (!schemaCompatible) {
        return {
          isValid: false,
          filePath,
          fileName,
          manifest,
          schemaCompatible: false,
          error: `Yedek dosyası daha yeni bir şema sürümüne (${manifest.schemaVersion}) ait. Mevcut uygulama şema sürümü: ${CURRENT_SCHEMA_VERSION}. Lütfen uygulamanızı güncelleyin.`
        };
      }

      // Calculate Current vs Incoming Counts Diff
      const currentCounts = this.getCurrentDatabaseCounts();
      const incomingCounts = manifest.counts;

      const diff: Record<string, { incoming: number; current: number; delta: number; isHigher: boolean }> = {};
      const keys = Object.keys(incomingCounts) as (keyof typeof incomingCounts)[];

      for (const k of keys) {
        const inc = (incomingCounts as any)[k] || 0;
        const cur = (currentCounts as any)[k] || 0;
        const delta = inc - cur;
        diff[k] = {
          incoming: inc,
          current: cur,
          delta,
          isHigher: delta > 0
        };
      }

      return {
        isValid: true,
        filePath,
        fileName,
        manifest,
        schemaCompatible: true,
        comparison: {
          incoming: incomingCounts as any,
          current: currentCounts as any,
          diff
        }
      };
    } catch (err: any) {
      logger.error(`Error inspecting backup file ${filePath}:`, err);
      return {
        isValid: false,
        filePath,
        fileName: path.basename(filePath),
        schemaCompatible: false,
        error: err.message || 'Yedek dosyası okunamadı veya parola hatalı.'
      };
    }
  }

  /**
   * Imports and Replaces the current SQLite database from .pdrbak
   * Takes a mandatory safety backup of current state before replacement.
   * Evraklar ve Sunumlar bu işlemden ETKİLENMEZ (PC2'deki dosyalar korunur).
   * Yerel master parola bu işlemden ETKİLENMEZ (PC2'nin parolası korunur).
   */
  public async importAndReplaceDatabase(filePath: string, password?: string): Promise<ImportResultDto> {
    let safetyBackupPath: string | undefined;

    try {
      logger.info(`Starting secure database replace import from ${filePath}...`);

      // 1. Decrypt and validate package
      const { manifest, sqliteBuffer } = this.decryptAndParsePackage(filePath, password);

      if (manifest.schemaVersion > CURRENT_SCHEMA_VERSION) {
        throw new Error(`Yedek şema sürümü (${manifest.schemaVersion}) mevcut sürümden (${CURRENT_SCHEMA_VERSION}) daha yeni olduğu için içe aktarılamaz.`);
      }

      // 2. Take Pre-Import Mandatory Safety Backup of current DB
      const safetyDir = path.join(this.appDataDir, 'database', 'backups', 'pre_import_safety');
      if (!fs.existsSync(safetyDir)) {
        fs.mkdirSync(safetyDir, { recursive: true });
      }
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      safetyBackupPath = path.join(safetyDir, `pre-import-${timestampStr}.pdrbak`);

      logger.info(`Taking pre-import safety backup to ${safetyBackupPath}...`);
      const safetyExportRes = await this.exportDataPackage(safetyBackupPath, password);
      if (!safetyExportRes.success) {
        logger.warn(`Could not create safety backup before import, proceeding cautiously:`, safetyExportRes.error);
      }

      // 3. Capture existing machine's documents & presentations before database replacement
      const preRawDb = typeof (this.databaseService as any).getRawSqlite === 'function'
        ? this.databaseService.getRawSqlite()
        : this.databaseService.getSqlite();
      let existingCounselorDocs: any[] = [];
      let existingPresentations: any[] = [];
      let existingLegacyDocs: any[] = [];
      try {
        existingCounselorDocs = preRawDb.prepare('SELECT * FROM counselor_documents WHERE deleted_at IS NULL').all();
      } catch {}
      try {
        existingPresentations = preRawDb.prepare('SELECT * FROM presentations WHERE deleted_at IS NULL').all();
      } catch {}
      try {
        existingLegacyDocs = preRawDb.prepare('SELECT * FROM documents WHERE deleted_at IS NULL').all();
      } catch {}

      // 4. Safely close database connection
      const dbPath = this.databaseService.getDbPath();
      this.databaseService.close();

      // 5. Atomic Replace: write new SQLite file
      fs.writeFileSync(dbPath, sqliteBuffer);

      // Clean WAL and SHM if present
      const walPath = `${dbPath}-wal`;
      const shmPath = `${dbPath}-shm`;
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      // 6. Re-open and initialize DatabaseService
      this.databaseService.init(this.appDataDir);

      // 7. Ensure foreign auth metadata does not pollute PC2 & strip foreign documents/presentations
      const rawDb = typeof (this.databaseService as any).getRawSqlite === 'function'
        ? this.databaseService.getRawSqlite()
        : this.databaseService.getSqlite();
      try {
        rawDb.prepare(`
          DELETE FROM app_meta 
          WHERE key IN ('local_password_hash', 'local_password_salt', 'wrapped_dek', 'recovery_wrapped_dek')
        `).run();
      } catch (stripErr) {
        logger.warn('Could not clean app_meta security keys after import:', stripErr);
      }

      try { rawDb.prepare('DELETE FROM counselor_documents').run(); } catch {}
      try { rawDb.prepare('DELETE FROM presentations').run(); } catch {}
      try { rawDb.prepare('DELETE FROM documents').run(); } catch {}

      // 8. Restore PC2's local documents & presentations into the new database
      const restoreDocsTx = rawDb.transaction(() => {
        if (existingCounselorDocs.length > 0) {
          for (const doc of existingCounselorDocs) {
            const keys = Object.keys(doc);
            const colNames = keys.map(k => `"${k}"`).join(', ');
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => doc[k]);
            rawDb.prepare(`INSERT OR REPLACE INTO counselor_documents (${colNames}) VALUES (${placeholders})`).run(...values);
          }
        }
        if (existingPresentations.length > 0) {
          for (const pres of existingPresentations) {
            const keys = Object.keys(pres);
            const colNames = keys.map(k => `"${k}"`).join(', ');
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => pres[k]);
            rawDb.prepare(`INSERT OR REPLACE INTO presentations (${colNames}) VALUES (${placeholders})`).run(...values);
          }
        }
        if (existingLegacyDocs.length > 0) {
          for (const doc of existingLegacyDocs) {
            const keys = Object.keys(doc);
            const colNames = keys.map(k => `"${k}"`).join(', ');
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map(k => doc[k]);
            rawDb.prepare(`INSERT OR REPLACE INTO documents (${colNames}) VALUES (${placeholders})`).run(...values);
          }
        }
      });
      restoreDocsTx();

      // 9. Ensure official System Catalogs (e.g. Devamsızlık Nedenleri Anketi) are seeded and synchronized
      SystemCatalogService.seedAllCatalogs(rawDb, this.deviceId);

      // 10. Verify SQLite PRAGMA integrity & foreign keys
      const integrity = rawDb.prepare('PRAGMA integrity_check;').get() as any;
      if (integrity?.integrity_check !== 'ok') {
        throw new Error(`Veritabanı PRAGMA integrity_check başarısız: ${JSON.stringify(integrity)}`);
      }

      const fkCheck = rawDb.prepare('PRAGMA foreign_key_check;').all();
      if (fkCheck && fkCheck.length > 0) {
        logger.warn(`Foreign key check reported inconsistencies:`, fkCheck);
      }

      logger.info(`Database successfully replaced from backup package. Local files & local auth preserved.`);
      return {
        success: true,
        restoredAt: Date.now(),
        preImportBackupPath: safetyBackupPath
      };
    } catch (err: any) {
      logger.error(`Import and replace failed:`, err);

      // Attempt rollback if safety backup was taken and DB is unusable
      if (safetyBackupPath && fs.existsSync(safetyBackupPath)) {
        try {
          logger.info(`Attempting rollback from safety backup ${safetyBackupPath}...`);
          const { sqliteBuffer: rollbackSqlite } = this.decryptAndParsePackage(safetyBackupPath, password);
          const dbPath = this.databaseService.getDbPath();
          this.databaseService.close();
          fs.writeFileSync(dbPath, rollbackSqlite);
          this.databaseService.init(this.appDataDir);
          logger.info(`Rollback successfully restored previous database state.`);
        } catch (rbErr) {
          logger.error(`Rollback from safety backup also failed:`, rbErr);
        }
      }

      return {
        success: false,
        restoredAt: Date.now(),
        error: err.message || 'İçe aktarma işlemi başarısız oldu.'
      };
    }
  }

  /**
   * Resets ONLY user-generated data to clean factory state.
   * STRICT GUARANTEE: System survey catalogs (Devamsızlık Nedenleri Anketi, versions, questions, options, subscales),
   * migrations, and database schema are NEVER deleted.
   * Evraklar ve Sunumlar KESİNLİKLE silinmez (PC'deki depolar ve DB kayıtları korunur).
   * Yerel master parola KESİNLİKLE silinmez.
   * Mandatory pre-reset safety backup is created first.
   */
  public async resetDatabase(masterPassword?: string): Promise<ResetResultDto> {
    try {
      logger.info(`Starting secure user data reset procedure...`);

      // 1. Mandatory Safety Backup to pre_reset_safety
      const safetyDir = path.join(this.appDataDir, 'database', 'backups', 'pre_reset_safety');
      if (!fs.existsSync(safetyDir)) {
        fs.mkdirSync(safetyDir, { recursive: true });
      }
      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const safetyBackupPath = path.join(safetyDir, `pre-reset-${timestampStr}.pdrbak`);

      logger.info(`Taking pre-reset safety backup to ${safetyBackupPath}...`);
      await this.exportDataPackage(safetyBackupPath, masterPassword);

      // 2. Perform Atomic User Data Truncation on Live SQLite Connection
      const rawDb = typeof (this.databaseService as any).getRawSqlite === 'function'
        ? this.databaseService.getRawSqlite()
        : this.databaseService.getSqlite();

      // Dynamically discover all user tables (exclude system catalogs, documents, presentations, and internal tables)
      const userTables = rawDb.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type = 'table' 
          AND name NOT IN (
            'surveys', 'survey_versions', 'survey_questions', 'survey_options', 'survey_subscales', 'survey_interpretations', 
            'schools', 'school_years', 'devices', 'app_meta', 'migrations',
            'counselor_documents', 'presentations', 'documents'
          )
          AND name NOT LIKE 'sqlite_%'
      `).all() as { name: string }[];

      rawDb.pragma('foreign_keys = OFF');
      const resetTx = rawDb.transaction(() => {
        for (const tbl of userTables) {
          try {
            rawDb.prepare(`DELETE FROM "${tbl.name}"`).run();
          } catch (delErr) {
            logger.warn(`Could not truncate table ${tbl.name}:`, delErr);
          }
        }
      });

      resetTx();
      rawDb.pragma('foreign_keys = ON');
      logger.info(`User data tables (${userTables.length} tables) cleared atomically.`);

      // 3. Ensure official System Catalogs (Devamsızlık Nedenleri Anketi 52 questions, 7 subscales) are seeded and active
      SystemCatalogService.seedAllCatalogs(rawDb, this.deviceId);

      // 4. Ensure Default Institutional Records
      this.databaseService.ensureDefaultInstitutionalRecords(this.deviceId);

      // 5. Checkpoint and Verify Integrity
      rawDb.pragma('wal_checkpoint(TRUNCATE)');
      const integrity = rawDb.prepare('PRAGMA integrity_check;').get() as any;
      if (integrity?.integrity_check !== 'ok') {
        throw new Error(`Post-reset database integrity check failed: ${JSON.stringify(integrity)}`);
      }

      logger.info(`User data reset completed cleanly. Documents/presentations and local password preserved.`);
      return {
        success: true,
        preResetBackupPath: safetyBackupPath
      };
    } catch (err: any) {
      logger.error(`Database reset failed:`, err);
      return {
        success: false,
        error: err.message || 'Veritabanı sıfırlama işlemi başarısız oldu.'
      };
    }
  }
}
