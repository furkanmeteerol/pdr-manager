import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, desc } from 'drizzle-orm';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { TaskDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class TaskService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  public listTasks(filter?: { completed?: boolean; studentId?: string; priority?: string }): TaskDto[] {
    let conditions = [isNull(schema.tasks.deletedAt)];

    if (filter?.completed !== undefined) {
      conditions.push(eq(schema.tasks.completed, filter.completed ? 1 : 0));
    }
    if (filter?.studentId) {
      conditions.push(eq(schema.tasks.studentId, filter.studentId));
    }
    if (filter?.priority) {
      conditions.push(eq(schema.tasks.priority, filter.priority));
    }

    const rows = this.db.select({
      task: schema.tasks,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName
    })
    .from(schema.tasks)
    .leftJoin(schema.students, eq(schema.tasks.studentId, schema.students.id))
    .where(and(...conditions))
    .orderBy(schema.tasks.completed, desc(schema.tasks.createdAt))
    .all();

    const todayStr = new Date().toISOString().split('T')[0];

    return rows.map(r => {
      const t = r.task;
      const studentName = r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName}` : undefined;
      const isOverdue = !t.completed && t.dueDate ? t.dueDate < todayStr : false;

      return {
        id: t.id,
        title: t.title,
        description: t.description || undefined,
        dueDate: t.dueDate || undefined,
        dueTime: t.dueTime || undefined,
        priority: t.priority as any,
        category: t.category,
        studentId: t.studentId,
        studentName,
        completed: t.completed === 1,
        completedAt: t.completedAt,
        isOverdue,
        version: t.version,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      };
    });
  }

  public createTask(data: {
    title: string;
    description?: string;
    dueDate?: string;
    dueTime?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: string;
    studentId?: string | null;
  }): TaskDto {
    const now = Date.now();
    const id = crypto.randomUUID();

    const record = {
      id,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      priority: data.priority || 'medium',
      category: data.category || 'general',
      studentId: data.studentId ?? null,
      completed: 0,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.tasks).values(record).run();

      this.syncEngine.queueChange(
        'tasks',
        id,
        'create',
        0,
        1,
        null,
        record,
        tx
      );
    });

    const list = this.listTasks();
    return list.find(t => t.id === id)!;
  }

  public toggleComplete(id: string, completed: boolean): TaskDto {
    const list = this.listTasks();
    const existing = list.find(t => t.id === id);
    if (!existing) throw new Error('Görev bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    this.db.transaction((tx) => {
      tx.update(schema.tasks)
        .set({
          completed: completed ? 1 : 0,
          completedAt: completed ? now : null,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.tasks.id, id))
        .run();

      this.syncEngine.queueChange(
        'tasks',
        id,
        'update',
        existing.version,
        newVersion,
        baseSnapshot,
        { id, completed: completed ? 1 : 0, completedAt: completed ? now : null, version: newVersion },
        tx
      );
    });

    return this.listTasks().find(t => t.id === id)!;
  }

  public softDeleteTask(id: string): boolean {
    const list = this.listTasks();
    const existing = list.find(t => t.id === id);
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.tasks)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.tasks.id, id))
        .run();

      this.syncEngine.queueChange(
        'tasks',
        id,
        'delete',
        existing.version,
        newVersion,
        existing,
        { id, deletedAt: now, version: newVersion },
        tx
      );
    });

    logger.info(`Soft-deleted task ${id}`);
    return true;
  }
}
