/**
 * Robust Local Timezone Date Utilities
 * Ensures all date calculations strictly use the client's local year, month, and day
 * without any UTC day-shift bugs.
 */

export const getLocalDateIso = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatIsoToTr = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

export const addDaysToIso = (isoDate: string, days: number): string => {
  const parts = isoDate.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  return getLocalDateIso(d);
};

export const getMondayOfWeek = (d: Date = new Date()): Date => {
  const now = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = now.getDay();
  // Sunday is 0 -> diff is -6, Monday is 1 -> diff is 0, Tuesday is 2 -> diff is -1, etc.
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return now;
};
