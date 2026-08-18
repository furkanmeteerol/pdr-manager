import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, or, gte, lte, desc, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { MeetingDto, MeetingTagDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class MeetingService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
    this.ensureDefaultTags();
  }

  public ensureDefaultTags(): void {
    const defaultTags = [
      'Akademik', 'Motivasyon', 'Sınav Kaygısı', 'Ailevi',
      'Sosyal Uyum', 'Kariyer & Meslek', 'Devamsızlık', 'Davranış Sorunları'
    ];

    for (const tag of defaultTags) {
      this.db.insert(schema.meetingTags)
        .values({ id: crypto.randomUUID(), name: tag })
        .onConflictDoNothing()
        .run();
    }
  }

  public getTags(): MeetingTagDto[] {
    return this.db.select().from(schema.meetingTags).all();
  }

  public getStudentMeetingCount(studentId: string): number {
    const rows = this.db.select()
      .from(schema.meetings)
      .where(and(
        eq(schema.meetings.studentId, studentId),
        isNull(schema.meetings.deletedAt)
      ))
      .all();

    // Isolated counter: Filter out Group Guidance so group participation does NOT increment individual counter
    const individualMeetings = rows.filter(m => {
      const pType = (m as any).participantType;
      const mType = m.meetingType;
      return pType !== 'Grup' && pType !== 'group' && mType !== 'group' && mType !== 'group_guidance';
    });

    return individualMeetings.length;
  }

  public listMeetings(filter?: {
    studentId?: string;
    meetingType?: string;
    dateFrom?: string;
    dateTo?: string;
    followUpOnly?: boolean;
  }): MeetingDto[] {
    let conditions = [isNull(schema.meetings.deletedAt)];

    if (filter?.studentId) {
      conditions.push(or(
        eq(schema.meetings.studentId, filter.studentId),
        sql`${schema.meetings.id} IN (SELECT meeting_id FROM meeting_participants WHERE student_id = ${filter.studentId})`
      )!);
    }
    if (filter?.meetingType) {
      conditions.push(eq(schema.meetings.meetingType, filter.meetingType));
    }
    if (filter?.dateFrom) {
      conditions.push(gte(schema.meetings.date, filter.dateFrom));
    }
    if (filter?.dateTo) {
      conditions.push(lte(schema.meetings.date, filter.dateTo));
    }
    if (filter?.followUpOnly) {
      conditions.push(eq(schema.meetings.followUpRequired, 1));
    }

    const rows = this.db.select({
      meeting: schema.meetings,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName,
      studentNumber: schema.students.studentNumber,
      className: schema.classes.name
    })
    .from(schema.meetings)
    .leftJoin(schema.students, eq(schema.meetings.studentId, schema.students.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(...conditions))
    .orderBy(desc(schema.meetings.date), desc(schema.meetings.startTime))
    .all();

    const results: MeetingDto[] = [];
    for (const r of rows) {
      const m = r.meeting;
      // Get meeting tags
      const tagRows = this.db.select({
        tag: schema.meetingTags
      })
      .from(schema.meetingTagRelations)
      .innerJoin(schema.meetingTags, eq(schema.meetingTagRelations.tagId, schema.meetingTags.id))
      .where(eq(schema.meetingTagRelations.meetingId, m.id))
      .all();

      // Get meeting participants if group
      const participantRows = this.db.select({
        id: schema.students.id,
        firstName: schema.students.firstName,
        lastName: schema.students.lastName,
        studentNumber: schema.students.studentNumber,
        className: schema.classes.name
      })
      .from(schema.meetingParticipants)
      .innerJoin(schema.students, eq(schema.meetingParticipants.studentId, schema.students.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .where(eq(schema.meetingParticipants.meetingId, m.id))
      .all();

      const studentName = r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName}` : undefined;
      const studentIds = (m as any).studentIds ? JSON.parse((m as any).studentIds) : (m.studentId ? [m.studentId] : []);
      const referralInstitutions = (m as any).referralInstitutions ? JSON.parse((m as any).referralInstitutions) : [];

      results.push({
        id: m.id,
        schoolYearId: m.schoolYearId,
        studentId: m.studentId,
        studentIds,
        studentName,
        studentNumber: r.studentNumber || undefined,
        className: r.className || undefined,
        meetingType: m.meetingType as any,
        guidanceServiceType: (m as any).guidanceServiceType || 'Psikolojik Danışma',
        mebbisProcessed: (m as any).mebbisProcessed === 1,
        date: m.date,
        startTime: m.startTime,
        endTime: (m as any).endTime || undefined,
        duration: m.duration,
        subject: m.subject,
        summary: m.summary,
        notes: m.notes,
        decisions: m.decisions || undefined,
        followUpRequired: m.followUpRequired === 1,
        followUpDate: m.followUpDate || undefined,
        meetingTopic: (m as any).meetingTopic || undefined,
        meetingTopicOther: (m as any).meetingTopicOther || undefined,
        activityType: (m as any).activityType || undefined,
        activityTypeOther: (m as any).activityTypeOther || undefined,
        referralInstitutions,
        referralOther: (m as any).referralOther || undefined,
        participantType: (m as any).participantType || undefined,
        parentRelation: (m as any).parentRelation || undefined,
        teacherName: (m as any).teacherName || undefined,
        teacherBranch: (m as any).teacherBranch || undefined,
        sessionNumber: (m as any).sessionNumber || undefined,
        plannedSessions: (m as any).plannedSessions || undefined,
        participants: participantRows.map(p => ({ ...p, className: p.className || undefined })),
        tags: tagRows.map(t => ({ id: t.tag.id, name: t.tag.name })),
        version: m.version,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      });
    }

    return results;
  }

  public getMeetingById(id: string): MeetingDto | null {
    const row = this.db.select({
      meeting: schema.meetings,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName,
      studentNumber: schema.students.studentNumber,
      className: schema.classes.name
    })
    .from(schema.meetings)
    .leftJoin(schema.students, eq(schema.meetings.studentId, schema.students.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(eq(schema.meetings.id, id), isNull(schema.meetings.deletedAt)))
    .get();

    if (!row) return null;
    const m = row.meeting;

    const tagRows = this.db.select({
      tag: schema.meetingTags
    })
    .from(schema.meetingTagRelations)
    .innerJoin(schema.meetingTags, eq(schema.meetingTagRelations.tagId, schema.meetingTags.id))
    .where(eq(schema.meetingTagRelations.meetingId, m.id))
    .all();

    const participantRows = this.db.select({
      id: schema.students.id,
      firstName: schema.students.firstName,
      lastName: schema.students.lastName,
      studentNumber: schema.students.studentNumber,
      className: schema.classes.name
    })
    .from(schema.meetingParticipants)
    .innerJoin(schema.students, eq(schema.meetingParticipants.studentId, schema.students.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(eq(schema.meetingParticipants.meetingId, m.id))
    .all();

    const studentName = row.studentFirstName ? `${row.studentFirstName} ${row.studentLastName}` : undefined;
    const studentIds = (m as any).studentIds ? JSON.parse((m as any).studentIds) : (m.studentId ? [m.studentId] : []);
    const referralInstitutions = (m as any).referralInstitutions ? JSON.parse((m as any).referralInstitutions) : [];

    return {
      id: m.id,
      schoolYearId: m.schoolYearId,
      studentId: m.studentId,
      studentIds,
      studentName,
      studentNumber: row.studentNumber || undefined,
      className: row.className || undefined,
      meetingType: m.meetingType as any,
      guidanceServiceType: (m as any).guidanceServiceType || 'Psikolojik Danışma',
      mebbisProcessed: (m as any).mebbisProcessed === 1,
      date: m.date,
      startTime: m.startTime,
      endTime: (m as any).endTime || undefined,
      duration: m.duration,
      subject: m.subject,
      summary: m.summary,
      notes: m.notes,
      decisions: m.decisions || undefined,
      followUpRequired: m.followUpRequired === 1,
      followUpDate: m.followUpDate || undefined,
      meetingTopic: (m as any).meetingTopic || undefined,
      meetingTopicOther: (m as any).meetingTopicOther || undefined,
      activityType: (m as any).activityType || undefined,
      activityTypeOther: (m as any).activityTypeOther || undefined,
      referralInstitutions,
      referralOther: (m as any).referralOther || undefined,
      participantType: (m as any).participantType || undefined,
      parentRelation: (m as any).parentRelation || undefined,
      teacherName: (m as any).teacherName || undefined,
      teacherBranch: (m as any).teacherBranch || undefined,
      sessionNumber: (m as any).sessionNumber || undefined,
      plannedSessions: (m as any).plannedSessions || undefined,
      participants: participantRows.map(p => ({ ...p, className: p.className || undefined })),
      tags: tagRows.map(t => ({ id: t.tag.id, name: t.tag.name })),
      version: m.version,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    };
  }

  public createMeeting(data: {
    schoolYearId: string;
    studentId?: string | null;
    studentIds?: string[];
    meetingType: string;
    guidanceServiceType?: string;
    date: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    subject: string;
    summary: string;
    notes?: string;
    decisions?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    meetingTopic?: string;
    meetingTopicOther?: string;
    activityType?: string;
    activityTypeOther?: string;
    referralInstitutions?: string[];
    referralOther?: string;
    participantType?: string;
    parentRelation?: string;
    teacherName?: string;
    teacherBranch?: string;
    sessionNumber?: number;
    plannedSessions?: number;
    followUpAppointment?: {
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      notes?: string;
      reminderMinutes?: number;
    };
    tagNames?: string[];
  }): MeetingDto {
    const now = Date.now();
    const meetingId = crypto.randomUUID();
    const isGroup = data.participantType === 'Grup' || data.participantType === 'group' || data.meetingType === 'group' || data.meetingType === 'group_guidance';
    const studentId = isGroup ? null : (data.studentId ?? (data.studentIds && data.studentIds.length > 0 ? data.studentIds[0] : null));

    // Calculate session number for individual student if not explicitly provided and not group
    let sessionNumber = data.sessionNumber;
    if (!sessionNumber && !isGroup && studentId) {
      sessionNumber = this.getStudentMeetingCount(studentId) + 1;
    }

    const meetingRecord = {
      id: meetingId,
      schoolYearId: data.schoolYearId,
      studentId,
      meetingType: data.meetingType || 'student',
      guidanceServiceType: data.guidanceServiceType || 'Psikolojik Danışma',
      studentIds: data.studentIds && data.studentIds.length > 0 ? JSON.stringify(data.studentIds) : null,
      mebbisProcessed: 0,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime || null,
      duration: data.duration ?? 30,
      subject: data.subject,
      summary: data.summary,
      notes: data.notes || '',
      decisions: data.decisions || null,
      followUpRequired: data.followUpRequired ? 1 : 0,
      followUpDate: data.followUpDate || null,
      meetingTopic: data.meetingTopic || null,
      meetingTopicOther: data.meetingTopicOther || null,
      activityType: data.activityType || null,
      activityTypeOther: data.activityTypeOther || null,
      referralInstitutions: data.referralInstitutions ? JSON.stringify(data.referralInstitutions) : null,
      referralOther: data.referralOther || null,
      participantType: data.participantType || 'Öğrenci',
      parentRelation: data.parentRelation || null,
      teacherName: data.teacherName || null,
      teacherBranch: data.teacherBranch || null,
      sessionNumber: sessionNumber || 1,
      plannedSessions: data.plannedSessions || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      // 1. Insert Meeting
      tx.insert(schema.meetings).values(meetingRecord).run();

      // 2. Insert Group Participants
      if (data.studentIds && data.studentIds.length > 0) {
        for (const stId of data.studentIds) {
          tx.insert(schema.meetingParticipants).values({
            id: crypto.randomUUID(),
            meetingId,
            studentId: stId,
            createdAt: now
          }).run();
        }
      }

      // 3. Attach Tags
      if (data.tagNames && data.tagNames.length > 0) {
        for (const tagName of data.tagNames) {
          let tag = tx.select().from(schema.meetingTags).where(eq(schema.meetingTags.name, tagName)).get();
          if (!tag) {
            const newTag = { id: crypto.randomUUID(), name: tagName };
            tx.insert(schema.meetingTags).values(newTag).run();
            tag = newTag;
          }
          tx.insert(schema.meetingTagRelations).values({
            meetingId,
            tagId: tag.id
          }).run();
        }
      }

      // 4. Create Follow-Up Appointment if requested (Req 3)
      if (data.followUpRequired && data.followUpAppointment) {
        const appointmentId = crypto.randomUUID();
        const appointmentRecord = {
          id: appointmentId,
          schoolYearId: data.schoolYearId,
          studentId: studentId || (data.studentIds && data.studentIds.length > 0 ? data.studentIds[0] : null),
          studentIds: data.studentIds && data.studentIds.length > 0 ? JSON.stringify(data.studentIds) : null,
          relatedMeetingId: meetingId,
          appointmentType: isGroup ? 'Grup Rehberliği Takip Randevusu' : 'Görüşme Takip Randevusu',
          title: data.followUpAppointment.title,
          date: data.followUpAppointment.date,
          startTime: data.followUpAppointment.startTime,
          endTime: data.followUpAppointment.endTime,
          location: data.followUpAppointment.location || 'Rehberlik Servisi',
          notes: data.followUpAppointment.notes || null,
          status: 'scheduled',
          resultNote: null,
          reminderMinutes: data.followUpAppointment.reminderMinutes ?? 15,
          notificationSent: 0,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
          lastModifiedDeviceId: this.deviceId
        };

        tx.insert(schema.appointments).values(appointmentRecord).run();

        // Insert into appointment_participants
        if (data.studentIds && data.studentIds.length > 0) {
          for (const stId of data.studentIds) {
            tx.insert(schema.appointmentParticipants).values({
              id: crypto.randomUUID(),
              appointmentId,
              studentId: stId,
              createdAt: now
            }).run();
          }
        } else if (studentId) {
          tx.insert(schema.appointmentParticipants).values({
            id: crypto.randomUUID(),
            appointmentId,
            studentId,
            createdAt: now
          }).run();
        }

        this.syncEngine.queueChange(
          'appointments',
          appointmentId,
          'create',
          0,
          1,
          null,
          appointmentRecord,
          tx
        );
      }

      // 5. Queue Sync Change for Meeting
      this.syncEngine.queueChange(
        'meetings',
        meetingId,
        'create',
        0,
        1,
        null,
        meetingRecord,
        tx
      );

      // 6. Audit Log
      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'create_meeting',
        entityType: 'meetings',
        entityId: meetingId,
        deviceId: this.deviceId,
        description: `Görüşme oluşturuldu: ${data.subject} (${data.participantType || data.meetingType})`
      }).run();
    });

    logger.info(`Created meeting ${meetingId}: ${data.subject}`);
    return this.getMeetingById(meetingId)!;
  }

  public updateMeeting(id: string, data: Partial<MeetingDto> & { tagNames?: string[] }): MeetingDto {
    const existing = this.getMeetingById(id);
    if (!existing) throw new Error('Görüşme bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;

    const updateFields: any = {
      version: newVersion,
      updatedAt: now,
      lastModifiedDeviceId: this.deviceId
    };

    if (data.meetingType !== undefined) updateFields.meetingType = data.meetingType;
    if (data.date !== undefined) updateFields.date = data.date;
    if (data.startTime !== undefined) updateFields.startTime = data.startTime;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime;
    if (data.duration !== undefined) updateFields.duration = data.duration;
    if (data.subject !== undefined) updateFields.subject = data.subject;
    if (data.summary !== undefined) updateFields.summary = data.summary;
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.decisions !== undefined) updateFields.decisions = data.decisions;
    if (data.followUpRequired !== undefined) updateFields.followUpRequired = data.followUpRequired ? 1 : 0;
    if (data.followUpDate !== undefined) updateFields.followUpDate = data.followUpDate;
    if (data.meetingTopic !== undefined) updateFields.meetingTopic = data.meetingTopic;
    if (data.meetingTopicOther !== undefined) updateFields.meetingTopicOther = data.meetingTopicOther;
    if (data.activityType !== undefined) updateFields.activityType = data.activityType;
    if (data.activityTypeOther !== undefined) updateFields.activityTypeOther = data.activityTypeOther;
    if (data.referralInstitutions !== undefined) updateFields.referralInstitutions = JSON.stringify(data.referralInstitutions);
    if (data.referralOther !== undefined) updateFields.referralOther = data.referralOther;
    if (data.participantType !== undefined) updateFields.participantType = data.participantType;
    if (data.parentRelation !== undefined) updateFields.parentRelation = data.parentRelation;
    if (data.teacherName !== undefined) updateFields.teacherName = data.teacherName;
    if (data.teacherBranch !== undefined) updateFields.teacherBranch = data.teacherBranch;
    if (data.sessionNumber !== undefined) updateFields.sessionNumber = data.sessionNumber;
    if (data.plannedSessions !== undefined) updateFields.plannedSessions = data.plannedSessions;

    this.db.transaction((tx) => {
      tx.update(schema.meetings)
        .set(updateFields)
        .where(eq(schema.meetings.id, id))
        .run();

      if (data.tagNames) {
        tx.delete(schema.meetingTagRelations).where(eq(schema.meetingTagRelations.meetingId, id)).run();
        for (const tagName of data.tagNames) {
          let tag = tx.select().from(schema.meetingTags).where(eq(schema.meetingTags.name, tagName)).get();
          if (!tag) {
            const newTag = { id: crypto.randomUUID(), name: tagName };
            tx.insert(schema.meetingTags).values(newTag).run();
            tag = newTag;
          }
          tx.insert(schema.meetingTagRelations).values({ meetingId: id, tagId: tag.id }).run();
        }
      }

      this.syncEngine.queueChange(
        'meetings',
        id,
        'update',
        existing.version,
        newVersion,
        existing,
        updateFields,
        tx
      );
    });

    return this.getMeetingById(id)!;
  }

  public setMebbisStatus(id: string, processed: boolean): MeetingDto {
    const existing = this.getMeetingById(id);
    if (!existing) throw new Error('Görüşme bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.meetings)
        .set({
          mebbisProcessed: processed ? 1 : 0,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.meetings.id, id))
        .run();

      this.syncEngine.queueChange(
        'meetings',
        id,
        'update',
        existing.version,
        newVersion,
        existing,
        { mebbisProcessed: processed ? 1 : 0 },
        tx
      );
    });

    return this.getMeetingById(id)!;
  }

  public softDeleteMeeting(id: string): boolean {
    const existing = this.getMeetingById(id);
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.meetings)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.meetings.id, id))
        .run();

      this.syncEngine.queueChange(
        'meetings',
        id,
        'delete',
        existing.version,
        newVersion,
        existing,
        { deletedAt: now },
        tx
      );
    });

    return true;
  }
}
