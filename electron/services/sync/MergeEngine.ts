export interface FieldConflict {
  field: string;
  baseValue: any;
  localValue: any;
  remoteValue: any;
}

export interface MergeResult<T = Record<string, any>> {
  success: boolean;
  hasConflicts: boolean;
  mergedData: T;
  conflicts: FieldConflict[];
}

export class MergeEngine {
  /**
   * Deterministic True 3-Way Merge Algorithm (BASE vs LOCAL vs REMOTE)
   */
  public static mergeEntities<T extends Record<string, any>>(
    base: T | null | undefined,
    local: T,
    remote: T
  ): MergeResult<T> {
    const mergedData = { ...local } as Record<string, any>;
    const conflicts: FieldConflict[] = [];

    // If there is no ancestor baseline (e.g. both created independently with same ID)
    if (!base) {
      const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
      for (const key of allKeys) {
        if (key === 'version' || key === 'updated_at' || key === 'last_modified_device_id') continue;
        const localVal = local[key];
        const remoteVal = remote[key];
        if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
          conflicts.push({
            field: key,
            baseValue: undefined,
            localValue: localVal,
            remoteValue: remoteVal
          });
        }
      }
      return {
        success: conflicts.length === 0,
        hasConflicts: conflicts.length > 0,
        mergedData: local,
        conflicts
      };
    }

    const allKeys = new Set([
      ...Object.keys(base),
      ...Object.keys(local),
      ...Object.keys(remote)
    ]);

    for (const key of allKeys) {
      // Skip internal metadata fields from conflict comparison
      if (key === 'version' || key === 'updated_at' || key === 'created_at' || key === 'last_modified_device_id') {
        continue;
      }

      const baseVal = base[key];
      const localVal = local[key];
      const remoteVal = remote[key];

      const localSameAsBase = JSON.stringify(localVal) === JSON.stringify(baseVal);
      const remoteSameAsBase = JSON.stringify(remoteVal) === JSON.stringify(baseVal);
      const localSameAsRemote = JSON.stringify(localVal) === JSON.stringify(remoteVal);

      // Case 1: Remote changed, Local did not -> Accept Remote
      if (localSameAsBase && !remoteSameAsBase) {
        mergedData[key] = remoteVal;
      }
      // Case 2: Local changed, Remote did not -> Keep Local
      else if (!localSameAsBase && remoteSameAsBase) {
        mergedData[key] = localVal;
      }
      // Case 3: Both made the identical change -> Clean merge
      else if (localSameAsRemote) {
        mergedData[key] = localVal;
      }
      // Case 4: Both changed differently -> Field Conflict
      else {
        conflicts.push({
          field: key,
          baseValue: baseVal,
          localValue: localVal,
          remoteValue: remoteVal
        });
      }
    }

    // Assign incremented version
    const maxVersion = Math.max(local.version || 1, remote.version || 1);
    mergedData.version = maxVersion + 1;
    mergedData.updated_at = Date.now();

    return {
      success: conflicts.length === 0,
      hasConflicts: conflicts.length > 0,
      mergedData: mergedData as T,
      conflicts
    };
  }
}
