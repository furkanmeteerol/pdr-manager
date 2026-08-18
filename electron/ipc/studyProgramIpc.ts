import { ipcMain } from 'electron';
import { eq, isNull, desc } from 'drizzle-orm';
import { DatabaseService } from '../services/database/DatabaseService';
import * as schema from '@database/schema';
import { StudyPlanTemplateDto, PreparedStudyPlanDto } from '@shared/ipc-types';
import { logger } from '../services/logger/Logger';

export function registerStudyProgramIpc(databaseService: DatabaseService) {
  const db = databaseService.getDb();
  const sqlite = databaseService.getSqlite();
  const deviceId = databaseService.ensureDeviceId();

  // 1. Prepared Plans List
  ipcMain.handle('studyPrograms:listPlans', async (): Promise<PreparedStudyPlanDto[]> => {
    const rows = sqlite.prepare(`
      SELECT 
        sp.id,
        sp.student_id,
        sp.template_id,
        sp.template_name_snapshot,
        sp.features_snapshot,
        sp.title,
        sp.monday,
        sp.tuesday,
        sp.wednesday,
        sp.thursday,
        sp.friday,
        sp.saturday,
        sp.sunday,
        sp.start_date,
        sp.end_date,
        sp.notes,
        sp.created_at,
        st.first_name,
        st.last_name,
        st.student_number,
        cl.name as class_name
      FROM study_plans sp
      INNER JOIN students st ON sp.student_id = st.id
      LEFT JOIN classes cl ON st.class_id = cl.id
      WHERE sp.deleted_at IS NULL AND st.deleted_at IS NULL
      ORDER BY sp.created_at DESC
    `).all() as any[];

    return rows.map((r, idx) => {
      let parsedNotes: any = {};
      try {
        parsedNotes = JSON.parse(r.notes || '{}');
      } catch {
        parsedNotes = {};
      }

      const legacySchedule = parsedNotes.weeklySchedule || {};
      const legacySettings = parsedNotes.settings || {};

      const monday = r.monday || legacySchedule.monday || '';
      const tuesday = r.tuesday || legacySchedule.tuesday || '';
      const wednesday = r.wednesday || legacySchedule.wednesday || '';
      const thursday = r.thursday || legacySchedule.thursday || '';
      const friday = r.friday || legacySchedule.friday || '';
      const saturday = r.saturday || legacySchedule.saturday || '';
      const sunday = r.sunday || legacySchedule.sunday || '';

      let features = (r.features_snapshot || '').trim();
      if (!features && legacySettings) {
        const parts: string[] = [];
        if (legacySettings.pomodoro) parts.push('Pomodoro');
        if (legacySettings.generalReview) parts.push('Genel Tekrar');
        if (legacySettings.tomorrowPrep) parts.push('Yarına Hazırlık');
        if (legacySettings.bookReading) parts.push('Kitap Okuma');
        features = parts.join(' · ');
      }

      const planTitle = (r.template_name_snapshot || r.title || 'Ders Çalışma Planı').trim();

      return {
        id: r.id,
        index: idx + 1,
        studentId: r.student_id,
        studentNumber: r.student_number,
        studentName: `${r.first_name} ${r.last_name}`.trim(),
        className: r.class_name || '—',
        templateId: r.template_id || null,
        templateNameSnapshot: planTitle,
        featuresSnapshot: features,
        title: planTitle,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        startDate: r.start_date,
        endDate: r.end_date,
        dateFormatted: r.start_date || new Date(r.created_at).toLocaleDateString('tr-TR'),
        notes: r.notes || '',
        createdAt: r.created_at
      };
    });
  });

  // 2. Create Study Plan for Student (Deep copy / snapshot from template)
  ipcMain.handle('studyPrograms:createPlan', async (_event, data: {
    studentId: string;
    templateId?: string | null;
    templateNameSnapshot: string;
    featuresSnapshot?: string;
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
    settings?: any;
    weeklySchedule?: any;
  }): Promise<{ id: string; success: boolean }> => {
    const now = Date.now();
    const id = crypto.randomUUID();

    const planTitle = (data.templateNameSnapshot || 'Ders Çalışma Programı').trim();
    const features = (data.featuresSnapshot || '').trim();

    const monday = data.monday ?? data.weeklySchedule?.monday ?? '';
    const tuesday = data.tuesday ?? data.weeklySchedule?.tuesday ?? '';
    const wednesday = data.wednesday ?? data.weeklySchedule?.wednesday ?? '';
    const thursday = data.thursday ?? data.weeklySchedule?.thursday ?? '';
    const friday = data.friday ?? data.weeklySchedule?.friday ?? '';
    const saturday = data.saturday ?? data.weeklySchedule?.saturday ?? '';
    const sunday = data.sunday ?? data.weeklySchedule?.sunday ?? '';

    // Legacy backup format in notes for safety
    const notesPayload = JSON.stringify({
      templateName: planTitle,
      features,
      weeklySchedule: { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
      userNotes: data.notes || ''
    });

    const newRecord = {
      id,
      studentId: data.studentId,
      templateId: data.templateId || null,
      templateNameSnapshot: planTitle,
      featuresSnapshot: features,
      title: planTitle,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: notesPayload,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    };

    db.insert(schema.studyPlans).values(newRecord).run();
    logger.info(`Created study plan for student ${data.studentId}: ${planTitle} (${id})`);

    return { id, success: true };
  });

  // 3. Delete Study Plan
  ipcMain.handle('studyPrograms:deletePlan', async (_event, id: string): Promise<boolean> => {
    db.update(schema.studyPlans).set({
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).where(eq(schema.studyPlans.id, id)).run();

    logger.info(`Deleted study plan ${id}`);
    return true;
  });

  // 4. List Draft Templates
  ipcMain.handle('studyPrograms:listTemplates', async (): Promise<StudyPlanTemplateDto[]> => {
    const rows = db.select().from(schema.studyPlanTemplates)
      .where(isNull(schema.studyPlanTemplates.deletedAt))
      .orderBy(desc(schema.studyPlanTemplates.createdAt))
      .all();

    return rows.map(r => {
      let weeklySchedule: any = {};
      let settings: any = {};
      try { weeklySchedule = JSON.parse(r.weeklySchedule || '{}'); } catch {}
      try { settings = JSON.parse(r.settings || '{}'); } catch {}

      const name = (r.name || r.title || '').trim();
      let features = (r.features || '').trim();

      if (!features && settings) {
        const parts: string[] = [];
        if (settings.pomodoro) parts.push('Pomodoro');
        if (settings.generalReview) parts.push('Genel Tekrar');
        if (settings.tomorrowPrep) parts.push('Yarına Hazırlık');
        if (settings.bookReading) parts.push('Kitap Okuma');
        features = parts.join(' · ');
      }

      const monday = r.monday || weeklySchedule.monday || '';
      const tuesday = r.tuesday || weeklySchedule.tuesday || '';
      const wednesday = r.wednesday || weeklySchedule.wednesday || '';
      const thursday = r.thursday || weeklySchedule.thursday || '';
      const friday = r.friday || weeklySchedule.friday || '';
      const saturday = r.saturday || weeklySchedule.saturday || '';
      const sunday = r.sunday || weeklySchedule.sunday || '';

      return {
        id: r.id,
        name,
        title: name,
        features,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        settings,
        weeklySchedule: { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      };
    });
  });

  // 5. Save Draft Template (Immutable standard template)
  ipcMain.handle('studyPrograms:saveTemplate', async (_event, data: {
    id?: string;
    name?: string;
    title?: string;
    features?: string;
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
    settings?: any;
    weeklySchedule?: any;
  }): Promise<StudyPlanTemplateDto> => {
    const now = Date.now();
    const id = data.id || crypto.randomUUID();

    const name = (data.name || data.title || 'Yeni Taslak Plan').trim();
    const features = (data.features || '').trim();

    const monday = data.monday ?? data.weeklySchedule?.monday ?? '';
    const tuesday = data.tuesday ?? data.weeklySchedule?.tuesday ?? '';
    const wednesday = data.wednesday ?? data.weeklySchedule?.wednesday ?? '';
    const thursday = data.thursday ?? data.weeklySchedule?.thursday ?? '';
    const friday = data.friday ?? data.weeklySchedule?.friday ?? '';
    const saturday = data.saturday ?? data.weeklySchedule?.saturday ?? '';
    const sunday = data.sunday ?? data.weeklySchedule?.sunday ?? '';

    const weeklySchedulePayload = JSON.stringify({
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday
    });

    const settingsPayload = JSON.stringify(data.settings || { features });

    db.insert(schema.studyPlanTemplates).values({
      id,
      name,
      title: name,
      features,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      settings: settingsPayload,
      weeklySchedule: weeklySchedulePayload,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: deviceId
    }).run();

    logger.info(`Saved immutable study plan template: ${name} (${id})`);

    return {
      id,
      name,
      title: name,
      features,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      settings: data.settings || { features },
      weeklySchedule: { monday, tuesday, wednesday, thursday, friday, saturday, sunday },
      createdAt: now,
      updatedAt: now
    };
  });

  // 6. Delete Draft Template (Does NOT delete previously created student study plans!)
  ipcMain.handle('studyPrograms:deleteTemplate', async (_event, id: string): Promise<boolean> => {
    db.update(schema.studyPlanTemplates).set({
      deletedAt: Date.now(),
      updatedAt: Date.now(),
      lastModifiedDeviceId: deviceId
    }).where(eq(schema.studyPlanTemplates.id, id)).run();

    logger.info(`Deleted study plan template ${id} (Existing student plans preserved)`);
    return true;
  });
}
