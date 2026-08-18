import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { AnnualPlanDto, AnnualPlanItemDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class AnnualPlanService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  public getAnnualPlan(schoolYearId?: string): AnnualPlanDto | null {
    let plan;
    if (schoolYearId) {
      plan = this.db.select().from(schema.annualPlans).where(eq(schema.annualPlans.schoolYearId, schoolYearId)).get();
    } else {
      plan = this.db.select().from(schema.annualPlans).orderBy(desc(schema.annualPlans.createdAt)).get();
    }

    if (!plan) return null;

    const items = this.db.select()
      .from(schema.annualPlanItems)
      .where(and(eq(schema.annualPlanItems.annualPlanId, plan.id), isNull(schema.annualPlanItems.deletedAt)))
      .orderBy(schema.annualPlanItems.plannedDate)
      .all();

    return {
      id: plan.id,
      schoolYearId: plan.schoolYearId,
      title: plan.title,
      description: plan.description || undefined,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      items: items.map(i => ({
        id: i.id,
        annualPlanId: i.annualPlanId,
        plannedDate: i.plannedDate,
        startDate: i.startDate || i.plannedDate,
        endDate: i.endDate || i.plannedDate,
        activityType: i.activityType || undefined,
        category: i.category,
        title: i.title,
        description: i.description || undefined,
        targetAudience: i.targetAudience || undefined,
        status: i.status as any,
        completedAt: i.completedAt || undefined,
        notes: i.notes || undefined
      }))
    };
  }

  public createOrUpdatePlan(data: { schoolYearId: string; title: string; description?: string }): AnnualPlanDto {
    const existing = this.db.select().from(schema.annualPlans).where(eq(schema.annualPlans.schoolYearId, data.schoolYearId)).get();
    const now = Date.now();

    if (existing) {
      this.db.update(schema.annualPlans)
        .set({ title: data.title, description: data.description || null, updatedAt: now })
        .where(eq(schema.annualPlans.id, existing.id))
        .run();
      return this.getAnnualPlan(data.schoolYearId)!;
    }

    const planId = crypto.randomUUID();
    const planRecord = {
      id: planId,
      schoolYearId: data.schoolYearId,
      title: data.title,
      description: data.description || null,
      createdAt: now,
      updatedAt: now
    };

    this.db.insert(schema.annualPlans).values(planRecord).run();
    logger.info(`Created annual guidance plan ${planId} for year ${data.schoolYearId}`);
    return this.getAnnualPlan(data.schoolYearId)!;
  }

  public ensurePlan(schoolYearId: string = 'default-year'): string {
    let plan = this.db.select().from(schema.annualPlans).where(eq(schema.annualPlans.schoolYearId, schoolYearId)).get();
    if (!plan) {
      const planId = crypto.randomUUID();
      const now = Date.now();
      this.db.insert(schema.annualPlans).values({
        id: planId,
        schoolYearId,
        title: 'Yıllık Rehberlik Programı',
        description: 'Otomatik oluşturulan yıllık plan',
        createdAt: now,
        updatedAt: now
      }).run();
      return planId;
    }
    return plan.id;
  }

  public addItem(data: {
    annualPlanId?: string;
    schoolYearId?: string;
    plannedDate?: string;
    startDate?: string;
    endDate?: string;
    activityType?: string;
    category?: string;
    title: string;
    description?: string;
    targetAudience?: string;
  }): AnnualPlanItemDto {
    const now = Date.now();
    const itemId = crypto.randomUUID();
    const planId = data.annualPlanId || this.ensurePlan(data.schoolYearId || 'default-year');
    const start = data.startDate || data.plannedDate || new Date().toISOString().split('T')[0];
    const end = data.endDate || start;

    const record = {
      id: itemId,
      annualPlanId: planId,
      plannedDate: start,
      startDate: start,
      endDate: end,
      activityType: data.activityType || null,
      category: data.category || 'Gelişimsel',
      title: data.title,
      description: data.description || null,
      targetAudience: data.targetAudience || null,
      status: 'planned',
      completedAt: null,
      notes: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.annualPlanItems).values(record).run();
      this.syncEngine.queueChange('annual_plan_items', itemId, 'create', 0, 1, null, record, tx);
    });

    return {
      id: itemId,
      annualPlanId: planId,
      plannedDate: start,
      startDate: start,
      endDate: end,
      activityType: data.activityType,
      category: record.category,
      title: data.title,
      description: data.description,
      targetAudience: data.targetAudience,
      status: 'planned'
    };
  }

  public updateItem(id: string, data: {
    title?: string;
    activityType?: string;
    targetAudience?: string;
    startDate?: string;
    endDate?: string;
    plannedDate?: string;
    description?: string;
    category?: string;
    status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  }): AnnualPlanItemDto {
    const existing = this.db.select().from(schema.annualPlanItems).where(eq(schema.annualPlanItems.id, id)).get();
    if (!existing) throw new Error('Plan faaliyeti bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;

    const updates: any = {
      updatedAt: now,
      version: newVersion,
      lastModifiedDeviceId: this.deviceId
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.activityType !== undefined) updates.activityType = data.activityType;
    if (data.targetAudience !== undefined) updates.targetAudience = data.targetAudience;
    if (data.startDate !== undefined) {
      updates.startDate = data.startDate;
      updates.plannedDate = data.startDate;
    }
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.description !== undefined) updates.description = data.description;
    if (data.category !== undefined) updates.category = data.category;
    if (data.status !== undefined) {
      updates.status = data.status;
      updates.completedAt = data.status === 'completed' ? now : null;
    }

    this.db.transaction((tx) => {
      tx.update(schema.annualPlanItems)
        .set(updates)
        .where(eq(schema.annualPlanItems.id, id))
        .run();

      this.syncEngine.queueChange('annual_plan_items', id, 'update', existing.version, newVersion, existing, updates, tx);
    });

    const updated = this.db.select().from(schema.annualPlanItems).where(eq(schema.annualPlanItems.id, id)).get()!;
    return {
      id: updated.id,
      annualPlanId: updated.annualPlanId,
      plannedDate: updated.plannedDate,
      startDate: updated.startDate || updated.plannedDate,
      endDate: updated.endDate || updated.plannedDate,
      activityType: updated.activityType || undefined,
      category: updated.category,
      title: updated.title,
      description: updated.description || undefined,
      targetAudience: updated.targetAudience || undefined,
      status: updated.status as any,
      completedAt: updated.completedAt || undefined
    };
  }

  public updateItemStatus(itemId: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled'): AnnualPlanItemDto {
    return this.updateItem(itemId, { status });
  }

  public deleteItem(itemId: string): boolean {
    const item = this.db.select().from(schema.annualPlanItems).where(eq(schema.annualPlanItems.id, itemId)).get();
    if (!item) return false;

    const now = Date.now();
    const newVersion = item.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.annualPlanItems)
        .set({ deletedAt: now, version: newVersion, updatedAt: now, lastModifiedDeviceId: this.deviceId })
        .where(eq(schema.annualPlanItems.id, itemId))
        .run();

      this.syncEngine.queueChange('annual_plan_items', itemId, 'delete', item.version, newVersion, item, { deletedAt: now }, tx);
    });

    return true;
  }
}
