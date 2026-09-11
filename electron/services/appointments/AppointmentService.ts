import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, or, desc, sql } from 'drizzle-orm';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { notificationService } from '../notifications/NotificationService';
import { AppointmentScheduler } from '../notifications/AppointmentScheduler';
import { AppointmentDto } from '@shared/ipc-types';
import { logger } from '../logger/Logger';

export class AppointmentService {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine?: SyncEngine;
  private scheduler?: AppointmentScheduler;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine?: SyncEngine, scheduler?: AppointmentScheduler) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
    this.scheduler = scheduler;
  }

  public listAppointments(filter?: { date?: string; status?: string; studentId?: string }): AppointmentDto[] {
    let conditions = [isNull(schema.appointments.deletedAt)];

    if (filter?.date) {
      conditions.push(eq(schema.appointments.date, filter.date));
    }
    if (filter?.status) {
      conditions.push(eq(schema.appointments.status, filter.status));
    }
    if (filter?.studentId) {
      conditions.push(or(
        eq(schema.appointments.studentId, filter.studentId),
        sql`${schema.appointments.id} IN (SELECT appointment_id FROM appointment_participants WHERE student_id = ${filter.studentId})`
      )!);
    }

    const rows = this.db.select({
      appointment: schema.appointments,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName,
      studentNumber: schema.students.studentNumber,
      className: schema.classes.name
    })
    .from(schema.appointments)
    .leftJoin(schema.students, eq(schema.appointments.studentId, schema.students.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(...conditions))
    .orderBy(desc(schema.appointments.date), schema.appointments.startTime)
    .all();

    return rows.map(r => {
      const a = r.appointment;
      const studentName = r.studentFirstName ? `${r.studentFirstName} ${r.studentLastName}` : undefined;
      const studentIds = (a as any).studentIds ? JSON.parse((a as any).studentIds) : (a.studentId ? [a.studentId] : []);

      // Fetch participants from appointment_participants
      const participantRows = this.db.select({
        id: schema.students.id,
        firstName: schema.students.firstName,
        lastName: schema.students.lastName,
        studentNumber: schema.students.studentNumber,
        className: schema.classes.name
      })
      .from(schema.appointmentParticipants)
      .innerJoin(schema.students, eq(schema.appointmentParticipants.studentId, schema.students.id))
      .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
      .where(eq(schema.appointmentParticipants.appointmentId, a.id))
      .all();

      return {
        id: a.id,
        schoolYearId: a.schoolYearId,
        studentId: a.studentId,
        studentIds,
        studentName,
        studentNumber: r.studentNumber || undefined,
        relatedMeetingId: (a as any).relatedMeetingId || undefined,
        title: a.title,
        appointmentType: (a as any).appointmentType || 'Bireysel Öğrenci Görüşmesi',
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        location: a.location || 'Rehberlik Servisi',
        notes: a.notes || undefined,
        status: a.status as any,
        resultNote: (a as any).resultNote || undefined,
        reminderMinutes: a.reminderMinutes,
        notificationSent: a.notificationSent === 1,
        participants: participantRows.map(p => ({ ...p, className: p.className || undefined })),
        participantCount: participantRows.length > 0 ? participantRows.length : (a.studentId ? 1 : 0),
        version: a.version,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      };
    });
  }

  public getAppointmentById(id: string): AppointmentDto | null {
    const list = this.listAppointments();
    return list.find(a => a.id === id) || null;
  }

  public createAppointment(data: {
    schoolYearId: string;
    studentId?: string | null;
    studentIds?: string[];
    relatedMeetingId?: string | null;
    appointmentType?: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    notes?: string;
    reminderMinutes?: number;
  }): AppointmentDto {
    const now = Date.now();
    const id = crypto.randomUUID();
    const isGroup = data.appointmentType === 'Grup Rehberliği' 
      || data.appointmentType === 'Grup Rehberliği Takip Randevusu'
      || (data.studentIds && data.studentIds.length > 1)
      || (data.studentIds && data.studentIds.length > 0 && data.appointmentType?.includes('Grup'));

    const appointmentType = data.appointmentType || (isGroup ? 'Grup Rehberliği' : 'Bireysel Öğrenci Görüşmesi');

    const record = {
      id,
      schoolYearId: data.schoolYearId,
      studentId: isGroup ? null : (data.studentId ?? (data.studentIds && data.studentIds.length > 0 ? data.studentIds[0] : null)),
      relatedMeetingId: data.relatedMeetingId || null,
      appointmentType,
      studentIds: data.studentIds && data.studentIds.length > 0 ? JSON.stringify(data.studentIds) : (data.studentId ? JSON.stringify([data.studentId]) : null),
      title: data.title,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location || 'Rehberlik Servisi',
      notes: data.notes || null,
      status: 'scheduled',
      resultNote: null,
      reminderMinutes: data.reminderMinutes ?? 15,
      notificationSent: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.appointments).values(record).run();

      // Insert into appointment_participants
      if (data.studentIds && data.studentIds.length > 0) {
        for (const stId of data.studentIds) {
          tx.insert(schema.appointmentParticipants).values({
            id: crypto.randomUUID(),
            appointmentId: id,
            studentId: stId,
            createdAt: now
          }).run();
        }
      } else if (data.studentId) {
        tx.insert(schema.appointmentParticipants).values({
          id: crypto.randomUUID(),
          appointmentId: id,
          studentId: data.studentId,
          createdAt: now
        }).run();
      }

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'appointments',
          id,
          'create',
          0,
          1,
          null,
          record,
          tx
        );
      }

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'create_appointment',
        entityType: 'appointments',
        entityId: id,
        deviceId: this.deviceId,
        description: `Randevu oluşturuldu: ${data.title} (${data.date} ${data.startTime})`
      }).run();
    });

    // Notify user in system tray
    notificationService.showNotification(
      'Yeni Randevu Kaydedildi',
      `${data.title} — ${data.date} saat ${data.startTime}`
    );

    const created = this.getAppointmentById(id)!;

    if (this.scheduler && created.status === 'scheduled') {
      this.scheduler.scheduleAppointment({
        id: created.id,
        title: created.title,
        date: created.date,
        startTime: created.startTime,
        location: created.location,
        reminderMinutes: created.reminderMinutes,
        studentName: created.studentName
      });
    }

    return created;
  }

  public updateStatus(id: string, status: 'scheduled' | 'pending' | 'completed' | 'student_absent' | 'other' | 'cancelled' | 'no_show', resultNote?: string): AppointmentDto {
    const existing = this.getAppointmentById(id);
    if (!existing) throw new Error('Randevu bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    this.db.transaction((tx) => {
      tx.update(schema.appointments)
        .set({
          status,
          resultNote: resultNote || null,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.appointments.id, id))
        .run();

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'appointments',
          id,
          'update',
          existing.version,
          newVersion,
          baseSnapshot,
          { status, resultNote: resultNote || null },
          tx
        );
      }

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'update_appointment_status',
        entityType: 'appointments',
        entityId: id,
        deviceId: this.deviceId,
        description: `Randevu durumu güncellendi: ${existing.title} -> ${status}`
      }).run();
    });

    logger.info(`Updated appointment ${id} status to ${status}`);
    const updated = this.getAppointmentById(id)!;

    if (this.scheduler) {
      if (status === 'scheduled') {
        this.scheduler.scheduleAppointment({
          id: updated.id,
          title: updated.title,
          date: updated.date,
          startTime: updated.startTime,
          location: updated.location,
          reminderMinutes: updated.reminderMinutes,
          studentName: updated.studentName
        });
      } else {
        this.scheduler.cancelAppointment(id);
      }
    }

    return updated;
  }

  public updateAppointment(id: string, data: Partial<AppointmentDto> & { resultNote?: string }): AppointmentDto {
    const existing = this.getAppointmentById(id);
    if (!existing) throw new Error('Randevu bulunamadı');

    const now = Date.now();
    const newVersion = existing.version + 1;
    const baseSnapshot = { ...existing };

    const updateFields: any = {
      version: newVersion,
      updatedAt: now,
      lastModifiedDeviceId: this.deviceId
    };

    if (data.title !== undefined) updateFields.title = data.title;
    if (data.appointmentType !== undefined) updateFields.appointmentType = data.appointmentType;
    if (data.date !== undefined) updateFields.date = data.date;
    if (data.startTime !== undefined) updateFields.startTime = data.startTime;
    if (data.endTime !== undefined) updateFields.endTime = data.endTime;
    if (data.location !== undefined) updateFields.location = data.location;
    if (data.notes !== undefined) updateFields.notes = data.notes;
    if (data.status !== undefined) updateFields.status = data.status;
    if (data.resultNote !== undefined) updateFields.resultNote = data.resultNote;
    if (data.reminderMinutes !== undefined) updateFields.reminderMinutes = data.reminderMinutes;
    if (data.studentId !== undefined) updateFields.studentId = data.studentId;
    if (data.studentIds !== undefined) updateFields.studentIds = JSON.stringify(data.studentIds);

    this.db.transaction((tx) => {
      tx.update(schema.appointments)
        .set(updateFields)
        .where(eq(schema.appointments.id, id))
        .run();

      if (data.studentIds) {
        tx.delete(schema.appointmentParticipants).where(eq(schema.appointmentParticipants.appointmentId, id)).run();
        for (const stId of data.studentIds) {
          tx.insert(schema.appointmentParticipants).values({
            id: crypto.randomUUID(),
            appointmentId: id,
            studentId: stId,
            createdAt: now
          }).run();
        }
      }

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'appointments',
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
        action: 'update_appointment',
        entityType: 'appointments',
        entityId: id,
        deviceId: this.deviceId,
        description: `Randevu güncellendi: ${updateFields.title || existing.title}`
      }).run();
    });

    logger.info(`Updated appointment ${id}`);
    const updated = this.getAppointmentById(id)!;

    if (this.scheduler) {
      if (updated.status === 'scheduled') {
        this.scheduler.scheduleAppointment({
          id: updated.id,
          title: updated.title,
          date: updated.date,
          startTime: updated.startTime,
          location: updated.location,
          reminderMinutes: updated.reminderMinutes,
          studentName: updated.studentName
        });
      } else {
        this.scheduler.cancelAppointment(id);
      }
    }

    return updated;
  }

  public deleteAppointment(id: string): boolean {
    const existing = this.getAppointmentById(id);
    if (!existing) return false;

    const now = Date.now();
    const newVersion = existing.version + 1;

    this.db.transaction((tx) => {
      tx.update(schema.appointments)
        .set({
          deletedAt: now,
          version: newVersion,
          updatedAt: now,
          lastModifiedDeviceId: this.deviceId
        })
        .where(eq(schema.appointments.id, id))
        .run();

      if (this.syncEngine) {
        this.syncEngine.queueChange(
          'appointments',
          id,
          'delete',
          existing.version,
          newVersion,
          existing,
          { deletedAt: now },
          tx
        );
      }

      tx.insert(schema.auditLogs).values({
        id: crypto.randomUUID(),
        timestamp: now,
        action: 'delete_appointment',
        entityType: 'appointments',
        entityId: id,
        deviceId: this.deviceId,
        description: `Randevu silindi: ${existing.title}`
      }).run();
    });

    if (this.scheduler) {
      this.scheduler.cancelAppointment(id);
    }

    logger.info(`Soft deleted appointment ${id}`);
    return true;
  }

  public softDeleteAppointment(id: string): boolean {
    return this.deleteAppointment(id);
  }
}
