import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { isNull, sql } from 'drizzle-orm';
import * as schema from '@database/schema';
import { StudentService } from '../students/StudentService';
import { MeetingService } from '../meetings/MeetingService';
import { logger } from '../logger/Logger';

export class ReportService {
  private db: BetterSQLite3Database<typeof schema>;
  private studentService: StudentService;
  private meetingService: MeetingService;

  constructor(
    db: BetterSQLite3Database<typeof schema>,
    studentService: StudentService,
    meetingService: MeetingService
  ) {
    this.db = db;
    this.studentService = studentService;
    this.meetingService = meetingService;
  }

  public getSchoolAnalytics(): any {
    // 1. Total student counts & distribution
    const totalStudents = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.students)
      .where(isNull(schema.students.deletedAt))
      .get()?.count || 0;

    // 2. Gender distribution
    const maleCount = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.students)
      .where(sql`${schema.students.deletedAt} IS NULL AND ${schema.students.gender} = 'male'`)
      .get()?.count || 0;

    const femaleCount = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.students)
      .where(sql`${schema.students.deletedAt} IS NULL AND ${schema.students.gender} = 'female'`)
      .get()?.count || 0;

    // 3. Meeting types distribution
    const meetings = this.meetingService.listMeetings();
    const meetingTypesCount: Record<string, number> = {};
    for (const m of meetings) {
      meetingTypesCount[m.meetingType] = (meetingTypesCount[m.meetingType] || 0) + 1;
    }

    // 4. Meeting tags distribution
    const tags = this.meetingService.getTags();
    const tagDistribution: Array<{ name: string; count: number }> = [];
    for (const t of tags) {
      const relCount = this.db.select({ count: sql<number>`count(*)` })
        .from(schema.meetingTagRelations)
        .where(sql`${schema.meetingTagRelations.tagId} = ${t.id}`)
        .get()?.count || 0;
      if (relCount > 0) {
        tagDistribution.push({ name: t.name, count: relCount });
      }
    }

    // 5. Exam participation summary
    const totalExams = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.exams)
      .where(isNull(schema.exams.deletedAt))
      .get()?.count || 0;

    // 6. Survey participation
    const totalAssignments = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.surveyAssignments)
      .get()?.count || 0;

    const completedSurveys = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.surveyAssignments)
      .where(sql`${schema.surveyAssignments.status} = 'completed'`)
      .get()?.count || 0;

    return {
      totalStudents,
      genderDistribution: { male: maleCount, female: femaleCount },
      totalMeetings: meetings.length,
      meetingTypesCount,
      tagDistribution,
      totalExams,
      surveyStats: {
        assigned: totalAssignments,
        completed: completedSurveys,
        completionRate: totalAssignments > 0 ? Math.round((completedSurveys / totalAssignments) * 100) : 0
      }
    };
  }

  public exportStudentsCsv(): { success: boolean; dataBase64: string; fileName: string } {
    try {
      const students = this.studentService.listStudents();
      const headers = ['Öğrenci No', 'Adı', 'Soyadı', 'Sınıf', 'Cinsiyet', 'Telefon', 'E-posta', 'Durum', 'Görüşme Sayısı'];
      const rows = students.map(s => [
        `"${s.studentNumber}"`,
        `"${s.firstName}"`,
        `"${s.lastName}"`,
        `"${s.className || ''}"`,
        `"${s.gender === 'male' ? 'Erkek' : 'Kız'}"`,
        `"${s.phone || ''}"`,
        `"${s.email || ''}"`,
        `"${s.status}"`,
        `"${s.meetingCount || 0}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
      const base64 = Buffer.from(csvContent, 'utf8').toString('base64');
      const fileName = `ogrenci_listesi_${new Date().toISOString().split('T')[0]}.csv`;

      return { success: true, dataBase64: base64, fileName };
    } catch (err: any) {
      logger.error('Export CSV error:', err);
      return { success: false, dataBase64: '', fileName: '' };
    }
  }

  public importStudentsCsv(dataBase64: string, schoolYearId: string): { success: boolean; importedCount: number; errors?: string[] } {
    try {
      const decoded = Buffer.from(dataBase64, 'base64').toString('utf8').replace(/^\uFEFF/, '');
      const lines = decoded.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        return { success: false, importedCount: 0, errors: ['CSV dosyası boş veya başlık dışında veri içermiyor'] };
      }

      let imported = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(';').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length < 3) continue;

        const [num, fName, lName, , genderStr, phone, email] = parts;
        if (!num || !fName || !lName) {
          errors.push(`Satır ${i + 1}: Numara, ad veya soyad eksik.`);
          continue;
        }

        const gender = (genderStr?.toLowerCase().startsWith('k') || genderStr?.toLowerCase().startsWith('f')) ? 'female' : 'male';

        try {
          this.studentService.createStudent({
            schoolYearId,
            studentNumber: num,
            firstName: fName,
            lastName: lName,
            gender: gender as any,
            phone: phone || undefined,
            email: email || undefined
          });
          imported++;
        } catch (err: any) {
          errors.push(`Satır ${i + 1} (${fName} ${lName}): ${err.message}`);
        }
      }

      logger.info(`Imported ${imported} students from CSV`);
      return { success: true, importedCount: imported, errors: errors.length > 0 ? errors : undefined };
    } catch (err: any) {
      logger.error('Import CSV error:', err);
      return { success: false, importedCount: 0, errors: [err.message] };
    }
  }
}
