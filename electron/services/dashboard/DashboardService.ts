import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, sql } from 'drizzle-orm';
import * as schema from '@database/schema';
import { MeetingService } from '../meetings/MeetingService';
import { AppointmentService } from '../appointments/AppointmentService';
import { TaskService } from '../tasks/TaskService';
import { DashboardSummary } from '@shared/ipc-types';

export class DashboardService {
  private db: BetterSQLite3Database<typeof schema>;
  private meetingService: MeetingService;
  private appointmentService: AppointmentService;
  private taskService: TaskService;

  constructor(
    db: BetterSQLite3Database<typeof schema>,
    meetingService: MeetingService,
    appointmentService: AppointmentService,
    taskService: TaskService
  ) {
    this.db = db;
    this.meetingService = meetingService;
    this.appointmentService = appointmentService;
    this.taskService = taskService;
  }

  public getSummary(): DashboardSummary {
    const todayStr = new Date().toISOString().split('T')[0];

    // Counts
    const totalStudentsResult = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.students)
      .where(isNull(schema.students.deletedAt))
      .get();

    const totalMeetingsResult = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.meetings)
      .where(isNull(schema.meetings.deletedAt))
      .get();

    const followUpStudentsResult = this.db.select({ count: sql<number>`count(distinct ${schema.meetings.studentId})` })
      .from(schema.meetings)
      .where(and(eq(schema.meetings.followUpRequired, 1), isNull(schema.meetings.deletedAt)))
      .get();

    const todayAppointments = this.appointmentService.listAppointments({ date: todayStr });
    const allTasks = this.taskService.listTasks({ completed: false });
    const overdueTasks = allTasks.filter(t => t.isOverdue);
    const recentMeetings = this.meetingService.listMeetings();

    return {
      totalStudents: totalStudentsResult?.count || 0,
      totalMeetings: totalMeetingsResult?.count || 0,
      todayAppointmentsCount: todayAppointments.length,
      overdueTasksCount: overdueTasks.length,
      followUpStudentsCount: followUpStudentsResult?.count || 0,
      todayAppointments,
      upcomingTasks: allTasks.slice(0, 5),
      recentMeetings: recentMeetings.slice(0, 5)
    };
  }
}
