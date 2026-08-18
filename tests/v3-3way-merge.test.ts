import { describe, it, expect } from 'vitest';
import { SyncEngine } from '../electron/services/sync/SyncEngine';

describe('Phase V3: 3-Way Merge Deterministic Conflict Engine', () => {
  it('should auto-merge cleanly when only local changes a field', () => {
    const base = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', notes: 'Eski not' };
    const local = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', notes: 'Yerel yeni not' };
    const remote = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', notes: 'Eski not' };

    const result = SyncEngine.threeWayMerge(base, local, remote);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts.length).toBe(0);
    expect(result.merged.notes).toBe('Yerel yeni not');
  });

  it('should auto-merge cleanly when only remote changes a field', () => {
    const base = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali@okul.com' };
    const local = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali@okul.com' };
    const remote = { id: 'std-1', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali.guncel@okul.com' };

    const result = SyncEngine.threeWayMerge(base, local, remote);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts.length).toBe(0);
    expect(result.merged.email).toBe('ali.guncel@okul.com');
  });

  it('should auto-merge different modified fields without conflict', () => {
    const base = { id: 'std-1', phone: '555-1111', address: 'Eski Adres', status: 'active' };
    const local = { id: 'std-1', phone: '555-9999', address: 'Eski Adres', status: 'active' }; // local modified phone
    const remote = { id: 'std-1', phone: '555-1111', address: 'Yeni Mahalle Cad.', status: 'active' }; // remote modified address

    const result = SyncEngine.threeWayMerge(base, local, remote);

    expect(result.hasConflicts).toBe(false);
    expect(result.merged.phone).toBe('555-9999');
    expect(result.merged.address).toBe('Yeni Mahalle Cad.');
  });

  it('should detect side-by-side conflict when same field is modified differently in local and remote', () => {
    const base = { id: 'bep-1', accommodations: '15 dk ek süre' };
    const local = { id: 'bep-1', accommodations: '20 dk ek süre + büyük punto' };
    const remote = { id: 'bep-1', accommodations: '15 dk ek süre + okuyucu desteği' };

    const result = SyncEngine.threeWayMerge(base, local, remote);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].field).toBe('accommodations');
    expect(result.conflicts[0].baseValue).toBe('15 dk ek süre');
    expect(result.conflicts[0].localValue).toBe('20 dk ek süre + büyük punto');
    expect(result.conflicts[0].remoteValue).toBe('15 dk ek süre + okuyucu desteği');
  });

  it('should handle null base and produce conflicts for diverging initial fields', () => {
    const base = null;
    const local = { id: 'bip-1', targetBehavior: 'Derste konuşma', frequency: 'Günde 3' };
    const remote = { id: 'bip-1', targetBehavior: 'Derste dolaşma', frequency: 'Günde 3' };

    const result = SyncEngine.threeWayMerge(base, local, remote);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0].field).toBe('targetBehavior');
    expect(result.merged.frequency).toBe('Günde 3');
  });
});
