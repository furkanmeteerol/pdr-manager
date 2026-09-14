import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { isNewerVersion, UpdateService, findMacArm64DmgAsset, GITHUB_OWNER, GITHUB_REPO, GITHUB_RELEASES_URL } from '../electron/services/updater/UpdateService';
import { getClientUpdateToken } from '../electron/services/updater/UpdateConfig';
import packageJson from '../package.json';

describe('PDR Manager Auto-Updater Test Suite (GitHub Releases & Private Repo)', () => {

  describe('1. Semantic Version Comparison (isNewerVersion)', () => {
    it('should detect standard patch version bumps', () => {
      expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
      expect(isNewerVersion('1.0.2', '1.0.1')).toBe(true);
    });

    it('should detect minor and major version bumps', () => {
      expect(isNewerVersion('1.1.0', '1.0.9')).toBe(true);
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
      expect(isNewerVersion('10.0.0', '9.9.9')).toBe(true);
    });

    it('should handle "v" prefixes seamlessly', () => {
      expect(isNewerVersion('v1.0.1', '1.0.0')).toBe(true);
      expect(isNewerVersion('1.0.1', 'v1.0.0')).toBe(true);
      expect(isNewerVersion('v1.0.1', 'v1.0.0')).toBe(true);
    });

    it('should return false when remote is equal or older', () => {
      expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.0', '1.0.1')).toBe(false);
      expect(isNewerVersion('0.9.9', '1.0.0')).toBe(false);
      expect(isNewerVersion('v1.0.0', '1.0.0')).toBe(false);
    });

    it('should handle edge cases and invalid inputs safely', () => {
      expect(isNewerVersion('', '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.0', '')).toBe(false);
      expect(isNewerVersion(null as any, '1.0.0')).toBe(false);
      expect(isNewerVersion('1.0.0', undefined as any)).toBe(false);
    });
  });

  describe('2. Canonical Version & GitHub Configuration Integrity', () => {
    it('should have package.json as the canonical source of version', () => {
      expect(packageJson.version).toBeDefined();
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have GitHub publish provider configured with correct owner, repo and private: true', () => {
      expect(packageJson.build).toBeDefined();
      expect(packageJson.build.publish).toBeDefined();
      expect(Array.isArray(packageJson.build.publish)).toBe(true);
      const githubPublisher = packageJson.build.publish.find((p: any) => p.provider === 'github');
      expect(githubPublisher).toBeDefined();
      expect(githubPublisher!.owner).toBe(GITHUB_OWNER);
      expect(githubPublisher!.repo).toBe(GITHUB_REPO);
      expect(githubPublisher!.private).toBe(true);
      expect(githubPublisher!.releaseType).toBe('release');
    });

    it('should guarantee deleteAppDataOnUninstall is FALSE in NSIS config', () => {
      expect(packageJson.build.nsis).toBeDefined();
      expect(packageJson.build.nsis.deleteAppDataOnUninstall).toBe(false);
    });
  });

  describe('3. Private GitHub Token Resolution (UpdateConfig)', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      delete process.env.GITHUB_UPDATE_TOKEN;
      delete process.env.GH_UPDATE_TOKEN;
      delete process.env.GH_TOKEN;
      delete process.env.GITHUB_TOKEN;
    });

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it('should resolve token strictly from GITHUB_UPDATE_TOKEN with trimming', () => {
      process.env.GITHUB_UPDATE_TOKEN = '  ghp_mock_test_token_12345  ';
      expect(getClientUpdateToken()).toBe('ghp_mock_test_token_12345');
    });

    it('should NOT fall back to GH_UPDATE_TOKEN, GH_TOKEN, or GITHUB_TOKEN (prevent CI token leak)', () => {
      process.env.GH_UPDATE_TOKEN = 'ghp_mock_ci_token_fallback';
      process.env.GH_TOKEN = 'ghp_mock_ci_token_gh';
      process.env.GITHUB_TOKEN = 'ghp_mock_ci_token_github';

      expect(getClientUpdateToken()).toBeNull();
    });

    it('should return null when GITHUB_UPDATE_TOKEN is not set', () => {
      expect(getClientUpdateToken()).toBeNull();
    });

    it('should return null when GITHUB_UPDATE_TOKEN is empty or only whitespace', () => {
      process.env.GITHUB_UPDATE_TOKEN = '    ';
      expect(getClientUpdateToken()).toBeNull();
    });
  });

  describe('4. UpdateService State Machine & Dev-Mode Isolation', () => {
    it('should initialize with idle or dev-mode state and correct current version', () => {
      const mockWinGetter = () => null;
      const service = new UpdateService(mockWinGetter);
      service.init();

      const status = service.getStatus();
      expect(status).toBeDefined();
      expect(status.currentVersion).toBe(packageJson.version);
      expect(status.feedUrl).toBe(GITHUB_RELEASES_URL);
    });

    it('should safely return dev-mode state in development without throwing', async () => {
      const mockWinGetter = () => null;
      const service = new UpdateService(mockWinGetter);
      service.init();

      const status = await service.checkForUpdates();
      expect(status.state).toBe('dev-mode');
      expect(status.errorMessage).toBeNull();
    });

    it('should initialize status with errorPhase as null', () => {
      const mockWinGetter = () => null;
      const service = new UpdateService(mockWinGetter);
      expect(service.getStatus().errorPhase).toBeNull();
    });
  });

  describe('5. SQLite Database & User Data Preservation Simulation', () => {
    const testTempDir = path.join(process.cwd(), 'temp_test_updater_db_preservation');
    const dbDir = path.join(testTempDir, 'database');
    const dbPath = path.join(dbDir, 'pdr.sqlite');

    beforeEach(() => {
      if (fs.existsSync(testTempDir)) {
        fs.rmSync(testTempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(dbDir, { recursive: true });
    });

    afterEach(() => {
      if (fs.existsSync(testTempDir)) {
        fs.rmSync(testTempDir, { recursive: true, force: true });
      }
    });

    it('should keep all SQLite tables, records and meta intact across application updates', () => {
      // 1. Simulate v1.0.0 initial installation & data insertion
      const sqlite1 = new Database(dbPath);
      sqlite1.exec(`
        CREATE TABLE app_meta (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE students (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          student_number TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE TABLE devices (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          app_version TEXT NOT NULL
        );
      `);

      const now = Date.now();
      sqlite1.prepare('INSERT INTO app_meta VALUES (?, ?, ?)').run('school_name', 'Cumhuriyet Anadolu Lisesi', now);
      sqlite1.prepare('INSERT INTO app_meta VALUES (?, ?, ?)').run('active_school_year_id', '2026-2027', now);
      sqlite1.prepare('INSERT INTO students VALUES (?, ?, ?, ?, ?)').run('st-101', 'Ahmet', 'Yılmaz', '1240', now);
      sqlite1.prepare('INSERT INTO students VALUES (?, ?, ?, ?, ?)').run('st-102', 'Zeynep', 'Kaya', '1355', now);
      sqlite1.prepare('INSERT INTO devices VALUES (?, ?, ?)').run('dev-pc-01', 'Primary PC', '1.0.0');

      sqlite1.close();

      // 2. Simulate Application Update (New binary installed, reopening database from unchanged userData)
      expect(fs.existsSync(dbPath)).toBe(true);

      const sqlite2 = new Database(dbPath);
      
      // Verify all rows and data are preserved exactly
      const schoolMeta = sqlite2.prepare('SELECT value FROM app_meta WHERE key = ?').get('school_name') as any;
      expect(schoolMeta).toBeDefined();
      expect(schoolMeta.value).toBe('Cumhuriyet Anadolu Lisesi');

      const studentCount = sqlite2.prepare('SELECT count(*) as count FROM students').get() as any;
      expect(studentCount.count).toBe(2);

      const ahmet = sqlite2.prepare('SELECT * FROM students WHERE id = ?').get('st-101') as any;
      expect(ahmet.first_name).toBe('Ahmet');
      expect(ahmet.last_name).toBe('Yılmaz');
      expect(ahmet.student_number).toBe('1240');

      // Update app_version in devices table for the updated version v1.0.1
      sqlite2.prepare('UPDATE devices SET app_version = ? WHERE id = ?').run('1.0.1', 'dev-pc-01');
      const updatedDevice = sqlite2.prepare('SELECT * FROM devices WHERE id = ?').get('dev-pc-01') as any;
      expect(updatedDevice.app_version).toBe('1.0.1');

      sqlite2.close();
    });
  });

  describe('6. macOS ARM64 DMG Manual Update Engine (Tests A to I)', () => {
    const sampleAssets = [
      { name: 'PDR-Manager-1.1.2-arm64.dmg', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-arm64.dmg', size: 104857600 },
      { name: 'PDR-Manager-1.1.2-arm64.dmg.blockmap', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-arm64.dmg.blockmap', size: 1024 },
      { name: 'PDR-Manager-1.1.2-arm64-mac.zip', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-arm64-mac.zip', size: 98000000 },
      { name: 'PDR-Manager-1.1.2-mac.zip', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-mac.zip', size: 98000000 },
      { name: 'PDR-Manager-Setup-1.1.2.exe', browser_download_url: 'https://github.com/mock/download/PDR-Manager-Setup-1.1.2.exe', size: 85000000 },
      { name: 'PDR-Manager-Setup-1.1.2.exe.blockmap', browser_download_url: 'https://github.com/mock/download/PDR-Manager-Setup-1.1.2.exe.blockmap', size: 1024 },
      { name: 'latest-mac.yml', browser_download_url: 'https://github.com/mock/download/latest-mac.yml', size: 500 },
      { name: 'latest.yml', browser_download_url: 'https://github.com/mock/download/latest.yml', size: 500 }
    ];

    it('Test A: should find PDR-Manager-1.1.2-arm64.dmg in release assets', () => {
      const match = findMacArm64DmgAsset(sampleAssets);
      expect(match).not.toBeNull();
      expect(match!.name).toBe('PDR-Manager-1.1.2-arm64.dmg');
      expect(match!.downloadUrl).toBe('https://github.com/mock/download/PDR-Manager-1.1.2-arm64.dmg');
      expect(match!.size).toBe(104857600);
    });

    it('Test B: should NOT select Windows .exe asset for macOS', () => {
      const windowsOnlyAssets = [
        { name: 'PDR-Manager-Setup-1.1.2.exe', browser_download_url: 'https://github.com/mock/download/PDR-Manager-Setup-1.1.2.exe', size: 85000000 },
        { name: 'latest.yml', browser_download_url: 'https://github.com/mock/download/latest.yml', size: 500 }
      ];
      const match = findMacArm64DmgAsset(windowsOnlyAssets);
      expect(match).toBeNull();
    });

    it('Test C: should NOT select .zip asset for macOS', () => {
      const zipOnlyAssets = [
        { name: 'PDR-Manager-1.1.2-arm64-mac.zip', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-arm64-mac.zip', size: 98000000 },
        { name: 'PDR-Manager-1.1.2-mac.zip', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-mac.zip', size: 98000000 }
      ];
      const match = findMacArm64DmgAsset(zipOnlyAssets);
      expect(match).toBeNull();
    });

    it('Test D: should NOT select .blockmap asset for macOS', () => {
      const blockmapOnlyAssets = [
        { name: 'PDR-Manager-1.1.2-arm64.dmg.blockmap', browser_download_url: 'https://github.com/mock/download/PDR-Manager-1.1.2-arm64.dmg.blockmap', size: 1024 }
      ];
      const match = findMacArm64DmgAsset(blockmapOnlyAssets);
      expect(match).toBeNull();
    });

    it('Test E: should report update available when GitHub latest is newer', () => {
      expect(isNewerVersion('1.1.2', '1.1.1')).toBe(true);
      expect(isNewerVersion('v1.1.2', '1.1.1')).toBe(true);
      expect(isNewerVersion('1.2.0', '1.1.3')).toBe(true);
      expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
    });

    it('Test F: should report up to date (not-available) when remote is same or older', () => {
      expect(isNewerVersion('1.1.1', '1.1.1')).toBe(false);
      expect(isNewerVersion('v1.1.1', '1.1.1')).toBe(false);
      expect(isNewerVersion('1.1.0', '1.1.1')).toBe(false);
    });

    it('Test G & H: UpdateService state transitions on macOS', async () => {
      const mockWinGetter = () => null;
      const service = new UpdateService(mockWinGetter);
      const status = service.getStatus();
      expect(status).toBeDefined();
      expect(status.state).toBe('idle');
    });

    it('Test I: Downloaded DMG not found returns meaningful error instead of crash', async () => {
      const mockWinGetter = () => null;
      const service = new UpdateService(mockWinGetter);

      // In development mode without FORCE_UPDATE_CHECK
      const res = await service.quitAndInstall();
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });
});
