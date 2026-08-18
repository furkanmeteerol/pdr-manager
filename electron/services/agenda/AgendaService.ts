import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, asc, gte, lte } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { AgendaItemDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class AgendaService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  public list(params?: { startDate?: string; endDate?: string; date?: string }): AgendaItemDto[] {
    const conditions = [isNull(schema.agendaItems.deletedAt)];

    if (params?.date) {
      conditions.push(eq(schema.agendaItems.agendaDate, params.date));
    }
    if (params?.startDate) {
      conditions.push(gte(schema.agendaItems.agendaDate, params.startDate));
    }
    if (params?.endDate) {
      conditions.push(lte(schema.agendaItems.agendaDate, params.endDate));
    }

    const rows = this.db.select()
      .from(schema.agendaItems)
      .where(and(...conditions))
      .orderBy(asc(schema.agendaItems.agendaDate), asc(schema.agendaItems.startTime))
      .all();

    return rows.map(r => ({
      id: r.id,
      schoolYearId: r.schoolYearId,
      title: r.title,
      agendaDate: r.agendaDate,
      startTime: r.startTime,
      completed: r.completed === 1,
      notes: r.notes,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  public create(data: {
    schoolYearId?: string;
    title: string;
    agendaDate: string;
    startTime?: string;
    notes?: string;
  }): AgendaItemDto {
    const now = Date.now();
    const id = crypto.randomUUID();

    const record = {
      id,
      schoolYearId: data.schoolYearId || null,
      title: data.title,
      agendaDate: data.agendaDate,
      startTime: data.startTime || null,
      completed: 0,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.agendaItems).values(record).run();
      this.syncEngine.queueChange('agenda_items', id, 'create', 0, 1, null, record, tx);
    });

    logger.info(`Created agenda item ${id} for date ${data.agendaDate}`);
    return {
      id,
      schoolYearId: record.schoolYearId,
      title: record.title,
      agendaDate: record.agendaDate,
      startTime: record.startTime,
      completed: false,
      notes: record.notes,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  }

  public update(id: string, data: {
    title?: string;
    agendaDate?: string;
    startTime?: string;
    completed?: boolean;
    notes?: string;
  }): AgendaItemDto {
    const existing = this.db.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, id)).get();
    if (!existing) throw new Error('Ajanda kaydı bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;

    const updates: any = {
      updatedAt: now,
      version: newVersion,
      lastModifiedDeviceId: this.deviceId
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.agendaDate !== undefined) updates.agendaDate = data.agendaDate;
    if (data.startTime !== undefined) updates.startTime = data.startTime;
    if (data.completed !== undefined) updates.completed = data.completed ? 1 : 0;
    if (data.notes !== undefined) updates.notes = data.notes;

    this.db.transaction((tx) => {
      tx.update(schema.agendaItems)
        .set(updates)
        .where(eq(schema.agendaItems.id, id))
        .run();

      this.syncEngine.queueChange('agenda_items', id, 'update', existing.version, newVersion, existing, updates, tx);
    });

    const updated = this.db.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, id)).get()!;
    return {
      id: updated.id,
      schoolYearId: updated.schoolYearId,
      title: updated.title,
      agendaDate: updated.agendaDate,
      startTime: updated.startTime,
      completed: updated.completed === 1,
      notes: updated.notes,
      version: updated.version,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  }

  public toggleComplete(id: string, completed: boolean): AgendaItemDto {
    return this.update(id, { completed });
  }

  public delete(id: string): boolean {
    const existing = this.db.select().from(schema.agendaItems).where(eq(schema.agendaItems.id, id)).get();
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.agendaItems)
        .set({
          deletedAt: now,
          updatedAt: now,
          version: newVersion,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.agendaItems.id, id))
        .run();

      this.syncEngine.queueChange('agenda_items', id, 'delete', existing.version, newVersion, existing, { deletedAt: now }, tx);
    });

    logger.info(`Soft deleted agenda item ${id}`);
    return true;
  }
}
