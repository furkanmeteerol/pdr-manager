import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, desc, gte, lte } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { 
  ExamDto, 
  SubjectDto, 
  ExamResultDto, 
  StudentTargetDto, 
  StudyPlanDto, 
  QuestionTrackingDto 
} from '@shared/ipc-types';

export class AcademicEngine {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
    this.ensureDefaultSubjects();
  }

  public ensureDefaultSubjects(): void {
    const existing = this.db.select().from(schema.subjects).all();
    if (existing.length > 0) return;

    const defaultSubjects = [
      // TYT
      { id: 'tyt-turkce', name: 'TYT Türkçe', examType: 'TYT', category: 'Dil', questionCount: 40 },
      { id: 'tyt-matematik', name: 'TYT Temel Matematik', examType: 'TYT', category: 'Matematik', questionCount: 40 },
      { id: 'tyt-sosyal', name: 'TYT Sosyal Bilimler', examType: 'TYT', category: 'Sosyal', questionCount: 20 },
      { id: 'tyt-fen', name: 'TYT Fen Bilimleri', examType: 'TYT', category: 'Fen', questionCount: 20 },
      // AYT
      { id: 'ayt-matematik', name: 'AYT Matematik', examType: 'AYT', category: 'Matematik', questionCount: 40 },
      { id: 'ayt-fizik', name: 'AYT Fizik', examType: 'AYT', category: 'Fen', questionCount: 14 },
      { id: 'ayt-kimya', name: 'AYT Kimya', examType: 'AYT', category: 'Fen', questionCount: 13 },
      { id: 'ayt-biyoloji', name: 'AYT Biyoloji', examType: 'AYT', category: 'Fen', questionCount: 13 },
      { id: 'ayt-edebiyat', name: 'AYT Edebiyat', examType: 'AYT', category: 'Sosyal', questionCount: 24 },
      // LGS
      { id: 'lgs-turkce', name: 'LGS Türkçe', examType: 'LGS', category: 'Sözel', questionCount: 20 },
      { id: 'lgs-matematik', name: 'LGS Matematik', examType: 'LGS', category: 'Sayısal', questionCount: 20 },
      { id: 'lgs-fen', name: 'LGS Fen Bilimleri', examType: 'LGS', category: 'Sayısal', questionCount: 20 },
      { id: 'lgs-inkilap', name: 'LGS İnkılap Tarihi', examType: 'LGS', category: 'Sözel', questionCount: 10 },
      { id: 'lgs-din', name: 'LGS Din Kültürü', examType: 'LGS', category: 'Sözel', questionCount: 10 },
      { id: 'lgs-ingilizce', name: 'LGS Yabancı Dil', examType: 'LGS', category: 'Sözel', questionCount: 10 }
    ];

    for (const sub of defaultSubjects) {
      this.db.insert(schema.subjects)
        .values(sub)
        .onConflictDoNothing()
        .run();
    }
  }

  public getSubjects(examType?: string): SubjectDto[] {
    const rows = examType
      ? this.db.select().from(schema.subjects).where(eq(schema.subjects.examType, examType)).all()
      : this.db.select().from(schema.subjects).all();

    return rows.map(s => ({
      id: s.id,
      name: s.name,
      examType: s.examType as any,
      category: s.category,
      questionCount: s.questionCount
    }));
  }

  public listExams(): ExamDto[] {
    const rows = this.db.select()
      .from(schema.exams)
      .where(isNull(schema.exams.deletedAt))
      .orderBy(desc(schema.exams.date))
      .all();

    return rows.map(e => {
      const results = this.db.select().from(schema.examResults).where(eq(schema.examResults.examId, e.id)).all();
      const avgNet = results.length > 0
        ? results.reduce((acc, r) => acc + r.net, 0) / results.length
        : 0;

      return {
        id: e.id,
        schoolYearId: e.schoolYearId,
        name: e.name,
        examType: e.examType as any,
        date: e.date,
        description: e.description || undefined,
        netCalculationFormula: e.netCalculationFormula,
        participantCount: results.length,
        averageNet: Number(avgNet.toFixed(2)),
        createdAt: e.createdAt
      };
    });
  }

  public getExamById(id: string): ExamDto | null {
    const e = this.db.select().from(schema.exams).where(and(eq(schema.exams.id, id), isNull(schema.exams.deletedAt))).get();
    if (!e) return null;

    const results = this.db.select().from(schema.examResults).where(eq(schema.examResults.examId, id)).all();
    const avgNet = results.length > 0
      ? results.reduce((acc, r) => acc + r.net, 0) / results.length
      : 0;

    return {
      id: e.id,
      schoolYearId: e.schoolYearId,
      name: e.name,
      examType: e.examType as any,
      date: e.date,
      description: e.description || undefined,
      netCalculationFormula: e.netCalculationFormula,
      participantCount: results.length,
      averageNet: Number(avgNet.toFixed(2)),
      createdAt: e.createdAt
    };
  }

  public createExam(data: {
    schoolYearId: string;
    name: string;
    examType: 'TYT' | 'AYT' | 'LGS' | 'CUSTOM';
    date: string;
    description?: string;
    netCalculationFormula?: string;
  }): ExamDto {
    const now = Date.now();
    const id = crypto.randomUUID();
    const formula = data.netCalculationFormula || (data.examType === 'LGS' ? 'C - (W / 3)' : 'C - (W / 4)');

    const record = {
      id,
      schoolYearId: data.schoolYearId,
      name: data.name,
      examType: data.examType,
      date: data.date,
      description: data.description || null,
      netCalculationFormula: formula,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.exams).values(record).run();
      this.syncEngine.queueChange('exams', id, 'create', 0, 1, null, record, tx);
    });

    return this.getExamById(id)!;
  }

  public recordExamResult(data: {
    examId: string;
    studentId: string;
    items: Array<{ subjectId: string; correct: number; wrong: number; empty: number; score?: number }>;
  }): ExamResultDto {
    const exam = this.getExamById(data.examId);
    if (!exam) throw new Error('Sınav bulunamadı');

    const student = this.db.select().from(schema.students).where(eq(schema.students.id, data.studentId)).get();
    if (!student) throw new Error('Öğrenci bulunamadı');

    const now = Date.now();
    const divisor = exam.examType === 'LGS' ? 3 : 4;

    let totalC = 0;
    let totalW = 0;
    let totalE = 0;
    let totalNet = 0;
    let totalScore = 0;

    const savedItems: any[] = [];

    this.db.transaction((tx) => {
      for (const item of data.items) {
        const net = Math.max(0, item.correct - (item.wrong / divisor));
        const score = item.score || (net * 3.5);

        totalC += item.correct;
        totalW += item.wrong;
        totalE += item.empty;
        totalNet += net;
        totalScore += score;

        const resultId = crypto.randomUUID();
        const resultRecord = {
          id: resultId,
          examId: data.examId,
          studentId: data.studentId,
          subjectId: item.subjectId,
          correct: item.correct,
          wrong: item.wrong,
          empty: item.empty,
          net: Number(net.toFixed(2)),
          score: Number(score.toFixed(2)),
          rank: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
          lastModifiedDeviceId: this.deviceId
        };

        tx.insert(schema.examResults).values(resultRecord).run();
        this.syncEngine.queueChange('exam_results', resultId, 'create', 0, 1, null, resultRecord, tx);

        const sub = tx.select().from(schema.subjects).where(eq(schema.subjects.id, item.subjectId)).get();
        savedItems.push({
          subjectId: item.subjectId,
          subjectName: sub?.name || item.subjectId,
          correct: item.correct,
          wrong: item.wrong,
          empty: item.empty,
          net: Number(net.toFixed(2)),
          score: Number(score.toFixed(2))
        });
      }
    });

    return {
      id: crypto.randomUUID(),
      examId: data.examId,
      examName: exam.name,
      examType: exam.examType,
      examDate: exam.date,
      studentId: data.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      studentNumber: student.studentNumber,
      totalCorrect: totalC,
      totalWrong: totalW,
      totalEmpty: totalE,
      totalNet: Number(totalNet.toFixed(2)),
      totalScore: Number(totalScore.toFixed(2)),
      items: savedItems,
      createdAt: now
    };
  }

  public listExamResults(filter?: { examId?: string; studentId?: string }): ExamResultDto[] {
    let conditions = [isNull(schema.examResults.deletedAt)];
    if (filter?.examId) conditions.push(eq(schema.examResults.examId, filter.examId));
    if (filter?.studentId) conditions.push(eq(schema.examResults.studentId, filter.studentId));

    const rows = this.db.select({
      result: schema.examResults,
      exam: schema.exams,
      student: schema.students,
      subject: schema.subjects
    })
    .from(schema.examResults)
    .innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id))
    .innerJoin(schema.students, eq(schema.examResults.studentId, schema.students.id))
    .innerJoin(schema.subjects, eq(schema.examResults.subjectId, schema.subjects.id))
    .where(and(...conditions))
    .all();

    const groupMap = new Map<string, ExamResultDto>();

    for (const r of rows) {
      const key = `${r.exam.id}_${r.student.id}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: key,
          examId: r.exam.id,
          examName: r.exam.name,
          examType: r.exam.examType,
          examDate: r.exam.date,
          studentId: r.student.id,
          studentName: `${r.student.firstName} ${r.student.lastName}`,
          studentNumber: r.student.studentNumber,
          totalCorrect: 0,
          totalWrong: 0,
          totalEmpty: 0,
          totalNet: 0,
          totalScore: 0,
          items: [],
          createdAt: r.result.createdAt
        });
      }

      const grp = groupMap.get(key)!;
      grp.totalCorrect += r.result.correct;
      grp.totalWrong += r.result.wrong;
      grp.totalEmpty += r.result.empty;
      grp.totalNet = Number((grp.totalNet + r.result.net).toFixed(2));
      grp.totalScore = Number((grp.totalScore + r.result.score).toFixed(2));
      grp.items.push({
        subjectId: r.subject.id,
        subjectName: r.subject.name,
        correct: r.result.correct,
        wrong: r.result.wrong,
        empty: r.result.empty,
        net: r.result.net,
        score: r.result.score
      });
    }

    return Array.from(groupMap.values());
  }

  // --- Student Targets ---
  public listTargets(studentId?: string): StudentTargetDto[] {
    let conditions = [isNull(schema.studentTargets.deletedAt)];
    if (studentId) conditions.push(eq(schema.studentTargets.studentId, studentId));

    const rows = this.db.select({
      target: schema.studentTargets,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName
    })
    .from(schema.studentTargets)
    .innerJoin(schema.students, eq(schema.studentTargets.studentId, schema.students.id))
    .where(and(...conditions))
    .orderBy(desc(schema.studentTargets.createdAt))
    .all();

    return rows.map(r => ({
      id: r.target.id,
      studentId: r.target.studentId,
      studentName: `${r.studentFirstName} ${r.studentLastName}`,
      targetType: r.target.targetType as any,
      title: r.target.title,
      description: r.target.description || undefined,
      targetValue: r.target.targetValue,
      unit: r.target.unit || undefined,
      targetDate: r.target.targetDate || undefined,
      status: r.target.status as any,
      createdAt: r.target.createdAt
    }));
  }

  public createTarget(data: {
    studentId: string;
    targetType: 'net' | 'score' | 'rank' | 'school' | 'habit';
    title: string;
    description?: string;
    targetValue: string;
    unit?: string;
    targetDate?: string;
  }): StudentTargetDto {
    const now = Date.now();
    const id = crypto.randomUUID();

    const record = {
      id,
      studentId: data.studentId,
      targetType: data.targetType,
      title: data.title,
      description: data.description || null,
      targetValue: data.targetValue,
      unit: data.unit || null,
      targetDate: data.targetDate || null,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.studentTargets).values(record).run();
      this.syncEngine.queueChange('student_targets', id, 'create', 0, 1, null, record, tx);
    });

    return this.listTargets(data.studentId).find(t => t.id === id)!;
  }

  public updateTargetStatus(id: string, status: 'in_progress' | 'achieved' | 'missed'): StudentTargetDto {
    const now = Date.now();
    this.db.transaction((tx) => {
      tx.update(schema.studentTargets)
        .set({ status, updatedAt: now, lastModifiedDeviceId: this.deviceId })
        .where(eq(schema.studentTargets.id, id))
        .run();
    });

    return this.listTargets().find(t => t.id === id)!;
  }

  // --- Study Plans ---
  public listStudyPlans(studentId?: string): StudyPlanDto[] {
    let conditions = [isNull(schema.studyPlans.deletedAt)];
    if (studentId) conditions.push(eq(schema.studyPlans.studentId, studentId));

    const rows = this.db.select({
      plan: schema.studyPlans,
      studentFirstName: schema.students.firstName,
      studentLastName: schema.students.lastName
    })
    .from(schema.studyPlans)
    .innerJoin(schema.students, eq(schema.studyPlans.studentId, schema.students.id))
    .where(and(...conditions))
    .orderBy(desc(schema.studyPlans.startDate))
    .all();

    return rows.map(r => {
      const items = this.db.select()
        .from(schema.studyPlanItems)
        .where(and(eq(schema.studyPlanItems.studyPlanId, r.plan.id), isNull(schema.studyPlanItems.deletedAt)))
        .all();

      const totalItems = items.length;
      const completedItems = items.filter(i => i.status === 'completed').length;
      const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        id: r.plan.id,
        studentId: r.plan.studentId,
        studentName: `${r.studentFirstName} ${r.studentLastName}`,
        title: r.plan.title,
        startDate: r.plan.startDate,
        endDate: r.plan.endDate,
        notes: r.plan.notes || undefined,
        completionRate,
        items: items.map(i => ({
          id: i.id,
          studyPlanId: i.studyPlanId,
          date: i.date,
          startTime: i.startTime || undefined,
          endTime: i.endTime || undefined,
          subject: i.subject,
          topic: i.topic,
          plannedQuestions: i.plannedQuestions,
          completedQuestions: i.completedQuestions,
          status: i.status as any,
          notes: i.notes || undefined
        })),
        createdAt: r.plan.createdAt
      };
    });
  }

  public createStudyPlan(data: {
    studentId: string;
    title: string;
    startDate: string;
    endDate: string;
    notes?: string;
    items: Array<{ date: string; subject: string; topic: string; plannedQuestions: number; startTime?: string; endTime?: string }>;
  }): StudyPlanDto {
    const now = Date.now();
    const planId = crypto.randomUUID();

    const planRecord = {
      id: planId,
      studentId: data.studentId,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.studyPlans).values(planRecord).run();

      for (const item of data.items) {
        const itemId = crypto.randomUUID();
        tx.insert(schema.studyPlanItems).values({
          id: itemId,
          studyPlanId: planId,
          date: item.date,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          subject: item.subject,
          topic: item.topic,
          plannedQuestions: item.plannedQuestions || 0,
          completedQuestions: 0,
          status: 'pending',
          notes: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          version: 1,
          lastModifiedDeviceId: this.deviceId
        }).run();
      }

      this.syncEngine.queueChange('study_plans', planId, 'create', 0, 1, null, planRecord, tx);
    });

    return this.listStudyPlans(data.studentId).find(p => p.id === planId)!;
  }

  public updateStudyPlanItemStatus(itemId: string, status: 'pending' | 'completed' | 'missed', completedQuestions?: number): boolean {
    const now = Date.now();
    const updateObj: any = { status, updatedAt: now };
    if (completedQuestions !== undefined) updateObj.completedQuestions = completedQuestions;

    this.db.update(schema.studyPlanItems)
      .set(updateObj)
      .where(eq(schema.studyPlanItems.id, itemId))
      .run();

    return true;
  }

  // --- Question Tracking ---
  public listQuestionTracking(filter?: { studentId?: string; dateFrom?: string; dateTo?: string }): QuestionTrackingDto[] {
    let conditions = [isNull(schema.questionTracking.deletedAt)];
    if (filter?.studentId) conditions.push(eq(schema.questionTracking.studentId, filter.studentId));
    if (filter?.dateFrom) conditions.push(gte(schema.questionTracking.date, filter.dateFrom));
    if (filter?.dateTo) conditions.push(lte(schema.questionTracking.date, filter.dateTo));

    const rows = this.db.select({
      qt: schema.questionTracking,
      subject: schema.subjects,
      student: schema.students
    })
    .from(schema.questionTracking)
    .innerJoin(schema.subjects, eq(schema.questionTracking.subjectId, schema.subjects.id))
    .innerJoin(schema.students, eq(schema.questionTracking.studentId, schema.students.id))
    .where(and(...conditions))
    .orderBy(desc(schema.questionTracking.date))
    .all();

    return rows.map(r => {
      const net = Math.max(0, r.qt.correctCount - (r.qt.wrongCount / 4));
      return {
        id: r.qt.id,
        studentId: r.qt.studentId,
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        date: r.qt.date,
        subjectId: r.qt.subjectId,
        subjectName: r.subject.name,
        questionCount: r.qt.questionCount,
        correctCount: r.qt.correctCount,
        wrongCount: r.qt.wrongCount,
        emptyCount: r.qt.emptyCount,
        net: Number(net.toFixed(2)),
        notes: r.qt.notes || undefined,
        createdAt: r.qt.createdAt
      };
    });
  }

  public logQuestions(data: {
    studentId: string;
    date: string;
    subjectId: string;
    questionCount: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
    notes?: string;
  }): QuestionTrackingDto {
    const now = Date.now();
    const id = crypto.randomUUID();

    const record = {
      id,
      studentId: data.studentId,
      date: data.date,
      subjectId: data.subjectId,
      questionCount: data.questionCount,
      correctCount: data.correctCount,
      wrongCount: data.wrongCount,
      emptyCount: data.emptyCount,
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    };

    this.db.transaction((tx) => {
      tx.insert(schema.questionTracking).values(record).run();
      this.syncEngine.queueChange('question_tracking', id, 'create', 0, 1, null, record, tx);
    });

    return this.listQuestionTracking({ studentId: data.studentId }).find(q => q.id === id)!;
  }
}
