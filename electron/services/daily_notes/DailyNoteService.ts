import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and, isNull, asc } from 'drizzle-orm';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { DailyNoteDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class DailyNoteService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  public listByDate(noteDate: string): DailyNoteDto[] {
    const rows = this.db.select()
      .from(schema.dailyNotes)
      .where(and(
        eq(schema.dailyNotes.noteDate, noteDate),
        isNull(schema.dailyNotes.deletedAt)
      ))
      .orderBy(asc(schema.dailyNotes.createdAt))
      .all();

    return rows.map(r => ({
      id: r.id,
      schoolYearId: r.schoolYearId,
      noteDate: r.noteDate,
      content: r.content,
      completed: r.completed === 1,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  public createNote(data: {
    schoolYearId?: string | null;
    noteDate: string;
    content: string;
  }): DailyNoteDto {
    const now = Date.now();
    const id = crypto.randomUUID();

    const record = {
      id,
      schoolYearId: data.schoolYearId ?? null,
      noteDate: data.noteDate,
      content: data.content.trim(),
      completed: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.dailyNotes).values(record).run();

      this.syncEngine.queueChange(
        'daily_notes',
        id,
        'create',
        0,
        1,
        null,
        record,
        tx
      );
    });

    logger.info(`Created daily note ${id} for date ${data.noteDate}`);

    return {
      id,
      schoolYearId: record.schoolYearId,
      noteDate: record.noteDate,
      content: record.content,
      completed: false,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  }

  public updateNote(id: string, content: string): DailyNoteDto {
    const existing = this.db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, id)).get();
    if (!existing) {
      throw new Error(`Daily note with id ${id} not found.`);
    }

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };
    const updateFields = {
      content: content.trim(),
      updatedAt: now,
      version: newVersion,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.update(schema.dailyNotes)
        .set(updateFields)
        .where(eq(schema.dailyNotes.id, id))
        .run();

      this.syncEngine.queueChange(
        'daily_notes',
        id,
        'update',
        existing.version,
        newVersion,
        baseSnapshot,
        updateFields,
        tx
      );
    });

    logger.info(`Updated daily note ${id}`);

    return {
      id: existing.id,
      schoolYearId: existing.schoolYearId,
      noteDate: existing.noteDate,
      content: content.trim(),
      completed: existing.completed === 1,
      version: newVersion,
      createdAt: existing.createdAt,
      updatedAt: now
    };
  }

  public toggleComplete(id: string, completed: boolean): DailyNoteDto {
    const existing = this.db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, id)).get();
    if (!existing) {
      throw new Error(`Daily note with id ${id} not found.`);
    }

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };
    const updateFields = {
      completed: completed ? 1 : 0,
      updatedAt: now,
      version: newVersion,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.update(schema.dailyNotes)
        .set(updateFields)
        .where(eq(schema.dailyNotes.id, id))
        .run();

      this.syncEngine.queueChange(
        'daily_notes',
        id,
        'update',
        existing.version,
        newVersion,
        baseSnapshot,
        updateFields,
        tx
      );
    });

    logger.info(`Toggled daily note ${id} completed=${completed}`);

    return {
      id: existing.id,
      schoolYearId: existing.schoolYearId,
      noteDate: existing.noteDate,
      content: existing.content,
      completed,
      version: newVersion,
      createdAt: existing.createdAt,
      updatedAt: now
    };
  }

  public deleteNote(id: string): boolean {
    const existing = this.db.select().from(schema.dailyNotes).where(eq(schema.dailyNotes.id, id)).get();
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    this.db.transaction((tx) => {
      tx.update(schema.dailyNotes)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.dailyNotes.id, id))
        .run();

      this.syncEngine.queueChange(
        'daily_notes',
        id,
        'delete',
        existing.version,
        newVersion,
        baseSnapshot,
        { id, deletedAt: now, version: newVersion },
        tx
      );
    });

    logger.info(`Deleted daily note ${id}`);
    return true;
  }
}
