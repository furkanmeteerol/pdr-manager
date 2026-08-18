import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { isNull, like, or, and, eq } from 'drizzle-orm';
import * as schema from '@database/schema';
import { SearchResultItem } from '@shared/ipc-types';

export class SearchService {
  private db: BetterSQLite3Database<typeof schema>;

  constructor(db: BetterSQLite3Database<typeof schema>) {
    this.db = db;
  }

  public query(term: string): SearchResultItem[] {
    if (!term || term.trim().length < 1) return [];
    const s = `%${term.trim()}%`;
    const results: SearchResultItem[] = [];

    // 1. Search Students
    const studentRows = this.db.select({
      student: schema.students,
      className: schema.classes.name
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(
      and(
        isNull(schema.students.deletedAt),
        or(
          like(schema.students.firstName, s),
          like(schema.students.lastName, s),
          like(schema.students.studentNumber, s)
        )!
      )
    )
    .limit(10)
    .all();

    for (const r of studentRows) {
      results.push({
        id: r.student.id,
        type: 'student',
        title: `${r.student.firstName} ${r.student.lastName}`,
        subtitle: `No: ${r.student.studentNumber} • Sınıf: ${r.className || 'Atanmamış'}`,
        badge: r.student.status === 'active' ? 'Aktif Öğrenci' : r.student.status,
        studentId: r.student.id
      });
    }

    // 2. Search Meetings
    const meetingRows = this.db.select({
      meeting: schema.meetings,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName
    })
    .from(schema.meetings)
    .leftJoin(schema.students, eq(schema.meetings.studentId, schema.students.id))
    .where(
      and(
        isNull(schema.meetings.deletedAt),
        or(
          like(schema.meetings.subject, s),
          like(schema.meetings.summary, s)
        )!
      )
    )
    .limit(10)
    .all();

    for (const r of meetingRows) {
      const studentInfo = r.studentFirstName ? ` (${r.studentFirstName} ${r.studentLastName})` : '';
      results.push({
        id: r.meeting.id,
        type: 'meeting',
        title: r.meeting.subject,
        subtitle: `${r.meeting.date} • ${r.meeting.meetingType}${studentInfo}`,
        badge: 'Görüşme',
        studentId: r.meeting.studentId || undefined
      });
    }

    // 3. Search Appointments
    const apptRows = this.db.select()
      .from(schema.appointments)
      .where(
        and(
          isNull(schema.appointments.deletedAt),
          or(
            like(schema.appointments.title, s),
            like(schema.appointments.location, s)
          )!
        )
      )
      .limit(5)
      .all();

    for (const a of apptRows) {
      results.push({
        id: a.id,
        type: 'appointment',
        title: a.title,
        subtitle: `${a.date} ${a.startTime} • ${a.location}`,
        badge: 'Randevu',
        studentId: a.studentId || undefined
      });
    }

    // 4. Search Tasks
    const taskRows = this.db.select()
      .from(schema.tasks)
      .where(
        and(
          isNull(schema.tasks.deletedAt),
          like(schema.tasks.title, s)
        )
      )
      .limit(5)
      .all();

    for (const t of taskRows) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: t.dueDate ? `Son Tarih: ${t.dueDate}` : 'Genel Görev',
        badge: t.priority.toUpperCase(),
        studentId: t.studentId || undefined
      });
    }

    return results;
  }
}
