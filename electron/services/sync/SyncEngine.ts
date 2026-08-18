import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { isNull } from 'drizzle-orm';
import * as schema from '@database/schema';
import { logger } from '../logger/Logger';
import { SyncStatus } from '@shared/ipc-types';
import { MergeEngine, MergeResult } from './MergeEngine';

export class SyncEngine {
  public static threeWayMerge<T extends Record<string, any>>(base: T | null | undefined, local: T, remote: T): MergeResult<T> & { merged: T } {
    const res = MergeEngine.mergeEntities(base, local, remote);
    return {
      ...res,
      merged: res.mergedData
    };
  }

  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private dek: Buffer | null = null;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string) {
    this.db = db;
    this.deviceId = deviceId;
  }

  public setDEK(dek: Buffer | null) {
    this.dek = dek;
  }

  public getDEK(): Buffer | null {
    return this.dek;
  }

  public recordChange(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    baseVersion: number = 0,
    newVersion: number = 1,
    baseSnapshot: any = null,
    payload: any = {},
    tx?: any
  ): void {
    const baseSnapshotObj = typeof baseSnapshot === 'string' ? (() => { try { return JSON.parse(baseSnapshot); } catch { return { data: baseSnapshot }; } })() : baseSnapshot;
    const payloadObj = typeof payload === 'string' ? (() => { try { return JSON.parse(payload); } catch { return { data: payload }; } })() : (payload || {});
    this.queueChange(entityType, entityId, operation, baseVersion, newVersion, baseSnapshotObj, payloadObj, tx);
  }

  /**
   * Record a mutation in the local sync changes table for local versioning/audit trail
   */
  public queueChange(
    entityType: string,
    entityId: string,
    operation: 'create' | 'update' | 'delete',
    baseVersion: number,
    newVersion: number,
    baseSnapshot: Record<string, any> | null,
    payload: Record<string, any>,
    tx?: any
  ): void {
    const target = tx || this.db;
    try {
      target.insert(schema.syncChanges).values({
        id: crypto.randomUUID(),
        entityType,
        entityId,
        operation,
        baseVersion,
        newVersion,
        baseSnapshot: baseSnapshot ? JSON.stringify(baseSnapshot) : null,
        payload: JSON.stringify(payload),
        changedAt: Date.now(),
        deviceId: this.deviceId,
        syncedAt: Date.now(),
        retryCount: 0
      }).run();
      logger.debug(`Recorded local change for ${entityType}:${entityId} (op=${operation}, v=${newVersion})`);
    } catch (err) {
      logger.warn(`Could not record local change log:`, err);
    }
  }

  /**
   * Get current sync status summary (always offline/local-first)
   */
  public getStatus(): SyncStatus {
    const pending = this.db.select().from(schema.syncChanges).where(isNull(schema.syncChanges.syncedAt)).all();
    return {
      state: 'synced',
      pendingCount: pending.length,
      lastSyncedAt: Date.now(),
      lastError: null,
      conflictCount: 0
    };
  }

  /**
   * Trigger local sync check - purely offline/local
   */
  public async triggerSync(): Promise<{ synced: boolean; changesPushed: number; changesPulled: number; conflicts: number }> {
    return {
      synced: true,
      changesPushed: 0,
      changesPulled: 0,
      conflicts: 0
    };
  }

  public async pullAndApplyRemoteChanges(): Promise<number> {
    return 0;
  }

  public async processSyncQueue(): Promise<{ pushed: number; failed: number; conflicts: number }> {
    return { pushed: 0, failed: 0, conflicts: 0 };
  }
}
