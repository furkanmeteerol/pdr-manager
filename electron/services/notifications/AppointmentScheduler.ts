import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, gte } from 'drizzle-orm';
import * as schema from '@database/schema';
import { notificationService } from './NotificationService';
import { logger } from '../logger/Logger';

export class AppointmentScheduler {
  private db: BetterSQLite3Database<typeof schema>;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private focusWindowCallback?: () => void;

  constructor(db: BetterSQLite3Database<typeof schema>, focusWindowCallback?: () => void) {
    this.db = db;
    this.focusWindowCallback = focusWindowCallback;
  }

  public setFocusWindowCallback(cb: () => void): void {
    this.focusWindowCallback = cb;
  }

  /**
   * Reschedules notifications for all upcoming active appointments on app startup.
   */
  public init(): void {
    this.clearAll();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      
      const upcoming = this.db.select({
        id: schema.appointments.id,
        title: schema.appointments.title,
        date: schema.appointments.date,
        startTime: schema.appointments.startTime,
        location: schema.appointments.location,
        status: schema.appointments.status,
        reminderMinutes: schema.appointments.reminderMinutes,
        notificationSent: schema.appointments.notificationSent,
        deletedAt: schema.appointments.deletedAt,
        studentFirstName: schema.students.firstName,
        studentLastName: schema.students.lastName
      })
      .from(schema.appointments)
      .leftJoin(schema.students, eq(schema.appointments.studentId, schema.students.id))
      .where(and(
        isNull(schema.appointments.deletedAt),
        eq(schema.appointments.status, 'scheduled'),
        eq(schema.appointments.notificationSent, 0),
        gte(schema.appointments.date, todayStr)
      ))
      .all();

      logger.info(`AppointmentScheduler init: found ${upcoming.length} pending appointment notifications to schedule.`);

      for (const appt of upcoming) {
        const studentName = appt.studentFirstName ? `${appt.studentFirstName} ${appt.studentLastName}` : undefined;
        this.scheduleAppointment({
          id: appt.id,
          title: appt.title,
          date: appt.date,
          startTime: appt.startTime,
          location: appt.location || 'Rehberlik Servisi',
          reminderMinutes: appt.reminderMinutes,
          studentName
        });
      }
    } catch (err) {
      logger.warn('AppointmentScheduler init failed:', err);
    }
  }

  /**
   * Schedule a single appointment notification.
   */
  public scheduleAppointment(appointment: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    location?: string;
    reminderMinutes?: number;
    studentName?: string;
  }): void {
    // Cancel existing timer for this appointment if any
    this.cancelAppointment(appointment.id);

    const reminderMins = appointment.reminderMinutes ?? 15;
    const [year, month, day] = appointment.date.split('-').map(Number);
    const [hour, minute] = appointment.startTime.split(':').map(Number);

    if (!year || !month || !day || isNaN(hour) || isNaN(minute)) {
      return;
    }

    const apptDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    const triggerTime = apptDate.getTime() - reminderMins * 60 * 1000;
    const now = Date.now();
    const delay = triggerTime - now;

    if (delay <= 0) {
      // If reminder time has passed or appointment already started, check if within grace window
      const apptEndTime = apptDate.getTime() + 45 * 60 * 1000;
      if (now < apptEndTime && now >= triggerTime) {
        // Trigger immediately
        this.triggerNotification(appointment);
      }
      return;
    }

    // Node setTimeout max delay is 2147483647 ms (~24.8 days)
    if (delay > 2147483647) {
      return;
    }

    const timer = setTimeout(() => {
      this.triggerNotification(appointment);
      this.timers.delete(appointment.id);
    }, delay);

    this.timers.set(appointment.id, timer);
    logger.info(`Scheduled notification for appointment "${appointment.title}" in ${Math.round(delay / 60000)} minutes.`);
  }

  /**
   * Trigger native notification and mark as sent in database.
   */
  private triggerNotification(appointment: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    location?: string;
    studentName?: string;
  }): void {
    try {
      const studentInfo = appointment.studentName ? ` (${appointment.studentName})` : '';
      const notifTitle = `Randevu Hatırlatması: ${appointment.title}${studentInfo}`;
      const notifBody = `Saat ${appointment.startTime} - Yer: ${appointment.location || 'Rehberlik Servisi'}`;

      notificationService.showNotification(
        notifTitle,
        notifBody,
        () => {
          if (this.focusWindowCallback) {
            this.focusWindowCallback();
          }
        }
      );

      // Mark notificationSent = 1 in database
      this.db.update(schema.appointments)
        .set({ notificationSent: 1, updatedAt: Date.now() })
        .where(eq(schema.appointments.id, appointment.id))
        .run();

      logger.info(`Triggered appointment notification: ${appointment.id}`);
    } catch (err) {
      logger.warn(`Failed to trigger notification for appointment ${appointment.id}:`, err);
    }
  }

  /**
   * Cancel timer for an appointment.
   */
  public cancelAppointment(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  /**
   * Clear all active timers.
   */
  public clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }
}
