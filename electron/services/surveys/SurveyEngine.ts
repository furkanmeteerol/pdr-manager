import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, desc, sql } from 'drizzle-orm';
import crypto from 'node:crypto';
import * as schema from '@database/schema';
import { SyncEngine } from '../sync/SyncEngine';
import { 
  SurveyDto, 
  SurveyAssignmentDto, 
  SurveyResponseDto, 
  SurveySubmitPayload, 
  StudentModeState,
  StudentDto,
  SurveyAnalyticsDto,
  SurveyQuestionStatDto,
  SurveyApplicationDto,
  SurveySubmitApplicationPayload
} from '@shared/ipc-types';
import { logger } from '../logger/Logger';
import { ScoringEngine } from '../survey/ScoringEngine';
import { DEVAMSIZLIK_NEDENLERI_ANKETI, RealSurveyDefinition } from './definitions/devamsizlikNedenleriAnketi';

/**
 * Normalizes Turkish characters, whitespace, and case for reliable student matching
 */
export function normalizeTurkishText(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[\s\t\n]+/g, ' ')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * Validates if the name input matches the student's registered first and last name
 */
export function matchStudentName(inputName: string, studentFirstName: string, studentLastName: string): boolean {
  if (!inputName || !studentFirstName || !studentLastName) return false;

  const normInput = normalizeTurkishText(inputName);
  const normFirstLast = normalizeTurkishText(`${studentFirstName} ${studentLastName}`);
  const normLastFirst = normalizeTurkishText(`${studentLastName} ${studentFirstName}`);

  if (normInput === normFirstLast || normInput === normLastFirst) {
    return true;
  }

  // Token-based matching (handles middle names and token order)
  const inputTokens = normInput.split(' ').filter(Boolean).sort();
  const actualTokens = normFirstLast.split(' ').filter(Boolean).sort();

  if (inputTokens.length === actualTokens.length && inputTokens.every((t, i) => t === actualTokens[i])) {
    return true;
  }

  return false;
}

export class SurveyEngine {
  private db: BetterSQLite3Database<typeof schema>;
  private deviceId: string;
  private syncEngine: SyncEngine;
  private studentModeState: StudentModeState = { active: false };

  constructor(db: BetterSQLite3Database<typeof schema>, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
    void this.syncEngine;

    // Register verified real MEB survey
    try {
      this.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
    } catch (err) {
      logger.error('Failed to register Devamsızlık Nedenleri Anketi:', err);
    }
  }

  public getStudentModeState(): StudentModeState {
    return { ...this.studentModeState };
  }

  public setStudentModeState(state: StudentModeState): void {
    this.studentModeState = state;
  }

  public matchStudentResponse(identifier: {
    assignmentRef?: string;
    schoolNumber?: string;
    email?: string;
    name?: string;
  }): {
    matched: boolean;
    status: 'matched' | 'mismatch_rejected' | 'unmatched_pending' | 'anonymous';
    student?: StudentDto;
    reason?: string;
  } {
    if (identifier.assignmentRef) {
      const assignment = this.getAssignmentByRef(identifier.assignmentRef);
      if (assignment) {
        return {
          matched: true,
          status: 'matched',
          student: assignment.student
        };
      }
    }

    if (identifier.schoolNumber !== undefined) {
      if (!identifier.schoolNumber.trim()) {
        return {
          matched: false,
          status: 'unmatched_pending',
          reason: 'Okul numarası boş bırakılmış.'
        };
      }
      const normNum = identifier.schoolNumber.trim();
      const student = this.db.select()
        .from(schema.students)
        .where(and(
          sql`LOWER(TRIM(${schema.students.studentNumber})) = LOWER(${normNum})`,
          isNull(schema.students.deletedAt)
        ))
        .get();

      if (!student) {
        return {
          matched: false,
          status: 'unmatched_pending',
          reason: `Girilen okul numarası (${identifier.schoolNumber}) sistemde kayıtlı değil.`
        };
      }

      if (identifier.name && !matchStudentName(identifier.name, student.firstName, student.lastName)) {
        return {
          matched: false,
          status: 'mismatch_rejected',
          reason: `Öğrenci numarası (${identifier.schoolNumber}) ${student.firstName} ${student.lastName} ile eşleşiyor ancak girilen isim (${identifier.name}) uyuşmuyor.`
        };
      }

      return {
        matched: true,
        status: 'matched',
        student: {
          id: student.id,
          schoolYearId: student.schoolYearId,
          classId: student.classId || '',
          studentNumber: student.studentNumber || '',
          firstName: student.firstName,
          lastName: student.lastName,
          gender: student.gender as any,
          status: student.status as any,
          version: student.version,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt
        }
      };
    }

    if (identifier.name && identifier.name.trim()) {
      const allStudents = this.db.select()
        .from(schema.students)
        .where(isNull(schema.students.deletedAt))
        .all();

      const matches = allStudents.filter(s => matchStudentName(identifier.name!, s.firstName, s.lastName));
      if (matches.length === 1) {
        const student = matches[0];
        return {
          matched: true,
          status: 'matched',
          student: {
            id: student.id,
            schoolYearId: student.schoolYearId,
            classId: student.classId || '',
            studentNumber: student.studentNumber || '',
            firstName: student.firstName,
            lastName: student.lastName,
            gender: student.gender as any,
            status: student.status as any,
            version: student.version,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt
          }
        };
      }
    }

    return {
      matched: false,
      status: 'unmatched_pending',
      reason: 'Öğrenci kaydı tespit edilemedi.'
    };
  }

  public getOrCreateAssignmentForStudent(surveyId: string, studentId: string): SurveyAssignmentDto {
    const existing = this.db.select()
      .from(schema.surveyAssignments)
      .where(and(
        eq(schema.surveyAssignments.surveyId, surveyId),
        eq(schema.surveyAssignments.studentId, studentId)
      ))
      .get();

    if (existing) {
      const student = this.db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
      const survey = this.db.select().from(schema.surveys).where(eq(schema.surveys.id, surveyId)).get();

      return {
        id: existing.id,
        surveyId,
        surveyTitle: survey?.title || '',
        studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        studentNumber: student?.studentNumber || '',
        assignmentRef: existing.assignmentRef,
        assignedAt: existing.assignedAt,
        dueDate: existing.dueDate || undefined,
        status: existing.status as any,
        startedAt: existing.startedAt || undefined,
        completedAt: existing.completedAt || undefined
      };
    }

    const assigned = this.assignSurvey({ surveyId, studentIds: [studentId] });
    return assigned[0];
  }

  /**
   * Registers or updates a verified real survey definition in Local SQLite.
   */
  public registerRealSurvey(surveyDef: RealSurveyDefinition): { success: boolean; surveyId: string; versionId: string } {
    const now = Date.now();
    const surveyId = surveyDef.id || `srv-${surveyDef.slug}`;
    const versionId = `ver-${surveyDef.slug}-v1`;

    const existing = this.db.select().from(schema.surveys).where(eq(schema.surveys.slug, surveyDef.slug)).get();
    if (!existing) {
      this.db.insert(schema.surveys).values({
        id: surveyId,
        slug: surveyDef.slug,
        title: surveyDef.title,
        description: surveyDef.description || null,
        type: surveyDef.type,
        repeatPolicy: surveyDef.repeatPolicy,
        isActive: 1,
        currentVersionNumber: 1,
        targetMode: 'student_linked',
        surveyVersion: 1,
        status: 'active',
        estimatedMinutes: surveyDef.estimatedMinutes ?? 15,
        scoringMethod: surveyDef.scoringType.toLowerCase(),
        createdAt: now,
        updatedAt: now,
        version: 1,
        lastModifiedDeviceId: this.deviceId
      }).run();
    } else {
      this.db.update(schema.surveys).set({
        title: surveyDef.title,
        description: surveyDef.description || null,
        type: surveyDef.type,
        repeatPolicy: surveyDef.repeatPolicy,
        scoringMethod: surveyDef.scoringType.toLowerCase(),
        updatedAt: now
      }).where(eq(schema.surveys.id, existing.id)).run();
    }

    const existingVer = this.db.select().from(schema.surveyVersions).where(eq(schema.surveyVersions.id, versionId)).get();
    if (!existingVer) {
      this.db.insert(schema.surveyVersions).values({
        id: versionId,
        surveyId,
        versionNumber: 1,
        titleSnapshot: surveyDef.title,
        descriptionSnapshot: surveyDef.description || null,
        scoringType: surveyDef.scoringType,
        isPublished: 1,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        version: 1,
        lastModifiedDeviceId: this.deviceId
      }).run();
    }

    // Clean child records first to satisfy foreign key constraints
    const oldQuestions = this.db.select().from(schema.surveyQuestions).where(eq(schema.surveyQuestions.surveyVersionId, versionId)).all();
    for (const oq of oldQuestions) {
      this.db.delete(schema.surveyOptions).where(eq(schema.surveyOptions.questionId, oq.id)).run();
    }
    this.db.delete(schema.surveyQuestions).where(eq(schema.surveyQuestions.surveyVersionId, versionId)).run();
    this.db.delete(schema.surveyInterpretations).where(eq(schema.surveyInterpretations.surveyVersionId, versionId)).run();
    this.db.delete(schema.surveySubscales).where(eq(schema.surveySubscales.surveyVersionId, versionId)).run();

    // 1. Insert Subscales
    const subscaleIdMap = new Map<string, string>();
    for (let i = 0; i < surveyDef.subscales.length; i++) {
      const sub = surveyDef.subscales[i];
      const subId = `sub-${surveyDef.slug}-${sub.code.toLowerCase()}`;
      subscaleIdMap.set(sub.code, subId);

      this.db.insert(schema.surveySubscales).values({
        id: subId,
        surveyVersionId: versionId,
        code: sub.code,
        title: sub.title,
        description: sub.description || null,
        calculationMethod: sub.calculationMethod,
        orderIndex: sub.orderIndex || (i + 1),
        createdAt: now,
        updatedAt: now
      }).run();
    }

    // 2. Insert Interpretations
    for (let i = 0; i < surveyDef.interpretations.length; i++) {
      const interp = surveyDef.interpretations[i];
      const interpId = `int-${surveyDef.slug}-${i + 1}`;
      const targetSubscaleId = interp.subscaleCode ? subscaleIdMap.get(interp.subscaleCode) || null : null;

      this.db.insert(schema.surveyInterpretations).values({
        id: interpId,
        surveyVersionId: versionId,
        subscaleId: targetSubscaleId,
        minScore: interp.minScore,
        maxScore: interp.maxScore,
        label: interp.label,
        description: interp.description || null,
        colorCode: interp.colorCode || 'blue',
        createdAt: now,
        updatedAt: now
      }).run();
    }

    for (let qIdx = 0; qIdx < surveyDef.questions.length; qIdx++) {
      const q = surveyDef.questions[qIdx];
      const qId = `q-${surveyDef.slug}-${q.orderIndex || qIdx + 1}`;
      const assignedSubscaleId = q.subscaleCode ? subscaleIdMap.get(q.subscaleCode) || null : null;

      this.db.insert(schema.surveyQuestions).values({
        id: qId,
        surveyId,
        surveyVersionId: versionId,
        questionOrder: q.orderIndex || (qIdx + 1),
        questionText: q.text,
        questionType: q.type,
        subscaleId: assignedSubscaleId,
        isReverseScored: q.isReverseScored ? 1 : 0,
        required: q.required !== false ? 1 : 0,
        createdAt: now,
        updatedAt: now
      }).run();

      if (q.options && q.options.length > 0) {
        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const opt = q.options[oIdx];
          const optId = `opt-${surveyDef.slug}-${q.orderIndex || qIdx + 1}-${oIdx + 1}`;

          this.db.insert(schema.surveyOptions).values({
            id: optId,
            questionId: qId,
            optionOrder: oIdx + 1,
            optionText: opt.label,
            optionLabel: opt.label,
            optionValue: opt.value || opt.label.toLowerCase(),
            score: opt.score,
            scoreValue: opt.score,
            reverseScoreValue: opt.reverseScore ?? (6 - opt.score)
          }).run();
        }
      }
    }

    logger.info(`Successfully registered real survey: ${surveyDef.title} (${surveyDef.slug}) with ${surveyDef.questions.length} questions.`);
    return { success: true, surveyId, versionId };
  }

  /**
   * Lists all surveys with application counts and public link metadata.
   */
  public listSurveys(): SurveyDto[] {
    const rows = this.db.select()
      .from(schema.surveys)
      .where(isNull(schema.surveys.deletedAt))
      .orderBy(desc(schema.surveys.createdAt))
      .all();

    return rows.map(s => {
      const appCount = this.db.select({ count: sql<number>`count(*)` })
        .from(schema.surveyApplications)
        .where(and(eq(schema.surveyApplications.surveyId, s.id), isNull(schema.surveyApplications.deletedAt)))
        .get()?.count || 0;

      const slug = s.slug || s.id;

      return {
        id: s.id,
        slug,
        title: s.title,
        description: s.description || undefined,
        type: (s.type as any) || 'SURVEY',
        repeatPolicy: (s.repeatPolicy as any) || 'UNLIMITED',
        isActive: s.isActive === 1,
        currentVersionNumber: s.currentVersionNumber || 1,
        targetMode: (s.targetMode as any) || 'student_linked',
        surveyVersion: s.surveyVersion,
        status: (s.isActive === 1 ? 'active' : 'archived') as any,
        estimatedMinutes: s.estimatedMinutes,
        scoringMethod: s.scoringMethod as any,
        applicationCount: appCount,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      };
    });
  }

  /**
   * Toggles survey active status
   */
  public toggleSurveyActive(surveyId: string, isActive: boolean): boolean {
    this.db.update(schema.surveys)
      .set({ 
        isActive: isActive ? 1 : 0, 
        updatedAt: Date.now(),
        version: sql`${schema.surveys.version} + 1`,
        lastModifiedDeviceId: this.deviceId
      })
      .where(eq(schema.surveys.id, surveyId))
      .run();
    return true;
  }

  /**
   * Fetches full active survey blueprint by its public slug or ID.
   */
  public getSurveyBySlug(slug: string): SurveyDto | null {
    const s = this.db.select()
      .from(schema.surveys)
      .where(and(
        sql`(${schema.surveys.slug} = ${slug} OR ${schema.surveys.id} = ${slug})`,
        isNull(schema.surveys.deletedAt)
      ))
      .get();

    if (!s) return null;

    // Get current version
    const version = this.db.select()
      .from(schema.surveyVersions)
      .where(and(
        eq(schema.surveyVersions.surveyId, s.id),
        eq(schema.surveyVersions.versionNumber, s.currentVersionNumber || 1),
        isNull(schema.surveyVersions.deletedAt)
      ))
      .get();

    const versionId = version?.id || `ver-${s.slug || s.id}-v1`;

    // Fetch Subscales
    const subscales = this.db.select()
      .from(schema.surveySubscales)
      .where(eq(schema.surveySubscales.surveyVersionId, versionId))
      .orderBy(schema.surveySubscales.orderIndex)
      .all()
      .map(sub => ({
        id: sub.id,
        surveyVersionId: sub.surveyVersionId,
        code: sub.code,
        title: sub.title,
        description: sub.description || undefined,
        calculationMethod: (sub.calculationMethod as any) || 'SUM',
        orderIndex: sub.orderIndex
      }));

    // Fetch Interpretations
    const interpretations = this.db.select()
      .from(schema.surveyInterpretations)
      .where(eq(schema.surveyInterpretations.surveyVersionId, versionId))
      .all()
      .map(i => ({
        id: i.id,
        surveyVersionId: i.surveyVersionId,
        subscaleId: i.subscaleId || null,
        minScore: i.minScore,
        maxScore: i.maxScore,
        label: i.label,
        description: i.description || undefined,
        colorCode: i.colorCode || undefined
      }));

    // Fetch Questions
    const questions = this.db.select()
      .from(schema.surveyQuestions)
      .where(sql`(${schema.surveyQuestions.surveyVersionId} = ${versionId} OR ${schema.surveyQuestions.surveyId} = ${s.id})`)
      .orderBy(schema.surveyQuestions.questionOrder)
      .all();

    const questionsWithOpts = questions.map(q => {
      const options = this.db.select()
        .from(schema.surveyOptions)
        .where(eq(schema.surveyOptions.questionId, q.id))
        .orderBy(schema.surveyOptions.optionOrder)
        .all();

      return {
        id: q.id,
        surveyId: s.id,
        surveyVersionId: versionId,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        questionType: q.questionType as any,
        category: q.category || undefined,
        subscaleId: q.subscaleId || undefined,
        isReverseScored: q.isReverseScored === 1,
        required: q.required === 1,
        helpText: q.helpText || undefined,
        options: options.map(o => ({
          id: o.id,
          questionId: o.questionId,
          optionOrder: o.optionOrder,
          optionText: o.optionText,
          optionLabel: o.optionLabel || o.optionText,
          optionValue: o.optionValue || o.id,
          score: o.scoreValue ?? o.score ?? 0,
          scoreValue: o.scoreValue ?? o.score ?? 0,
          reverseScoreValue: o.reverseScoreValue
        }))
      };
    });

    const appCount = this.db.select({ count: sql<number>`count(*)` })
      .from(schema.surveyApplications)
      .where(and(eq(schema.surveyApplications.surveyId, s.id), isNull(schema.surveyApplications.deletedAt)))
      .get()?.count || 0;

    return {
      id: s.id,
      slug: s.slug || s.id,
      title: s.title,
      description: s.description || undefined,
      type: (s.type as any) || 'SURVEY',
      repeatPolicy: (s.repeatPolicy as any) || 'UNLIMITED',
      isActive: s.isActive === 1,
      currentVersionNumber: s.currentVersionNumber || 1,
      targetMode: (s.targetMode as any) || 'student_linked',
      surveyVersion: s.surveyVersion,
      status: (s.isActive === 1 ? 'active' : 'archived') as any,
      estimatedMinutes: s.estimatedMinutes,
      scoringMethod: s.scoringMethod as any,
      questions: questionsWithOpts,
      currentVersion: {
        id: versionId,
        surveyId: s.id,
        versionNumber: version?.versionNumber || 1,
        titleSnapshot: version?.titleSnapshot || s.title,
        descriptionSnapshot: version?.descriptionSnapshot || s.description || undefined,
        scoringType: (version?.scoringType as any) || 'SUM',
        isPublished: true,
        publishedAt: version?.publishedAt || s.createdAt,
        createdAt: version?.createdAt || s.createdAt,
        questions: questionsWithOpts,
        subscales,
        interpretations,
        resultPresentation: s.slug === 'devamsizlik-nedenleri-anketi' ? DEVAMSIZLIK_NEDENLERI_ANKETI.resultPresentation : undefined
      },
      resultPresentation: s.slug === 'devamsizlik-nedenleri-anketi' ? DEVAMSIZLIK_NEDENLERI_ANKETI.resultPresentation : undefined,
      applicationCount: appCount,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    };
  }

  public getSurveyById(id: string): SurveyDto | null {
    return this.getSurveyBySlug(id);
  }

  /**
   * Securely validates student number and checks survey repeat policy.
   */
  public validateStudentForSurvey(
    surveySlug: string, 
    studentNumber: string
  ): { 
    valid: boolean; 
    studentName?: string; 
    studentId?: string; 
    error?: string; 
    canAttempt?: boolean; 
    currentAttemptCount?: number 
  } {
    if (!studentNumber || !studentNumber.trim()) {
      return { valid: false, error: 'Öğrenci numarası girilmelidir.' };
    }

    const normNum = studentNumber.trim();
    const student = this.db.select()
      .from(schema.students)
      .where(and(
        sql`LOWER(TRIM(${schema.students.studentNumber})) = LOWER(${normNum})`,
        isNull(schema.students.deletedAt)
      ))
      .get();

    if (!student) {
      return { valid: false, error: 'Girilen okul numarasına ait kayıtlı öğrenci bulunamadı.' };
    }

    const survey = this.getSurveyBySlug(surveySlug);
    if (!survey) {
      return { valid: false, error: 'Anket / envanter bulunamadı.' };
    }

    if (!survey.isActive) {
      return { valid: false, error: 'Bu anket / ölçek şu anda yanıtlara kapalıdır.' };
    }

    // Check existing attempts for this student
    const existingAttempts = this.db.select()
      .from(schema.surveyApplications)
      .where(and(
        eq(schema.surveyApplications.surveyId, survey.id),
        eq(schema.surveyApplications.studentId, student.id),
        isNull(schema.surveyApplications.deletedAt)
      ))
      .all();

    const attemptCount = existingAttempts.length;

    // Check repeat policy
    if (survey.repeatPolicy === 'ONCE' && attemptCount >= 1) {
      return {
        valid: true,
        canAttempt: false,
        studentName: `${student.firstName} ${student.lastName}`,
        studentId: student.id,
        currentAttemptCount: attemptCount,
        error: 'Bu ölçek tek seferliktir ve daha önce tamamlanmıştır.'
      };
    }

    if (survey.repeatPolicy === 'YEARLY' && attemptCount >= 1) {
      const activeYear = this.db.select().from(schema.schoolYears).where(eq(schema.schoolYears.isActive, 1)).get();
      if (activeYear) {
        const thisYearAttempt = existingAttempts.find(a => a.schoolYearId === activeYear.id);
        if (thisYearAttempt) {
          return {
            valid: true,
            canAttempt: false,
            studentName: `${student.firstName} ${student.lastName}`,
            studentId: student.id,
            currentAttemptCount: attemptCount,
            error: 'Bu ölçek bu eğitim-öğretim yılı içerisinde zaten doldurulmuştur.'
          };
        }
      }
    }

    return {
      valid: true,
      canAttempt: true,
      studentName: `${student.firstName} ${student.lastName}`,
      studentId: student.id,
      currentAttemptCount: attemptCount
    };
  }

  /**
   * Submits a student's survey application attempt, runs Scoring Engine, and saves frozen snapshot.
   */
  public submitApplication(
    payload: SurveySubmitApplicationPayload
  ): { success: boolean; application?: SurveyApplicationDto; error?: string } {
    const survey = this.getSurveyBySlug(payload.surveySlug);
    if (!survey) {
      return { success: false, error: 'Anket bulunamadı.' };
    }

    const validation = this.validateStudentForSurvey(payload.surveySlug, payload.studentNumber);
    if (!validation.valid || !validation.studentId) {
      return { success: false, error: validation.error || 'Öğrenci doğrulanamadı.' };
    }

    if (!validation.canAttempt) {
      return { success: false, error: validation.error || 'Bu anketi tekrar doldurma yetkiniz bulunmamaktadır.' };
    }

    const student = this.db.select().from(schema.students).where(eq(schema.students.id, validation.studentId)).get();
    if (!student) {
      return { success: false, error: 'Öğrenci kaydı bulunamadı.' };
    }

    const activeYear = this.db.select().from(schema.schoolYears).where(eq(schema.schoolYears.isActive, 1)).get();

    const version = survey.currentVersion;
    if (!version || !version.questions) {
      return { success: false, error: 'Anket versiyon soruları yüklenemedi.' };
    }

    const now = Date.now();
    const nextAttemptNumber = (validation.currentAttemptCount || 0) + 1;
    const applicationId = `app-${crypto.randomUUID()}`;

    // Run Scoring Engine
    const calculated = ScoringEngine.calculate(
      version.questions,
      version.subscales || [],
      version.interpretations || [],
      payload.answers,
      version.versionNumber
    );

    const resultSnapshotJson = JSON.stringify(calculated.resultSnapshot);

    // 1. Insert Application Attempt
    this.db.insert(schema.surveyApplications).values({
      id: applicationId,
      surveyId: survey.id,
      surveyVersionId: version.id,
      studentId: student.id,
      studentNumberSnapshot: student.studentNumber || payload.studentNumber,
      schoolYearId: activeYear?.id || student.schoolYearId,
      attemptNumber: nextAttemptNumber,
      status: 'COMPLETED',
      source: payload.source || 'web',
      startedAt: now - (survey.estimatedMinutes ? survey.estimatedMinutes * 60000 : 300000),
      completedAt: now,
      resultSnapshot: resultSnapshotJson,
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    }).run();

    // 2. Insert Answers
    for (const ans of calculated.answers) {
      const answerId = `ans-${crypto.randomUUID()}`;
      this.db.insert(schema.surveyAnswers).values({
        id: answerId,
        applicationId,
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId,
        answerValue: ans.answerValue,
        answerScore: ans.answerScore
      }).run();
    }

    // 3. Insert Result Snapshot
    const snapshotId = `snp-${crypto.randomUUID()}`;
    this.db.insert(schema.surveyResultSnapshots).values({
      id: snapshotId,
      applicationId,
      totalScore: calculated.totalScore,
      subscaleScoresJson: JSON.stringify(calculated.resultSnapshot.subscales || []),
      interpretationLabel: calculated.resultSnapshot.interpretation?.label,
      interpretationDescription: calculated.resultSnapshot.interpretation?.description,
      rawMetricsJson: JSON.stringify(calculated.resultSnapshot.rawMetrics || {}),
      calculatedAt: now
    }).run();

    // Fetch class name if present
    let className: string | undefined = undefined;
    if (student.classId) {
      const cls = this.db.select().from(schema.classes).where(eq(schema.classes.id, student.classId)).get();
      className = cls?.name;
    }

    const applicationDto: SurveyApplicationDto = {
      id: applicationId,
      surveyId: survey.id,
      surveySlug: survey.slug,
      surveyTitle: survey.title,
      surveyType: survey.type,
      surveyVersionId: version.id,
      surveyVersionNumber: version.versionNumber,
      studentId: student.id,
      studentNumber: student.studentNumber || payload.studentNumber,
      studentName: `${student.firstName} ${student.lastName}`,
      className,
      schoolYearId: activeYear?.id || student.schoolYearId,
      attemptNumber: nextAttemptNumber,
      status: 'COMPLETED',
      source: payload.source || 'web',
      completedAt: now,
      totalScore: calculated.totalScore,
      resultSnapshot: calculated.resultSnapshot,
      answers: calculated.answers,
      createdAt: now
    };

    logger.info(`Recorded survey application ${applicationId} (Attempt #${nextAttemptNumber}) for student ${student.id}`);

    return {
      success: true,
      application: applicationDto
    };
  }

  /**
   * Lists all survey application attempts with filtering.
   */
  public listApplications(filter?: { surveyId?: string; studentId?: string }): SurveyApplicationDto[] {
    const rows = this.db.select({
      app: schema.surveyApplications,
      st: schema.students,
      srv: schema.surveys,
      cls: schema.classes
    })
    .from(schema.surveyApplications)
    .innerJoin(schema.students, eq(schema.surveyApplications.studentId, schema.students.id))
    .innerJoin(schema.surveys, eq(schema.surveyApplications.surveyId, schema.surveys.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(isNull(schema.surveyApplications.deletedAt))
    .orderBy(desc(schema.surveyApplications.completedAt))
    .all();

    let filtered = rows;
    if (filter?.surveyId) {
      filtered = filtered.filter(r => r.app.surveyId === filter.surveyId || r.srv.slug === filter.surveyId);
    }
    if (filter?.studentId) {
      filtered = filtered.filter(r => r.app.studentId === filter.studentId);
    }

    return filtered.map(r => {
      let resultSnapshot: any = null;
      if (r.app.resultSnapshot) {
        try {
          resultSnapshot = JSON.parse(r.app.resultSnapshot);
        } catch {}
      }

      return {
        id: r.app.id,
        surveyId: r.srv.id,
        surveySlug: r.srv.slug || r.srv.id,
        surveyTitle: r.srv.title,
        surveyType: (r.srv.type as any) || 'SURVEY',
        surveyVersionId: r.app.surveyVersionId,
        surveyVersionNumber: 1,
        studentId: r.st.id,
        studentNumber: r.st.studentNumber || r.app.studentNumberSnapshot,
        studentName: `${r.st.firstName} ${r.st.lastName}`,
        className: r.cls?.name,
        schoolYearId: r.app.schoolYearId || undefined,
        attemptNumber: r.app.attemptNumber,
        status: (r.app.status as any) || 'COMPLETED',
        source: r.app.source,
        startedAt: r.app.startedAt || undefined,
        completedAt: r.app.completedAt,
        totalScore: resultSnapshot?.totalScore,
        resultSnapshot,
        createdAt: r.app.createdAt
      };
    });
  }

  /**
   * Gets single application attempt detail including question-by-question breakdown.
   */
  public getApplicationDetail(id: string): SurveyApplicationDto | null {
    const row = this.db.select({
      app: schema.surveyApplications,
      st: schema.students,
      srv: schema.surveys,
      cls: schema.classes
    })
    .from(schema.surveyApplications)
    .innerJoin(schema.students, eq(schema.surveyApplications.studentId, schema.students.id))
    .innerJoin(schema.surveys, eq(schema.surveyApplications.surveyId, schema.surveys.id))
    .leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id))
    .where(and(eq(schema.surveyApplications.id, id), isNull(schema.surveyApplications.deletedAt)))
    .get();

    if (!row) return null;

    let resultSnapshot: any = null;
    if (row.app.resultSnapshot) {
      try {
        resultSnapshot = JSON.parse(row.app.resultSnapshot);
      } catch {}
    }

    // Fetch answers with subscale metadata
    const rawAnswers = this.db.select({
      ans: schema.surveyAnswers,
      q: schema.surveyQuestions,
      opt: schema.surveyOptions,
      sub: schema.surveySubscales
    })
    .from(schema.surveyAnswers)
    .innerJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
    .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
    .leftJoin(schema.surveySubscales, eq(schema.surveyQuestions.subscaleId, schema.surveySubscales.id))
    .where(eq(schema.surveyAnswers.applicationId, id))
    .orderBy(schema.surveyQuestions.questionOrder)
    .all();

    const answers = rawAnswers.map(a => ({
      id: a.ans.id,
      questionId: a.q.id,
      questionOrder: a.q.questionOrder,
      questionText: a.q.questionText,
      selectedOptionId: a.ans.selectedOptionId || undefined,
      selectedOptionLabel: a.opt?.optionLabel || a.opt?.optionText || undefined,
      answerValue: a.ans.answerValue || undefined,
      answerScore: a.ans.answerScore ?? undefined,
      isReverseScored: a.q.isReverseScored === 1,
      subscaleCode: a.sub?.code || undefined
    }));

    return {
      id: row.app.id,
      surveyId: row.srv.id,
      surveySlug: row.srv.slug || row.srv.id,
      surveyTitle: row.srv.title,
      surveyType: (row.srv.type as any) || 'SURVEY',
      surveyVersionId: row.app.surveyVersionId,
      surveyVersionNumber: 1,
      studentId: row.st.id,
      studentNumber: row.st.studentNumber || row.app.studentNumberSnapshot,
      studentName: `${row.st.firstName} ${row.st.lastName}`,
      className: row.cls?.name,
      schoolYearId: row.app.schoolYearId || undefined,
      attemptNumber: row.app.attemptNumber,
      status: (row.app.status as any) || 'COMPLETED',
      source: row.app.source,
      startedAt: row.app.startedAt || undefined,
      completedAt: row.app.completedAt,
      totalScore: resultSnapshot?.totalScore,
      resultSnapshot,
      answers,
      createdAt: row.app.createdAt
    };
  }

  // --- Legacy Survey & Assignment Methods (Preserved for compatibility) ---

  public createSurvey(data: any): SurveyDto {
    const surveyId = `srv-${Date.now()}`;
    const now = Date.now();

    this.db.insert(schema.surveys).values({
      id: surveyId,
      slug: data.slug || `survey-${Date.now()}`,
      title: data.title,
      description: data.description,
      targetMode: data.targetMode || 'student_linked',
      surveyVersion: 1,
      status: 'active',
      estimatedMinutes: data.estimatedMinutes || 15,
      scoringMethod: data.scoringMethod || 'sum',
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    }).run();

    if (data.questions && Array.isArray(data.questions)) {
      data.questions.forEach((q: any, qIdx: number) => {
        const qId = `q-${surveyId}-${qIdx + 1}`;
        this.db.insert(schema.surveyQuestions).values({
          id: qId,
          surveyId,
          questionOrder: qIdx + 1,
          questionText: q.questionText,
          questionType: q.questionType || 'single_choice',
          category: q.category,
          required: q.required !== false ? 1 : 0,
          helpText: q.helpText,
          createdAt: now,
          updatedAt: now
        }).run();

        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt: any, oIdx: number) => {
            const optId = `opt-${qId}-${oIdx + 1}`;
            this.db.insert(schema.surveyOptions).values({
              id: optId,
              questionId: qId,
              optionOrder: oIdx + 1,
              optionText: opt.optionText || opt.optionLabel,
              score: opt.score ?? 0,
              scoreValue: opt.score ?? 0
            }).run();
          });
        }
      });
    }

    return this.getSurveyById(surveyId)!;
  }

  public assignSurvey(data: { surveyId: string; studentIds: string[]; dueDate?: string }): SurveyAssignmentDto[] {
    const results: SurveyAssignmentDto[] = [];
    const survey = this.getSurveyById(data.surveyId);
    if (!survey) return results;

    if (survey.targetMode === 'anonymous_aggregated') {
      throw new Error('Anonim / Toplu anketler belirli öğrencilere atanamaz.');
    }

    const now = Date.now();
    for (const studentId of data.studentIds) {
      const student = this.db.select().from(schema.students).where(eq(schema.students.id, studentId)).get();
      if (!student) continue;

      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const assignmentRef = `PDR-${randomSuffix}`;
      const assignmentId = `asg-${Date.now()}-${randomSuffix}`;

      this.db.insert(schema.surveyAssignments).values({
        id: assignmentId,
        surveyId: data.surveyId,
        studentId,
        assignmentRef,
        assignedAt: now,
        dueDate: data.dueDate,
        status: 'assigned',
        createdAt: now,
        updatedAt: now,
        version: 1,
        lastModifiedDeviceId: this.deviceId
      }).run();

      results.push({
        id: assignmentId,
        surveyId: data.surveyId,
        surveyTitle: survey.title,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        studentNumber: student.studentNumber || '',
        assignmentRef,
        assignedAt: now,
        dueDate: data.dueDate,
        status: 'assigned'
      });
    }
    return results;
  }

  public listAssignments(filter?: { surveyId?: string; studentId?: string; status?: string }): SurveyAssignmentDto[] {
    const rows = this.db.select({
      asg: schema.surveyAssignments,
      st: schema.students,
      srv: schema.surveys
    })
    .from(schema.surveyAssignments)
    .innerJoin(schema.students, eq(schema.surveyAssignments.studentId, schema.students.id))
    .innerJoin(schema.surveys, eq(schema.surveyAssignments.surveyId, schema.surveys.id))
    .all();

    let filtered = rows;
    if (filter?.surveyId) filtered = filtered.filter(r => r.asg.surveyId === filter.surveyId);
    if (filter?.studentId) filtered = filtered.filter(r => r.asg.studentId === filter.studentId);
    if (filter?.status) filtered = filtered.filter(r => r.asg.status === filter.status);

    return filtered.map(r => ({
      id: r.asg.id,
      surveyId: r.srv.id,
      surveyTitle: r.srv.title,
      studentId: r.st.id,
      studentName: `${r.st.firstName} ${r.st.lastName}`,
      studentNumber: r.st.studentNumber || '',
      assignmentRef: r.asg.assignmentRef,
      assignedAt: r.asg.assignedAt,
      dueDate: r.asg.dueDate || undefined,
      status: r.asg.status as any,
      startedAt: r.asg.startedAt || undefined,
      completedAt: r.asg.completedAt || undefined,
      googleFormId: r.asg.googleFormId || undefined,
      googleSheetId: r.asg.googleSheetId || undefined
    }));
  }

  public getAssignmentByRef(ref: string): { assignment: SurveyAssignmentDto; survey: SurveyDto; student: StudentDto } | null {
    const row = this.db.select({
      asg: schema.surveyAssignments,
      st: schema.students,
      srv: schema.surveys
    })
    .from(schema.surveyAssignments)
    .innerJoin(schema.students, eq(schema.surveyAssignments.studentId, schema.students.id))
    .innerJoin(schema.surveys, eq(schema.surveyAssignments.surveyId, schema.surveys.id))
    .where(eq(schema.surveyAssignments.assignmentRef, ref.trim().toUpperCase()))
    .get();

    if (!row) return null;

    const survey = this.getSurveyById(row.srv.id);
    if (!survey) return null;

    return {
      assignment: {
        id: row.asg.id,
        surveyId: row.srv.id,
        surveyTitle: row.srv.title,
        studentId: row.st.id,
        studentName: `${row.st.firstName} ${row.st.lastName}`,
        studentNumber: row.st.studentNumber || '',
        assignmentRef: row.asg.assignmentRef,
        assignedAt: row.asg.assignedAt,
        dueDate: row.asg.dueDate || undefined,
        status: row.asg.status as any
      },
      survey,
      student: {
        id: row.st.id,
        schoolYearId: row.st.schoolYearId,
        classId: row.st.classId || '',
        studentNumber: row.st.studentNumber || '',
        firstName: row.st.firstName,
        lastName: row.st.lastName,
        gender: row.st.gender as any,
        status: row.st.status as any,
        version: row.st.version,
        createdAt: row.st.createdAt,
        updatedAt: row.st.updatedAt
      }
    };
  }

  public submitResponse(payload: SurveySubmitPayload): SurveyResponseDto {
    const survey = this.getSurveyById(payload.surveyId);
    const responseId = `resp-${crypto.randomUUID()}`;
    const now = Date.now();

    const isAnonymous = survey?.targetMode === 'anonymous_aggregated';
    const matchStatus = isAnonymous ? 'anonymous' : (payload.matchStatus || (payload.studentId ? 'matched' : 'unmatched_pending'));
    const finalStudentId = isAnonymous ? undefined : payload.studentId;
    const finalName = isAnonymous ? undefined : payload.respondentName;
    const finalNumber = isAnonymous ? undefined : payload.respondentStudentNumber;
    const finalEmail = isAnonymous ? undefined : payload.respondentEmail;

    let totalScore = 0;
    const categoryScores: Record<string, number> = {};

    // 1. Calculate scores
    const calculatedAnswers: Array<{
      questionId: string;
      selectedOptionId?: string;
      textValue?: string;
      numberValue?: number;
      qScore: number;
    }> = [];

    if (payload.answers && Array.isArray(payload.answers)) {
      for (const ans of payload.answers) {
        let qScore = 0;

        if (ans.selectedOptionId) {
          const opt = this.db.select().from(schema.surveyOptions).where(eq(schema.surveyOptions.id, ans.selectedOptionId)).get();
          if (opt) {
            qScore = opt.scoreValue ?? opt.score ?? 0;
          }
        } else if (ans.numberValue !== undefined) {
          qScore = ans.numberValue;
        }

        totalScore += qScore;

        const q = this.db.select().from(schema.surveyQuestions).where(eq(schema.surveyQuestions.id, ans.questionId)).get();
        if (q?.category) {
          categoryScores[q.category] = (categoryScores[q.category] || 0) + qScore;
        }

        calculatedAnswers.push({
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          textValue: ans.textValue,
          numberValue: ans.numberValue ?? (ans.selectedOptionId ? qScore : undefined),
          qScore
        });
      }
    }

    // 2. Insert parent response first
    this.db.insert(schema.surveyResponses).values({
      id: responseId,
      assignmentId: isAnonymous ? undefined : payload.assignmentId,
      studentId: finalStudentId,
      respondentName: finalName,
      respondentStudentNumber: finalNumber,
      respondentEmail: finalEmail,
      matchStatus,
      mismatchReason: payload.mismatchReason,
      surveyId: payload.surveyId,
      source: payload.source || 'local',
      completedAt: now,
      totalScore,
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    }).run();

    // 3. Insert child answers
    for (const ans of calculatedAnswers) {
      const ansId = `ans-${crypto.randomUUID()}`;
      this.db.insert(schema.surveyAnswers).values({
        id: ansId,
        responseId,
        questionId: ans.questionId,
        selectedOptionId: ans.selectedOptionId,
        textValue: ans.textValue,
        numberValue: ans.numberValue
      }).run();
    }

    if (this.syncEngine) {
      try {
        this.syncEngine.queueChange(
          'survey_responses',
          responseId,
          'create',
          0,
          1,
          null,
          {
            id: responseId,
            surveyId: payload.surveyId,
            studentId: finalStudentId,
            totalScore
          }
        );
      } catch (err) {
        logger.error('Failed to queue sync change for survey response:', err);
      }
    }

    if (payload.assignmentId && !isAnonymous) {
      this.db.update(schema.surveyAssignments)
        .set({ status: 'completed', completedAt: now, updatedAt: now })
        .where(eq(schema.surveyAssignments.id, payload.assignmentId))
        .run();
    }

    return {
      id: responseId,
      assignmentId: isAnonymous ? undefined : payload.assignmentId,
      studentId: finalStudentId,
      respondentName: finalName,
      respondentStudentNumber: finalNumber,
      respondentEmail: finalEmail,
      matchStatus: matchStatus as any,
      mismatchReason: payload.mismatchReason,
      surveyId: payload.surveyId,
      surveyTitle: survey?.title || '',
      source: payload.source || 'local',
      completedAt: now,
      totalScore,
      categoryScores: Object.keys(categoryScores).length > 0 ? categoryScores : undefined
    };
  }

  public listResponses(filter?: { surveyId?: string; studentId?: string }): SurveyResponseDto[] {
    const rows = this.db.select({
      resp: schema.surveyResponses,
      srv: schema.surveys,
      st: schema.students
    })
    .from(schema.surveyResponses)
    .innerJoin(schema.surveys, eq(schema.surveyResponses.surveyId, schema.surveys.id))
    .leftJoin(schema.students, eq(schema.surveyResponses.studentId, schema.students.id))
    .all();

    let filtered = rows;
    if (filter?.surveyId) filtered = filtered.filter(r => r.resp.surveyId === filter.surveyId);
    if (filter?.studentId) filtered = filtered.filter(r => r.resp.studentId === filter.studentId);

    return filtered.map(r => ({
      id: r.resp.id,
      assignmentId: r.resp.assignmentId || undefined,
      studentId: r.resp.studentId || undefined,
      studentName: r.st ? `${r.st.firstName} ${r.st.lastName}` : undefined,
      studentNumber: r.st?.studentNumber || r.resp.respondentStudentNumber || undefined,
      respondentName: r.resp.respondentName || undefined,
      respondentStudentNumber: r.resp.respondentStudentNumber || undefined,
      matchStatus: (r.resp.matchStatus as any) || 'matched',
      mismatchReason: r.resp.mismatchReason || undefined,
      surveyId: r.srv.id,
      surveyTitle: r.srv.title,
      source: r.resp.source as any,
      startedAt: r.resp.startedAt || undefined,
      completedAt: r.resp.completedAt,
      totalScore: r.resp.totalScore || 0
    }));
  }

  public getSurveyAnalytics(surveyId: string): SurveyAnalyticsDto | null {
    const survey = this.getSurveyById(surveyId);
    if (!survey) return null;

    const responses = this.listResponses({ surveyId });
    const totalRespondents = responses.length;

    let overallAverageScore = 0;
    if (totalRespondents > 0) {
      const sum = responses.reduce((acc, r) => acc + (r.totalScore || 0), 0);
      overallAverageScore = Number((sum / totalRespondents).toFixed(2));
    }

    const questions = this.db.select()
      .from(schema.surveyQuestions)
      .where(eq(schema.surveyQuestions.surveyId, survey.id))
      .orderBy(schema.surveyQuestions.questionOrder)
      .all();

    const categoryTotals: Record<string, { totalScore: number; count: number; average: number }> = {};
    const questionStats: SurveyQuestionStatDto[] = [];

    for (const q of questions) {
      const qAnswers = this.db.select({
        ans: schema.surveyAnswers,
        opt: schema.surveyOptions
      })
      .from(schema.surveyAnswers)
      .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
      .where(eq(schema.surveyAnswers.questionId, q.id))
      .all();

      const responseCount = qAnswers.length;
      let numericSum = 0;
      let numericCount = 0;
      const optionDistribution: Record<string, number> = {};

      for (const a of qAnswers) {
        if (a.opt) {
          const label = a.opt.optionText || a.opt.optionLabel || '';
          optionDistribution[label] = (optionDistribution[label] || 0) + 1;
          const sc = a.opt.scoreValue ?? a.opt.score ?? 0;
          numericSum += sc;
          numericCount++;

          if (q.category) {
            if (!categoryTotals[q.category]) {
              categoryTotals[q.category] = { totalScore: 0, count: 0, average: 0 };
            }
            categoryTotals[q.category].totalScore += sc;
            categoryTotals[q.category].count++;
          }
        }
      }

      const avg = numericCount > 0 ? Number((numericSum / numericCount).toFixed(2)) : undefined;

      questionStats.push({
        questionId: q.id,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        questionType: q.questionType,
        category: q.category || undefined,
        responseCount,
        averageScore: avg,
        optionDistribution: Object.keys(optionDistribution).length > 0 ? optionDistribution : undefined
      });
    }

    // Compute category averages
    Object.keys(categoryTotals).forEach(cat => {
      const item = categoryTotals[cat];
      item.average = item.count > 0 ? Number((item.totalScore / (totalRespondents || 1)).toFixed(2)) : 0;
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      targetMode: (survey.targetMode as any) || 'student_linked',
      totalRespondents,
      overallAverageScore,
      categoryAverages: Object.keys(categoryTotals).length > 0 ? categoryTotals : undefined,
      questionStats
    };
  }
}
