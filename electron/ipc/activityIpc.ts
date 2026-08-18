import { ipcMain } from 'electron';
import { eq, isNull, and, desc } from 'drizzle-orm';
import { DatabaseService } from '../services/database/DatabaseService';
import * as schema from '@database/schema';
import { CounselingActivityDto } from '@shared/ipc-types';
import { logger } from '../services/logger/Logger';

export function registerActivityIpc(databaseService: DatabaseService) {
  const db = databaseService.getDb();
  const deviceId = databaseService.ensureDeviceId();

  ipcMain.handle('activities:list', async (_event, schoolYearId?: string): Promise<CounselingActivityDto[]> => {
    let conditions = [isNull(schema.counselingActivities.deletedAt)];
    if (schoolYearId) {
      conditions.push(eq(schema.counselingActivities.schoolYearId, schoolYearId));
    }

    const rows = db.select().from(schema.counselingActivities)
      .where(and(...conditions))
      .orderBy(desc(schema.counselingActivities.activityDate))
      .all();

    return rows.map(r => {
      let classIds: string[] = [];
      try {
        classIds = JSON.parse(r.classIds);
      } catch {
        classIds = [];
      }

      return {
        id: r.id,
        schoolYearId: r.schoolYearId,
        title: r.title,
        description: r.description || undefined,
        classIds,
        classNames: r.classNames,
        activityDate: r.activityDate,
        participantCount: r.participantCount,
        notes: r.notes || undefined,
        version: r.version,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });
  });

  ipcMain.handle('activities:create', async (_event, data: {
    schoolYearId: string;
    title: string;
    description?: string;
    classIds: string[];
    classNames: string;
    activityDate: string;
    participantCount?: number;
    notes?: string;
  }): Promise<CounselingActivityDto> => {
    const now = Date.now();
    const id = crypto.randomUUID();

    const newRecord = {
      id,
      schoolYearId: data.schoolYearId || 'default-year',
      title: data.title.trim(),
      description: data.description ? data.description.trim() : null,
      classIds: JSON.stringify(data.classIds || []),
      classNames: data.classNames || '',
      activityDate: data.activityDate || new Date().toISOString().split('T')[0],
      participantCount: Number(data.participantCount || 0),
      notes: data.notes ? data.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    };

    db.insert(schema.counselingActivities).values(newRecord).run();
    logger.info(`Created counseling activity: ${newRecord.title} (${id})`);

    return {
      id: newRecord.id,
      schoolYearId: newRecord.schoolYearId,
      title: newRecord.title,
      description: newRecord.description || undefined,
      classIds: data.classIds || [],
      classNames: newRecord.classNames,
      activityDate: newRecord.activityDate,
      participantCount: newRecord.participantCount,
      notes: newRecord.notes || undefined,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
  });

  ipcMain.handle('activities:update', async (_event, id: string, data: Partial<CounselingActivityDto>): Promise<CounselingActivityDto> => {
    const existing = db.select().from(schema.counselingActivities).where(eq(schema.counselingActivities.id, id)).get();
    if (!existing) throw new Error('Çalışma kaydı bulunamadı');

    const now = Date.now();
    const updateValues: any = {
      updatedAt: now,
      version: existing.version + 1,
      lastModifiedDeviceId: deviceId
    };

    if (data.title !== undefined) updateValues.title = data.title.trim();
    if (data.description !== undefined) updateValues.description = data.description ? data.description.trim() : null;
    if (data.classIds !== undefined) updateValues.classIds = JSON.stringify(data.classIds);
    if (data.classNames !== undefined) updateValues.classNames = data.classNames;
    if (data.activityDate !== undefined) updateValues.activityDate = data.activityDate;
    if (data.participantCount !== undefined) updateValues.participantCount = Number(data.participantCount);
    if (data.notes !== undefined) updateValues.notes = data.notes ? data.notes.trim() : null;

    db.update(schema.counselingActivities).set(updateValues).where(eq(schema.counselingActivities.id, id)).run();

    const updated = db.select().from(schema.counselingActivities).where(eq(schema.counselingActivities.id, id)).get()!;
    let classIds: string[] = [];
    try { classIds = JSON.parse(updated.classIds); } catch {}

    return {
      id: updated.id,
      schoolYearId: updated.schoolYearId,
      title: updated.title,
      description: updated.description || undefined,
      classIds,
      classNames: updated.classNames,
      activityDate: updated.activityDate,
      participantCount: updated.participantCount,
      notes: updated.notes || undefined,
      version: updated.version,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };
  });

  ipcMain.handle('activities:delete', async (_event, id: string): Promise<boolean> => {
    const existing = db.select().from(schema.counselingActivities).where(eq(schema.counselingActivities.id, id)).get();
    if (!existing) return false;

    db.update(schema.counselingActivities).set({
      deletedAt: Date.now(),
      version: existing.version + 1,
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).where(eq(schema.counselingActivities.id, id)).run();

    logger.info(`Deleted counseling activity ${id}`);
    return true;
  });
}
