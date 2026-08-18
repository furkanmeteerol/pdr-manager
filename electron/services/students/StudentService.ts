import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, like, or, sql } from 'drizzle-orm';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { StudentDto, ParentDto, TeacherDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class StudentService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine?: SyncEngine;
  private onStudentChanged?: () => Promise<void> | void;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine?: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  public setOnStudentChanged(callback?: () => Promise<void> | void): void {
    this.onStudentChanged = callback;
  }

  private notifyStudentChanged(): void {
    if (this.onStudentChanged) {
      Promise.resolve(this.onStudentChanged()).catch(() => {});
    }
  }

  public listStudents(filter?: { schoolYearId?: string; classId?: string; search?: string; status?: string }): StudentDto[] {
    let conditions = [isNull(schema.students.deletedAt)];

    if (filter?.schoolYearId) {
      conditions.push(eq(schema.students.schoolYearId, filter.schoolYearId));
    }
    if (filter?.classId) {
      conditions.push(eq(schema.students.classId, filter.classId));
    }
    if (filter?.status) {
      conditions.push(eq(schema.students.status, filter.status));
    }
    if (filter?.search) {
      const s = `%${filter.search}%`;
      conditions.push(
        or(
          like(schema.students.firstName, s),
          like(schema.students.lastName, s),
          like(schema.students.studentNumber, s)
        )!
      );
    }

    const rows = this.db.select({
      student: schema.students,
      className: schema.classes.name
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(...conditions))
    .all();

    // Map rows and query meeting counts/follow-up stats
    const results: StudentDto[] = [];
    for (const r of rows) {
      const st = r.student;

      // Count meetings and check follow-up
      const meetingStats = this.db.select({
        count: sql<number>`count(*)`,
        hasFollowUp: sql<number>`max(case when ${schema.meetings.followUpRequired} = 1 then 1 else 0 end)`,
        lastDate: sql<string>`max(${schema.meetings.date})`
      })
      .from(schema.meetings)
      .where(and(eq(schema.meetings.studentId, st.id), isNull(schema.meetings.deletedAt)))
      .get();

      results.push({
        id: st.id,
        schoolYearId: st.schoolYearId,
        classId: st.classId,
        className: r.className || undefined,
        studentNumber: st.studentNumber,
        firstName: st.firstName,
        lastName: st.lastName,
        birthDate: st.birthDate || undefined,
        gender: st.gender as any,
        phone: st.phone || undefined,
        email: st.email || undefined,
        status: st.status as any,
        notes: st.notes || undefined,
        version: st.version,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
        meetingCount: meetingStats?.count || 0,
        lastMeetingDate: meetingStats?.lastDate || undefined,
        hasFollowUp: (meetingStats?.hasFollowUp || 0) === 1
      });
    }

    return results;
  }

  public getStudentById(id: string): StudentDto | null {
    const row = this.db.select({
      student: schema.students,
      className: schema.classes.name
    })
    .from(schema.students)
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(eq(schema.students.id, id), isNull(schema.students.deletedAt)))
    .get();

    if (!row) return null;
    const st = row.student;

    // Get linked parents
    const parentRows = this.db.select({
      parent: schema.parents,
      link: schema.studentParents
    })
    .from(schema.studentParents)
    .innerJoin(schema.parents, eq(schema.studentParents.parentId, schema.parents.id))
    .where(and(eq(schema.studentParents.studentId, id), isNull(schema.parents.deletedAt)))
    .all();

    const parents: ParentDto[] = parentRows.map(p => ({
      id: p.parent.id,
      firstName: p.parent.firstName,
      lastName: p.parent.lastName,
      phone: p.parent.phone || undefined,
      email: p.parent.email || undefined,
      occupation: p.parent.occupation || undefined,
      address: p.parent.address || undefined,
      notes: p.parent.notes || undefined,
      relationship: p.link.relationship,
      isPrimary: p.link.isPrimary === 1
    }));

    // Get linked teachers
    const teacherRows = this.db.select({
      teacher: schema.teachers,
      link: schema.studentTeachers
    })
    .from(schema.studentTeachers)
    .innerJoin(schema.teachers, eq(schema.studentTeachers.teacherId, schema.teachers.id))
    .where(and(eq(schema.studentTeachers.studentId, id), isNull(schema.teachers.deletedAt)))
    .all();

    const teachers: TeacherDto[] = teacherRows.map(t => ({
      id: t.teacher.id,
      firstName: t.teacher.firstName,
      lastName: t.teacher.lastName,
      branch: t.teacher.branch,
      phone: t.teacher.phone || undefined,
      email: t.teacher.email || undefined,
      notes: t.teacher.notes || undefined,
      relationship: t.link.relationship || undefined
    }));

    // Meeting stats
    const meetingStats = this.db.select({
      count: sql<number>`count(*)`,
      hasFollowUp: sql<number>`max(case when ${schema.meetings.followUpRequired} = 1 then 1 else 0 end)`,
      lastDate: sql<string>`max(${schema.meetings.date})`
    })
    .from(schema.meetings)
    .where(and(eq(schema.meetings.studentId, id), isNull(schema.meetings.deletedAt)))
    .get();

    return {
      id: st.id,
      schoolYearId: st.schoolYearId,
      classId: st.classId,
      className: row.className || undefined,
      studentNumber: st.studentNumber,
      firstName: st.firstName,
      lastName: st.lastName,
      birthDate: st.birthDate || undefined,
      gender: st.gender as any,
      phone: st.phone || undefined,
      email: st.email || undefined,
      status: st.status as any,
      notes: st.notes || undefined,
      version: st.version,
      createdAt: st.createdAt,
      updatedAt: st.updatedAt,
      parents,
      teachers,
      meetingCount: meetingStats?.count || 0,
      lastMeetingDate: meetingStats?.lastDate || undefined,
      hasFollowUp: (meetingStats?.hasFollowUp || 0) === 1
    };
  }

  public createStudent(data: {
    schoolYearId: string;
    classId?: string | null;
    studentNumber: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    gender: 'male' | 'female' | 'other';
    phone?: string;
    email?: string;
    status?: 'active' | 'inactive' | 'graduated' | 'transferred';
    notes?: string;
    parents?: Array<{ firstName: string; lastName: string; phone?: string; relationship: string; isPrimary?: boolean }>;
  }): StudentDto {
    const now = Date.now();
    const studentId = crypto.randomUUID();

    // Sanitize classId (empty string must be null for SQLite foreign key constraint)
    const sanitizedClassId = data.classId && data.classId.trim() !== '' ? data.classId.trim() : null;

    let resolvedYearId = data.schoolYearId && data.schoolYearId.trim() !== '' ? data.schoolYearId.trim() : 'default-year';
    const existingYear = this.db.select().from(schema.schoolYears).where(eq(schema.schoolYears.id, resolvedYearId)).get();
    if (!existingYear) {
      const activeYear = this.db.select().from(schema.schoolYears).where(eq(schema.schoolYears.isActive, 1)).get();
      resolvedYearId = activeYear ? activeYear.id : 'default-year';
    }

    const trimmedNumber = data.studentNumber.trim();
    if (!trimmedNumber) {
      throw new Error('Okul numarası boş olamaz.');
    }

    const existingWithSameNumber = this.db.select()
      .from(schema.students)
      .where(and(eq(schema.students.studentNumber, trimmedNumber), isNull(schema.students.deletedAt)))
      .get();

    if (existingWithSameNumber) {
      throw new Error('Bu okul numarasına sahip bir öğrenci zaten kayıtlı.');
    }

    const studentRecord = {
      id: studentId,
      schoolYearId: resolvedYearId,
      classId: sanitizedClassId,
      studentNumber: trimmedNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      birthDate: data.birthDate || null,
      gender: data.gender,
      phone: data.phone || null,
      email: data.email || null,
      status: data.status || 'active',
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      // 1. Insert Student
      tx.insert(schema.students).values(studentRecord).run();

      // 2. Queue Sync Change if enabled
      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'students',
          studentId,
          'create',
          0, // Base version
          1, // New version
          null, // No base snapshot
          studentRecord,
          tx
        );
      }

      // 3. Insert Parent records if provided
      if (data.parents && data.parents.length > 0) {
        for (const p of data.parents) {
          const parentId = crypto.randomUUID();
          const parentRecord = {
            id: parentId,
            firstName: p.firstName,
            lastName: p.lastName,
            phone: p.phone || null,
            email: null,
            occupation: null,
            address: null,
            notes: null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            version: 1,
            lastModifiedDeviceId: this.deviceId
          };
          tx.insert(schema.parents).values(parentRecord).run();
          tx.insert(schema.studentParents).values({
            studentId,
            parentId,
            relationship: p.relationship,
            isPrimary: p.isPrimary ? 1 : 0
          }).run();

          if (this.syncEngine) {
            this.syncEngine.queueChange(
              'parents',
              parentId,
              'create',
              0,
              1,
              null,
              parentRecord,
              tx
            );
          }
        }
      }

      // 4. Audit Log
      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'create_student',
        entityType: 'students',
        entityId: studentId,
        deviceId: this.deviceId,
        description: `Öğrenci oluşturuldu: ${data.firstName} ${data.lastName} (${data.studentNumber})`
      }).run();
    });

    logger.info(`Created student ${data.firstName} ${data.lastName} (${studentId})`);
    this.notifyStudentChanged();
    return this.getStudentById(studentId)!;
  }

  public updateStudent(id: string, data: Partial<StudentDto>): StudentDto {
    const existing = this.getStudentById(id);
    if (!existing) throw new Error('Öğrenci bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    const updateFields: any = {
      version: newVersion,
      updatedAt: now,
      lastModifiedDeviceId: this.deviceId
    };

    if (data.classId !== undefined) {
      updateFields.classId = data.classId && data.classId.trim() !== '' ? data.classId.trim() : null;
    }
    if (data.studentNumber !== undefined) {
      const trimmedNumber = data.studentNumber.trim();
      if (!trimmedNumber) {
        throw new Error('Okul numarası boş olamaz.');
      }
      const duplicate = this.db.select()
        .from(schema.students)
        .where(and(
          eq(schema.students.studentNumber, trimmedNumber),
          isNull(schema.students.deletedAt),
          sql`${schema.students.id} != ${id}`
        ))
        .get();

      if (duplicate) {
        throw new Error('Bu okul numarasına sahip bir öğrenci zaten kayıtlı.');
      }
      updateFields.studentNumber = trimmedNumber;
    }
    if (data.firstName !== undefined) updateFields.firstName = data.firstName;
    if (data.lastName !== undefined) updateFields.lastName = data.lastName;
    if (data.birthDate !== undefined) updateFields.birthDate = data.birthDate;
    if (data.gender !== undefined) updateFields.gender = data.gender;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.email !== undefined) updateFields.email = data.email;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.notes !== undefined) updateFields.notes = data.notes;

    this.db.transaction((tx) => {
      tx.update(schema.students)
        .set(updateFields)
        .where(eq(schema.students.id, id))
        .run();

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'students',
          id,
          'update',
          existing.version,
          newVersion,
          baseSnapshot,
          updateFields,
          tx
        );
      }

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'update_student',
        entityType: 'students',
        entityId: id,
        deviceId: this.deviceId,
        description: `Öğrenci güncellendi: ${existing.firstName} ${existing.lastName}`
      }).run();
    });

    logger.info(`Updated student ${id} to version ${newVersion}`);
    this.notifyStudentChanged();
    return this.getStudentById(id)!;
  }

  public softDeleteStudent(id: string): boolean {
    const existing = this.getStudentById(id);
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    this.db.transaction((tx) => {
      tx.update(schema.students)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.students.id, id))
        .run();

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'students',
          id,
          'delete',
          existing.version,
          newVersion,
          baseSnapshot,
          { id, deletedAt: now, version: newVersion },
          tx
        );
      }

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'delete_student',
        entityType: 'students',
        entityId: id,
        deviceId: this.deviceId,
        description: `Öğrenci silindi (Tombstone): ${existing.firstName} ${existing.lastName}`
      }).run();
    });

    logger.info(`Soft-deleted student ${id}`);
    this.notifyStudentChanged();
    return true;
  }
}
