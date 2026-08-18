import { describe, it, expect } from 'vitest';
import { MergeEngine } from '../electron/services/sync/MergeEngine';

describe('MergeEngine — True 3-Way Merge', () => {
  it('should auto-merge non-overlapping independent field changes between PC A and PC B', () => {
    const base = {
      id: 'student-123',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '0555 111 0000',
      status: 'active',
      version: 1
    };

    // PC A changed phone only
    const localPCA = {
      id: 'student-123',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '0555 222 3333', // Changed by PC A
      status: 'active',
      version: 2
    };

    // PC B changed status only
    const remotePCB = {
      id: 'student-123',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      phone: '0555 111 0000', // Unchanged
      status: 'transferred',  // Changed by PC B
      version: 2
    };

    const result = MergeEngine.mergeEntities(base, localPCA, remotePCB);

    expect(result.hasConflicts).toBe(false);
    expect(result.success).toBe(true);
    expect(result.mergedData.phone).toBe('0555 222 3333'); // Preserved from PC A
    expect(result.mergedData.status).toBe('transferred');  // Cleanly accepted from PC B
    expect(result.mergedData.version).toBe(3);             // Incremented version
  });

  it('should cleanly accept identical modifications made on both PCs', () => {
    const base = {
      id: 'student-123',
      phone: '0555 111 0000',
      version: 1
    };

    const localPCA = {
      id: 'student-123',
      phone: '0555 999 9999',
      version: 2
    };

    const remotePCB = {
      id: 'student-123',
      phone: '0555 999 9999', // Exactly the same change
      version: 2
    };

    const result = MergeEngine.mergeEntities(base, localPCA, remotePCB);
    expect(result.hasConflicts).toBe(false);
    expect(result.mergedData.phone).toBe('0555 999 9999');
  });

  it('should detect a true conflict when both PCs modify the same field with different values', () => {
    const base = {
      id: 'student-123',
      phone: '0555 111 0000',
      version: 1
    };

    const localPCA = {
      id: 'student-123',
      phone: '0555 222 2222', // Modified by PC A
      version: 2
    };

    const remotePCB = {
      id: 'student-123',
      phone: '0555 333 3333', // Modified differently by PC B
      version: 2
    };

    const result = MergeEngine.mergeEntities(base, localPCA, remotePCB);
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].field).toBe('phone');
    expect(result.conflicts[0].baseValue).toBe('0555 111 0000');
    expect(result.conflicts[0].localValue).toBe('0555 222 2222');
    expect(result.conflicts[0].remoteValue).toBe('0555 333 3333');
  });
});
