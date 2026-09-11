import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { DatabaseService } from '../electron/services/database/DatabaseService';
import * as schema from '../database/schema';
import { eq, isNull } from 'drizzle-orm';

describe('Counseling Activities & Meetings Module Tests', () => {
  const testDir = path.join(__dirname, 'temp_activities_test_env');
  let dbService: DatabaseService;

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    dbService = new DatabaseService();
    dbService.init(testDir);
    const db = dbService.getDb();
    const now = Date.now();
    db.insert(schema.schoolYears).values({
      id: 'test-year-1',
      name: '2026-2027',
      startDate: '2026-09-01',
      endDate: '2027-06-20',
      isActive: 1,
      isArchived: 0,
      createdAt: now,
      updatedAt: now,
      lastModifiedDeviceId: 'DEV-1'
    }).run();
  });

  afterEach(() => {
    try {
      dbService.close();
    } catch {}
    if (fs.existsSync(testDir)) {
      try { fs.rmSync(testDir, { recursive: true, force: true }); } catch {}
    }
  });

  it('1. Migration 16 creates type with default activity and activity_time column', () => {
    const rawSqlite = new Database(dbService.getDbPath());
    
    // Check columns
    const columns = rawSqlite.prepare('PRAGMA table_info(counseling_activities)').all() as any[];
    const typeCol = columns.find(c => c.name === 'type');
    const timeCol = columns.find(c => c.name === 'activity_time');

    expect(typeCol).toBeDefined();
    expect(typeCol.dflt_value).toBe("'activity'");
    expect(timeCol).toBeDefined();

    // Check app_meta schema version
    const versionRow = rawSqlite.prepare("SELECT value FROM app_meta WHERE key = 'db_schema_version'").get() as any;
    expect(parseInt(versionRow.value, 10)).toBe(16);

    rawSqlite.close();
  });

  it('2. Should create and persist Activity type (Çalışma / Faaliyet) with multi-classes', () => {
    const db = dbService.getDb();
    const schoolYearId = 'test-year-1';
    const deviceId = dbService.ensureDeviceId();

    const activityData = {
      id: 'act-test-1',
      schoolYearId,
      type: 'activity',
      title: 'Öfke Kontrolü ve Problem Çözme Becerileri',
      description: '9. sınıflara yönelik grup çalışması',
      classIds: JSON.stringify(['cls-1', 'cls-2']),
      classNames: '9-A, 9-B',
      activityDate: '2026-09-10',
      activityTime: null,
      participantCount: 45,
      notes: 'Katılım aktifti.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    };

    db.insert(schema.counselingActivities).values(activityData).run();

    const record = db.select().from(schema.counselingActivities)
      .where(eq(schema.counselingActivities.id, 'act-test-1'))
      .get();

    expect(record).toBeDefined();
    expect(record?.type).toBe('activity');
    expect(record?.title).toBe('Öfke Kontrolü ve Problem Çözme Becerileri');
    expect(record?.classNames).toBe('9-A, 9-B');
    expect(record?.participantCount).toBe(45);
    expect(record?.activityTime).toBeNull();
  });

  it('3. Should create and persist Meeting type (Toplantı) with time and no classes', () => {
    const db = dbService.getDb();
    const schoolYearId = 'test-year-1';
    const deviceId = dbService.ensureDeviceId();

    const meetingData = {
      id: 'meeting-test-1',
      schoolYearId,
      type: 'meeting',
      title: 'Sene Başı Rehberlik Yürütme Komisyonu Toplantısı',
      description: 'Yıllık planın değerlendirilmesi',
      classIds: JSON.stringify([]),
      classNames: '',
      activityDate: '2026-09-15',
      activityTime: '14:30',
      participantCount: 8,
      notes: 'Rehberlik çerçeve planı ve risk haritası onaylandı.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    };

    db.insert(schema.counselingActivities).values(meetingData).run();

    const record = db.select().from(schema.counselingActivities)
      .where(eq(schema.counselingActivities.id, 'meeting-test-1'))
      .get();

    expect(record).toBeDefined();
    expect(record?.type).toBe('meeting');
    expect(record?.title).toBe('Sene Başı Rehberlik Yürütme Komisyonu Toplantısı');
    expect(record?.classNames).toBe('');
    expect(record?.activityTime).toBe('14:30');
    expect(record?.participantCount).toBe(8);
  });

  it('4. Data survives SQLite restart and can be updated/deleted seamlessly', () => {
    const db = dbService.getDb();
    const schoolYearId = 'test-year-1';
    const deviceId = dbService.ensureDeviceId();

    // Insert 1 activity and 1 meeting
    db.insert(schema.counselingActivities).values([
      {
        id: 'act-persist',
        schoolYearId,
        type: 'activity',
        title: 'Verimli Ders Çalışma',
        classIds: JSON.stringify(['c1']),
        classNames: '10-A',
        activityDate: '2026-09-01',
        participantCount: 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        version: 1,
        lastModifiedDeviceId: deviceId
      },
      {
        id: 'meet-persist',
        schoolYearId,
        type: 'meeting',
        title: 'Zümre Toplantısı',
        classIds: JSON.stringify([]),
        classNames: '',
        activityDate: '2026-09-02',
        activityTime: '10:00',
        participantCount: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        deletedAt: null,
        version: 1,
        lastModifiedDeviceId: deviceId
      }
    ]).run();

    // Close and Reopen DB
    dbService.close();
    const reopenedService = new DatabaseService();
    reopenedService.init(testDir);
    const db2 = reopenedService.getDb();

    // Verify both records exist with correct types
    const acts = db2.select().from(schema.counselingActivities)
      .where(isNull(schema.counselingActivities.deletedAt))
      .all();

    expect(acts.length).toBe(2);

    const actItem = acts.find(a => a.id === 'act-persist');
    const meetItem = acts.find(a => a.id === 'meet-persist');

    expect(actItem?.type).toBe('activity');
    expect(meetItem?.type).toBe('meeting');
    expect(meetItem?.activityTime).toBe('10:00');

    // Update meeting time and title
    db2.update(schema.counselingActivities)
      .set({ title: 'Genişletilmiş Zümre Toplantısı', activityTime: '11:30', participantCount: 7 })
      .where(eq(schema.counselingActivities.id, 'meet-persist'))
      .run();

    const updatedMeet = db2.select().from(schema.counselingActivities)
      .where(eq(schema.counselingActivities.id, 'meet-persist'))
      .get();

    expect(updatedMeet?.title).toBe('Genişletilmiş Zümre Toplantısı');
    expect(updatedMeet?.activityTime).toBe('11:30');
    expect(updatedMeet?.participantCount).toBe(7);

    // Soft delete
    db2.update(schema.counselingActivities)
      .set({ deletedAt: Date.now() })
      .where(eq(schema.counselingActivities.id, 'act-persist'))
      .run();

    const activeRecords = db2.select().from(schema.counselingActivities)
      .where(isNull(schema.counselingActivities.deletedAt))
      .all();

    expect(activeRecords.length).toBe(1);
    expect(activeRecords[0].id).toBe('meet-persist');

    reopenedService.close();
  });
});
