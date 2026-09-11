import { evaluateBurdonTest } from '../../../shared/burdonDikkatEvaluation';
import { evaluateIndividualBNA } from '../../../shared/basarisizlikNedenleriEvaluation';
import { evaluateCalismaDavranisi } from '../../../shared/calismaDavranisiEvaluation';
import { evaluateAutomaticThoughts } from '../../../shared/automaticThoughtsEvaluation';
import { evaluateAkademikBenlikAlgisi } from '../../../shared/akademikBenlikAlgisiEvaluation';
import { evaluateKimeGoreBenNeyim } from '../../../shared/kimeGoreBenNeyimEvaluation';
import { evaluateRosenbergBenlikSaygisi } from '../../../shared/rosenbergBenlikSaygisiEvaluation';
import { evaluateProblemTaramaListesi } from '../../../shared/problemTaramaListesiEvaluation';
import { calculateMeslekDegeriEvaluation } from '../../../shared/meslekDegeriEvaluation';
import { calculateHollandKisaEvaluation } from '../../../shared/hollandKisaEvaluation';
import { calculateHollandEvaluation } from '../../../shared/hollandEvaluation';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, isNull, and, or, desc, sql } from 'drizzle-orm';
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
import { SINAV_KAYGISI_OLCEGI } from './definitions/sinavKaygisiOlcegi';
import { WESTSIDE_SINAV_KAYGISI_OLCEGI } from './definitions/westsideSinavKaygisiOlcegi';
import { SYSTEM_CATALOG_REGISTRY } from './SystemCatalogService';

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

    // Register verified real MEB survey and scale catalogs
    try {
      this.registerRealSurvey(DEVAMSIZLIK_NEDENLERI_ANKETI);
      this.registerRealSurvey(SINAV_KAYGISI_OLCEGI);
      this.registerRealSurvey(WESTSIDE_SINAV_KAYGISI_OLCEGI);
    } catch (err) {
      logger.error('Failed to register system surveys:', err);
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
        or(
          eq(schema.surveys.slug, slug),
          eq(schema.surveys.id, slug)
        ),
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

    const catalogDef = SYSTEM_CATALOG_REGISTRY.find(c => c.slug === s.slug || c.id === s.id);
    const resultPresentation = catalogDef?.resultPresentation;

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
        resultPresentation
      },
      resultPresentation,
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

    // For Burdon Dikkat Testi, compute Burdon evaluation and store inside resultSnapshot
    let appStartedAt = now - (survey.estimatedMinutes ? survey.estimatedMinutes * 60000 : 300000);    // For Burdon Dikkat Testi, compute custom metrics
    if (survey.slug === 'burdon-dikkat-testi' || survey.id === 'srv-burdon-dikkat-testi' || (survey as any).code === 'BURDON') {
      const burdonEval = evaluateBurdonTest(payload.answers);
      calculated.totalScore = burdonEval.correctMarkings;
      (calculated.resultSnapshot as any).burdonEvaluation = burdonEval;
      (calculated.resultSnapshot as any).totalScore = burdonEval.correctMarkings;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).burdonEvaluation = burdonEval;
      (calculated.resultSnapshot.rawMetrics as any).burdonAnswers = payload.answers;
      (calculated.resultSnapshot.rawMetrics as any).elapsedSeconds = burdonEval.elapsedSeconds;
      (calculated.resultSnapshot.rawMetrics as any).configuredDurationSeconds = burdonEval.configuredDurationSeconds;
      (calculated.resultSnapshot.rawMetrics as any).correctMarkings = burdonEval.correctMarkings;
      (calculated.resultSnapshot.rawMetrics as any).omittedTargets = burdonEval.omittedTargets;
      (calculated.resultSnapshot.rawMetrics as any).incorrectMarkings = burdonEval.incorrectMarkings;
      (calculated.resultSnapshot.rawMetrics as any).totalMarkings = burdonEval.totalMarkings;
      appStartedAt = now - (burdonEval.elapsedSeconds * 1000);
    }

    // For Başarısızlık Nedenleri Anketi, compute BNA evaluation and store inside resultSnapshot
    if (survey.slug === 'basarisizlik-nedenleri-anketi' || survey.id === 'srv-basarisizlik-nedenleri-anketi' || (survey as any).code === 'BNA-44') {
      const subjectText = (
        (payload as any).subjectText ||
        (payload.answers as any)?.['subjectText'] ||
        (payload.answers as any)?.['q0'] ||
        (payload.answers as any)?.['dersler'] ||
        ''
      ).toString().trim();
      const bnaEval = evaluateIndividualBNA(payload.answers, subjectText);
      calculated.totalScore = bnaEval.selectedReasonCount;
      (calculated.resultSnapshot as any).bnaEvaluation = bnaEval;
      (calculated.resultSnapshot as any).totalScore = bnaEval.selectedReasonCount;
      (calculated.resultSnapshot as any).subjectText = subjectText;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).bnaEvaluation = bnaEval;
      (calculated.resultSnapshot.rawMetrics as any).subjectText = subjectText;
      (calculated.resultSnapshot.rawMetrics as any).answers = payload.answers;
    }

    // For Çalışma Davranışını Değerlendirme Ölçeği (CDDE-73), compute CDDE evaluation and store inside resultSnapshot
    if (
      survey.slug === 'calisma-davranisi-olcegi' ||
      survey.slug === 'calisma-davranisini-degerlendirme-olcegi' ||
      survey.id === 'srv-calisma-davranisi-olcegi' ||
      survey.id === 'srv-calisma-davranisini-degerlendirme-olcegi' ||
      (survey as any).code === 'CDDE-73'
    ) {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerValue || ca.selectedOptionLabel || '';
          if (val) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 73 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.optionValue || opt?.optionText || rawAns.answerValue || rawAns.value || rawAns.selectedOptionValue || '';
                if (val) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = String(rawAns);
                answersObj[q.id] = String(rawAns);
              }
            }
          }
        });
      }
      const cddeEval = evaluateCalismaDavranisi(Object.keys(answersObj).length > 0 ? answersObj : payload.answers);
      calculated.totalScore = cddeEval.totalMismatches;
      (calculated.resultSnapshot as any).calismaDavranisiEvaluation = cddeEval;
      (calculated.resultSnapshot as any).totalScore = cddeEval.totalMismatches;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).calismaDavranisiEvaluation = cddeEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = Object.keys(answersObj).length > 0 ? answersObj : payload.answers;
    }

    // For Otomatik Düşünceler Ölçeği (ATQ-30), compute ATQ evaluation and store inside resultSnapshot
    if (
      survey.slug === 'otomatik-dusunceler-olcegi' ||
      survey.id === 'srv-otomatik-dusunceler-olcegi' ||
      (survey as any).code === 'ATQ-30'
    ) {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerScore ?? ca.answerValue ?? ca.selectedOptionLabel;
          if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 30 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns !== undefined && rawAns !== null) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.score ?? opt?.scoreValue ?? rawAns.answerScore ?? rawAns.score ?? rawAns.value ?? rawAns.selectedOptionValue;
                if (val !== undefined && val !== null) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = rawAns;
                answersObj[q.id] = rawAns;
              }
            }
          }
        });
      }
      const atqEval = evaluateAutomaticThoughts(Object.keys(answersObj).length > 0 ? answersObj : payload.answers);
      calculated.totalScore = atqEval.totalScore;
      (calculated.resultSnapshot as any).automaticThoughtsEvaluation = atqEval;
      (calculated.resultSnapshot as any).totalScore = atqEval.totalScore;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).automaticThoughtsEvaluation = atqEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = Object.keys(answersObj).length > 0 ? answersObj : payload.answers;
    }

    // For Akademik Benlik Algısı Ölçeği, compute ABAÖ evaluation and store inside resultSnapshot
    if (survey.slug === 'akademik-benlik-algisi' || survey.id === 'srv-akademik-benlik-algisi' || (survey as any).code === 'ABAÖ-II-56') {
      const answersObj: Record<string, any> = {};

      // 1. Primary: map from calculated.answers which has resolved option values and question orders
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerValue || ca.selectedOptionLabel || '';
          if (val) {
            answersObj[`q${qNum}`] = val;
          }
        });
      }

      // 2. Secondary: if any questions missing, look up version.questions & payload.answers
      if (Object.keys(answersObj).length < 56 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];

            if (rawAns) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.optionValue || opt?.optionText || rawAns.answerValue || rawAns.value || rawAns.selectedOptionValue || '';
                if (val) answersObj[`q${qNum}`] = val;
              } else {
                answersObj[`q${qNum}`] = String(rawAns);
              }
            }
          }
        });
      }

      const abaoEval = evaluateAkademikBenlikAlgisi(answersObj);
      (calculated.resultSnapshot as any).akademikBenlikEvaluation = abaoEval;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).akademikBenlikEvaluation = abaoEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = payload.answers;
    }

    // For Kime Göre Ben Neyim?, compute KGBN evaluation and store inside resultSnapshot
    if (survey.slug === 'kime-gore-ben-neyim' || survey.id === 'srv-kime-gore-ben-neyim' || (survey as any).code === 'KGBN-40') {
      const kgbnEval = evaluateKimeGoreBenNeyim(
        payload.answers,
        (payload as any).otherText || (payload.answers as any)?.['otherText'] || (payload.answers as any)?.['q40_other'] || '',
        (payload as any).customCharacteristics || (payload.answers as any)?.['customCharacteristics'] || []
      );
      calculated.totalScore = kgbnEval.selectedCellCount;
      (calculated.resultSnapshot as any).kgbnEvaluation = kgbnEval;
      (calculated.resultSnapshot as any).totalScore = kgbnEval.selectedCellCount;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).kgbnEvaluation = kgbnEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = payload.answers;
      (calculated.resultSnapshot.rawMetrics as any).otherText = kgbnEval.otherText;
      (calculated.resultSnapshot.rawMetrics as any).customCharacteristics = kgbnEval.customCharacteristics;
    }

    // For Rosenberg Benlik Saygısı Envanteri, compute Rosenberg evaluation and store inside resultSnapshot
    if (survey.slug === 'rosenberg-benlik-saygisi' || survey.id === 'srv-rosenberg-benlik-saygisi' || (survey as any).code === 'ROSENBERG-63') {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerValue || ca.selectedOptionLabel || '';
          if (val) answersObj[`q${qNum}`] = val;
        });
      }
      if (Object.keys(answersObj).length < 63 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.optionValue || opt?.optionText || rawAns.answerValue || rawAns.value || rawAns.selectedOptionValue || '';
                if (val) answersObj[`q${qNum}`] = val;
              } else {
                answersObj[`q${qNum}`] = String(rawAns);
              }
            }
          }
        });
      }
      const rosenbergEval = evaluateRosenbergBenlikSaygisi(answersObj);
      (calculated.resultSnapshot as any).rosenbergEvaluation = rosenbergEval;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).rosenbergEvaluation = rosenbergEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = answersObj;
    }

    // For Problem Tarama Listesi (PTL-176), compute PTL evaluation and store inside resultSnapshot
    if (survey.slug === 'problem-tarama-listesi' || survey.id === 'srv-problem-tarama-listesi' || (survey as any).code === 'PTL-176') {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerValue || ca.selectedOptionLabel || '';
          if (val) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 176 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.optionValue || opt?.optionText || rawAns.answerValue || rawAns.value || rawAns.selectedOptionValue || '';
                if (val) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = String(rawAns);
                answersObj[q.id] = String(rawAns);
              }
            }
          }
        });
      }
      const ptlEval = evaluateProblemTaramaListesi(answersObj);
      calculated.totalScore = ptlEval.totalSelected;
      (calculated.resultSnapshot as any).ptlEvaluation = ptlEval;
      (calculated.resultSnapshot as any).totalScore = ptlEval.totalSelected;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).ptlEvaluation = ptlEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = answersObj;
    }

    // For Meslek Değeri Envanteri (MESLEK-DEGERI-35), compute evaluation and store inside resultSnapshot
    if (
      survey.slug === 'meslek-degeri-envanteri' ||
      survey.id === 'srv-meslek-degeri-envanteri' ||
      (survey as any).code === 'MESLEK-DEGERI-35' ||
      (survey as any).code === 'MESLEK-35'
    ) {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerScore ?? ca.answerValue ?? ca.selectedOptionLabel;
          if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 35 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns !== undefined && rawAns !== null) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.score ?? opt?.scoreValue ?? opt?.optionValue ?? rawAns.answerScore ?? rawAns.score ?? rawAns.value ?? rawAns.selectedOptionValue;
                if (val !== undefined && val !== null) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = rawAns;
                answersObj[q.id] = rawAns;
              }
            }
          }
        });
      }
      const meslekEval = calculateMeslekDegeriEvaluation(Object.keys(answersObj).length > 0 ? answersObj : payload.answers);
      (calculated.resultSnapshot as any).meslekDegeriEvaluation = meslekEval;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).meslekDegeriEvaluation = meslekEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = Object.keys(answersObj).length > 0 ? answersObj : payload.answers;
    }

    // For Holland Kısa Biçim Mesleki Tarama Envanteri (HOLLAND-KISA-30), compute evaluation and store inside resultSnapshot
    if (
      survey.slug === 'holland-kisa-bicim-mesleki-tarama-envanteri' ||
      survey.slug === 'holland-kisa-mesleki-tarama' ||
      survey.id === 'srv-holland-kisa-bicim-mesleki-tarama-envanteri' ||
      (survey as any).code === 'HOLLAND-KISA-30'
    ) {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerScore ?? ca.answerValue ?? ca.selectedOptionLabel;
          if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 30 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns !== undefined && rawAns !== null) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.score ?? opt?.scoreValue ?? opt?.optionValue ?? rawAns.answerScore ?? rawAns.score ?? rawAns.value ?? rawAns.selectedOptionValue;
                if (val !== undefined && val !== null) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = rawAns;
                answersObj[q.id] = rawAns;
              }
            }
          }
        });
      }
      const hollandKisaEval = calculateHollandKisaEvaluation(Object.keys(answersObj).length > 0 ? answersObj : payload.answers);
      (calculated.resultSnapshot as any).hollandKisaEvaluation = hollandKisaEval;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).hollandKisaEvaluation = hollandKisaEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = Object.keys(answersObj).length > 0 ? answersObj : payload.answers;
    }

    // For Holland Mesleki Tercih Envanteri (HOLLAND-90), compute evaluation and store inside resultSnapshot
    if (
      survey.slug === 'holland-mesleki-tercih-envanteri' ||
      survey.id === 'srv-holland-mesleki-tercih-envanteri' ||
      (survey as any).code === 'HOLLAND-90'
    ) {
      const answersObj: Record<string, any> = {};
      if (calculated.answers && Array.isArray(calculated.answers) && calculated.answers.length > 0) {
        calculated.answers.forEach((ca, idx) => {
          const qNum = ca.questionOrder || idx + 1;
          const val = ca.answerValue || ca.selectedOptionLabel || '';
          if (val) answersObj[`q${qNum}`] = val;
          if (ca.questionId) answersObj[ca.questionId] = val;
        });
      }
      if (Object.keys(answersObj).length < 90 && version.questions && Array.isArray(version.questions)) {
        version.questions.forEach(q => {
          const qNum = q.questionOrder;
          if (!answersObj[`q${qNum}`] && !answersObj[q.id]) {
            const rawAns = Array.isArray(payload.answers)
              ? payload.answers.find((a: any) => a.questionId === q.id || a.questionOrder === qNum)
              : (payload.answers as any)?.[`q${qNum}`] || (payload.answers as any)?.[q.id];
            if (rawAns) {
              if (typeof rawAns === 'object') {
                const optId = rawAns.selectedOptionId || rawAns.optionId;
                const opt = q.options?.find(o => o.id === optId);
                const val = opt?.optionValue || opt?.optionText || rawAns.answerValue || rawAns.value || rawAns.selectedOptionValue || '';
                if (val) {
                  answersObj[`q${qNum}`] = val;
                  answersObj[q.id] = val;
                }
              } else {
                answersObj[`q${qNum}`] = String(rawAns);
                answersObj[q.id] = String(rawAns);
              }
            }
          }
        });
      }
      const hollandEval = calculateHollandEvaluation(Object.keys(answersObj).length > 0 ? answersObj : payload.answers);
      (calculated.resultSnapshot as any).hollandEvaluation = hollandEval;
      if (!calculated.resultSnapshot.rawMetrics) {
        calculated.resultSnapshot.rawMetrics = {};
      }
      (calculated.resultSnapshot.rawMetrics as any).hollandEvaluation = hollandEval;
      (calculated.resultSnapshot.rawMetrics as any).answers = Object.keys(answersObj).length > 0 ? answersObj : payload.answers;
    }

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
      startedAt: appStartedAt,
      completedAt: now,
      resultSnapshot: resultSnapshotJson,
      createdAt: now,
      updatedAt: now,
      version: 1,
      lastModifiedDeviceId: this.deviceId
    }).run();

    // 2. Insert Answers (only for valid questions existing in surveyQuestions schema)
    const validQuestionIds = new Set(version.questions.map(q => q.id));
    for (const ans of calculated.answers) {
      if (validQuestionIds.has(ans.questionId)) {
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

      // Backward-compatibility & integrity guarantee for Akademik Benlik Algısı Ölçeği
      if ((r.srv.slug === 'akademik-benlik-algisi' || r.srv.id === 'srv-akademik-benlik-algisi' || (r.srv as any).code === 'ABAÖ-II-56') &&
          (!resultSnapshot || !resultSnapshot.akademikBenlikEvaluation || resultSnapshot.akademikBenlikEvaluation.totalAnswered === 0 || !resultSnapshot.akademikBenlikEvaluation.overallMean)) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          const rawAnswers = this.db.select({
            ans: schema.surveyAnswers,
            q: schema.surveyQuestions,
            opt: schema.surveyOptions
          })
          .from(schema.surveyAnswers)
          .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
          .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
          .where(eq(schema.surveyAnswers.applicationId, r.app.id))
          .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
          .all();

          if (rawAnswers.length > 0) {
            const answersObj: Record<string, any> = {};
            rawAnswers.forEach((a, idx) => {
              const qNum = a.q?.questionOrder || idx + 1;
              answersObj[`q${qNum}`] = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
            });
            const abaoEval = evaluateAkademikBenlikAlgisi(answersObj);
            resultSnapshot.akademikBenlikEvaluation = abaoEval;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.akademikBenlikEvaluation = abaoEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Kime Göre Ben Neyim?
      if ((r.srv.slug === 'kime-gore-ben-neyim' || r.srv.id === 'srv-kime-gore-ben-neyim' || (r.srv as any).code === 'KGBN-40') &&
          (!resultSnapshot || !resultSnapshot.kgbnEvaluation || typeof resultSnapshot.kgbnEvaluation.selectedCellCount !== 'number')) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          const rawAnswers = this.db.select({
            ans: schema.surveyAnswers,
            q: schema.surveyQuestions,
            opt: schema.surveyOptions
          })
          .from(schema.surveyAnswers)
          .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
          .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
          .where(eq(schema.surveyAnswers.applicationId, r.app.id))
          .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
          .all();

          const answersObj: Record<string, any> = {};
          rawAnswers.forEach((a, idx) => {
            const qNum = a.q?.questionOrder || idx + 1;
            answersObj[`q${qNum}`] = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
          });
          const kgbnEval = evaluateKimeGoreBenNeyim(
            resultSnapshot?.rawMetrics?.answers || answersObj,
            resultSnapshot?.rawMetrics?.otherText || '',
            resultSnapshot?.rawMetrics?.customCharacteristics || []
          );
          resultSnapshot.kgbnEvaluation = kgbnEval;
          resultSnapshot.totalScore = kgbnEval.selectedCellCount;
          if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
          resultSnapshot.rawMetrics.kgbnEvaluation = kgbnEval;
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Rosenberg Benlik Saygısı Envanteri
      if ((r.srv.slug === 'rosenberg-benlik-saygisi' || r.srv.id === 'srv-rosenberg-benlik-saygisi' || (r.srv as any).code === 'ROSENBERG-63') &&
          (!resultSnapshot || !resultSnapshot.rosenbergEvaluation || !resultSnapshot.rosenbergEvaluation.subscales)) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          const rawAnswers = this.db.select({
            ans: schema.surveyAnswers,
            q: schema.surveyQuestions,
            opt: schema.surveyOptions
          })
          .from(schema.surveyAnswers)
          .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
          .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
          .where(eq(schema.surveyAnswers.applicationId, r.app.id))
          .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
          .all();

          if (rawAnswers.length > 0) {
            const answersObj: Record<string, any> = {};
            rawAnswers.forEach((a, idx) => {
              const qNum = a.q?.questionOrder || idx + 1;
              answersObj[`q${qNum}`] = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
            });
            const rosenbergEval = evaluateRosenbergBenlikSaygisi(answersObj);
            resultSnapshot.rosenbergEvaluation = rosenbergEval;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.rosenbergEvaluation = rosenbergEval;
            resultSnapshot.rawMetrics.answers = answersObj;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Problem Tarama Listesi (PTL-176)
      if ((r.srv.slug === 'problem-tarama-listesi' || r.srv.id === 'srv-problem-tarama-listesi' || (r.srv as any).code === 'PTL-176') &&
          (!resultSnapshot || !resultSnapshot.ptlEvaluation || !resultSnapshot.ptlEvaluation.sections)) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          const rawAnswers = this.db.select({
            ans: schema.surveyAnswers,
            q: schema.surveyQuestions,
            opt: schema.surveyOptions
          })
          .from(schema.surveyAnswers)
          .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
          .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
          .where(eq(schema.surveyAnswers.applicationId, r.app.id))
          .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
          .all();

          if (rawAnswers.length > 0) {
            const answersObj: Record<string, any> = {};
            rawAnswers.forEach((a, idx) => {
              const qNum = a.q?.questionOrder || idx + 1;
              const val = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
              answersObj[`q${qNum}`] = val;
              if (a.q?.id) answersObj[a.q.id] = val;
            });
            const ptlEval = evaluateProblemTaramaListesi(answersObj);
            resultSnapshot.ptlEvaluation = ptlEval;
            resultSnapshot.totalScore = ptlEval.totalSelected;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.ptlEvaluation = ptlEval;
            resultSnapshot.rawMetrics.answers = answersObj;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Çalışma Davranışını Değerlendirme Ölçeği (CDDE-73)
      if (
        (r.srv.slug === 'calisma-davranisi-olcegi' ||
         r.srv.slug === 'calisma-davranisini-degerlendirme-olcegi' ||
         r.srv.id === 'srv-calisma-davranisi-olcegi' ||
         r.srv.id === 'srv-calisma-davranisini-degerlendirme-olcegi' ||
         (r.srv as any).code === 'CDDE-73') &&
        (!resultSnapshot || !resultSnapshot.calismaDavranisiEvaluation || !resultSnapshot.calismaDavranisiEvaluation.areaScores)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let cddeEval: any = null;
          if (resultSnapshot?.rawMetrics?.calismaDavranisiEvaluation?.areaScores) {
            cddeEval = resultSnapshot.rawMetrics.calismaDavranisiEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            cddeEval = evaluateCalismaDavranisi(resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              cddeEval = evaluateCalismaDavranisi(answersObj);
            }
          }
          if (cddeEval) {
            resultSnapshot.calismaDavranisiEvaluation = cddeEval;
            resultSnapshot.totalScore = cddeEval.totalMismatches;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.calismaDavranisiEvaluation = cddeEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Başarısızlık Nedenleri Anketi (BNA-44)
      if (
        (r.srv.slug === 'basarisizlik-nedenleri-anketi' ||
         r.srv.id === 'srv-basarisizlik-nedenleri-anketi' ||
         (r.srv as any).code === 'BNA-44') &&
        (!resultSnapshot || !resultSnapshot.bnaEvaluation || !resultSnapshot.bnaEvaluation.areaScores)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          const subjectText = (
            resultSnapshot?.subjectText ||
            resultSnapshot?.rawMetrics?.subjectText ||
            ''
          ).toString().trim();
          let bnaEval: any = null;
          if (resultSnapshot?.rawMetrics?.bnaEvaluation?.areaScores) {
            bnaEval = resultSnapshot.rawMetrics.bnaEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            bnaEval = evaluateIndividualBNA(resultSnapshot.rawMetrics.answers, subjectText);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              bnaEval = evaluateIndividualBNA(answersObj, subjectText);
            }
          }
          if (bnaEval) {
            resultSnapshot.bnaEvaluation = bnaEval;
            resultSnapshot.totalScore = bnaEval.selectedReasonCount;
            resultSnapshot.subjectText = subjectText;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.bnaEvaluation = bnaEval;
            resultSnapshot.rawMetrics.subjectText = subjectText;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Otomatik Düşünceler Ölçeği (ATQ-30)
      if (
        (r.srv.slug === 'otomatik-dusunceler-olcegi' ||
         r.srv.id === 'srv-otomatik-dusunceler-olcegi' ||
         (r.srv as any).code === 'ATQ-30') &&
        (!resultSnapshot || !resultSnapshot.automaticThoughtsEvaluation || resultSnapshot.automaticThoughtsEvaluation.totalScore === undefined)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let atqEval: any = null;
          if (resultSnapshot?.rawMetrics?.automaticThoughtsEvaluation?.totalScore !== undefined) {
            atqEval = resultSnapshot.rawMetrics.automaticThoughtsEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            atqEval = evaluateAutomaticThoughts(resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.score ?? a.opt?.scoreValue ?? a.ans.answerScore ?? a.ans.answerValue ?? a.opt?.optionText;
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              atqEval = evaluateAutomaticThoughts(answersObj);
            }
          }
          if (atqEval) {
            resultSnapshot.automaticThoughtsEvaluation = atqEval;
            resultSnapshot.totalScore = atqEval.totalScore;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.automaticThoughtsEvaluation = atqEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Burdon Dikkat Testi
      if (
        (r.srv.slug === 'burdon-dikkat-testi' ||
         r.srv.id === 'srv-burdon-dikkat-testi' ||
         (r.srv as any).code === 'BURDON') &&
        (!resultSnapshot || !resultSnapshot.burdonEvaluation || resultSnapshot.burdonEvaluation.correctMarkings === undefined)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let burdonEval: any = null;
          if (resultSnapshot?.rawMetrics?.burdonEvaluation?.correctMarkings !== undefined) {
            burdonEval = resultSnapshot.rawMetrics.burdonEvaluation;
          } else if (resultSnapshot?.rawMetrics?.burdonAnswers || resultSnapshot?.rawMetrics?.answers) {
            burdonEval = evaluateBurdonTest(resultSnapshot.rawMetrics.burdonAnswers || resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .all();

            if (rawAnswers.length > 0) {
              burdonEval = evaluateBurdonTest(rawAnswers.map(a => ({ questionId: a.ans.questionId, answerValue: a.ans.answerValue })));
            }
          }
          if (burdonEval) {
            resultSnapshot.burdonEvaluation = burdonEval;
            resultSnapshot.totalScore = burdonEval.correctMarkings;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.burdonEvaluation = burdonEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Meslek Değeri Envanteri
      if (
        (r.srv.slug === 'meslek-degeri-envanteri' ||
         r.srv.id === 'srv-meslek-degeri-envanteri' ||
         (r.srv as any).code === 'MESLEK-DEGERI-35' ||
         (r.srv as any).code === 'MESLEK-35') &&
        (!resultSnapshot || !resultSnapshot.meslekDegeriEvaluation || !resultSnapshot.meslekDegeriEvaluation.valueResults)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let meslekEval: any = null;
          if (resultSnapshot?.rawMetrics?.meslekDegeriEvaluation?.valueResults) {
            meslekEval = resultSnapshot.rawMetrics.meslekDegeriEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            meslekEval = calculateMeslekDegeriEvaluation(resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.score ?? a.opt?.scoreValue ?? a.ans.answerScore ?? a.ans.answerValue ?? a.opt?.optionText;
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              meslekEval = calculateMeslekDegeriEvaluation(answersObj);
            }
          }
          if (meslekEval) {
            resultSnapshot.meslekDegeriEvaluation = meslekEval;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.meslekDegeriEvaluation = meslekEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Holland Kısa Biçim Mesleki Tarama Envanteri
      if (
        (r.srv.slug === 'holland-kisa-bicim-mesleki-tarama-envanteri' ||
         r.srv.slug === 'holland-kisa-mesleki-tarama' ||
         r.srv.id === 'srv-holland-kisa-bicim-mesleki-tarama-envanteri' ||
         (r.srv as any).code === 'HOLLAND-KISA-30') &&
        (!resultSnapshot || !resultSnapshot.hollandKisaEvaluation || !resultSnapshot.hollandKisaEvaluation.typeResults)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let hollandKisaEval: any = null;
          if (resultSnapshot?.rawMetrics?.hollandKisaEvaluation?.typeResults) {
            hollandKisaEval = resultSnapshot.rawMetrics.hollandKisaEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            hollandKisaEval = calculateHollandKisaEvaluation(resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.score ?? a.opt?.scoreValue ?? a.ans.answerScore ?? a.ans.answerValue ?? a.opt?.optionText;
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              hollandKisaEval = calculateHollandKisaEvaluation(answersObj);
            }
          }
          if (hollandKisaEval) {
            resultSnapshot.hollandKisaEvaluation = hollandKisaEval;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.hollandKisaEvaluation = hollandKisaEval;
          }
        } catch {}
      }

      // Backward-compatibility & integrity guarantee for Holland Mesleki Tercih Envanteri
      if (
        (r.srv.slug === 'holland-mesleki-tercih-envanteri' ||
         r.srv.id === 'srv-holland-mesleki-tercih-envanteri' ||
         (r.srv as any).code === 'HOLLAND-90') &&
        (!resultSnapshot || !resultSnapshot.hollandEvaluation || !resultSnapshot.hollandEvaluation.typeResults)
      ) {
        if (!resultSnapshot) resultSnapshot = {};
        try {
          let hollandEval: any = null;
          if (resultSnapshot?.rawMetrics?.hollandEvaluation?.typeResults) {
            hollandEval = resultSnapshot.rawMetrics.hollandEvaluation;
          } else if (resultSnapshot?.rawMetrics?.answers) {
            hollandEval = calculateHollandEvaluation(resultSnapshot.rawMetrics.answers);
          } else {
            const rawAnswers = this.db.select({
              ans: schema.surveyAnswers,
              q: schema.surveyQuestions,
              opt: schema.surveyOptions
            })
            .from(schema.surveyAnswers)
            .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
            .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
            .where(eq(schema.surveyAnswers.applicationId, r.app.id))
            .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
            .all();

            if (rawAnswers.length > 0) {
              const answersObj: Record<string, any> = {};
              rawAnswers.forEach((a, idx) => {
                const qNum = a.q?.questionOrder || idx + 1;
                const val = a.opt?.optionValue || a.ans.answerValue || a.opt?.optionText || '';
                answersObj[`q${qNum}`] = val;
                if (a.q?.id) answersObj[a.q.id] = val;
              });
              hollandEval = calculateHollandEvaluation(answersObj);
            }
          }
          if (hollandEval) {
            resultSnapshot.hollandEvaluation = hollandEval;
            if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
            resultSnapshot.rawMetrics.hollandEvaluation = hollandEval;
          }
        } catch {}
      }

      const calculatedTotalScore =
        resultSnapshot?.totalScore ??
        resultSnapshot?.kgbnEvaluation?.selectedCellCount ??
        resultSnapshot?.bnaEvaluation?.selectedReasonCount ??
        resultSnapshot?.calismaDavranisiEvaluation?.totalMismatches ??
        resultSnapshot?.automaticThoughtsEvaluation?.totalScore ??
        resultSnapshot?.burdonEvaluation?.correctMarkings ??
        resultSnapshot?.ptlEvaluation?.totalSelected;

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
        totalScore: calculatedTotalScore,
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

    // Fetch answers with subscale metadata (using leftJoin to ensure custom/dynamic answers like burdon_data and cell IDs are preserved)
    const rawAnswers = this.db.select({
      ans: schema.surveyAnswers,
      q: schema.surveyQuestions,
      opt: schema.surveyOptions,
      sub: schema.surveySubscales
    })
    .from(schema.surveyAnswers)
    .leftJoin(schema.surveyQuestions, eq(schema.surveyAnswers.questionId, schema.surveyQuestions.id))
    .leftJoin(schema.surveyOptions, eq(schema.surveyAnswers.selectedOptionId, schema.surveyOptions.id))
    .leftJoin(schema.surveySubscales, eq(schema.surveyQuestions.subscaleId, schema.surveySubscales.id))
    .where(eq(schema.surveyAnswers.applicationId, id))
    .orderBy(schema.surveyQuestions.questionOrder, schema.surveyAnswers.id)
    .all();

    const answers = rawAnswers.map(a => ({
      id: a.ans.id,
      questionId: a.ans.questionId,
      questionOrder: a.q?.questionOrder ?? 0,
      questionText: a.q?.questionText || a.ans.questionId,
      selectedOptionId: a.ans.selectedOptionId || undefined,
      selectedOptionLabel: a.opt?.optionLabel || a.opt?.optionText || undefined,
      answerValue: a.ans.answerValue || undefined,
      answerScore: a.ans.answerScore ?? undefined,
      isReverseScored: a.q ? a.q.isReverseScored === 1 : false,
      subscaleCode: a.sub?.code || undefined
    }));

    let finalAnswers = answers;
    if (resultSnapshot?.rawMetrics?.burdonAnswers && Array.isArray(resultSnapshot.rawMetrics.burdonAnswers)) {
      finalAnswers = resultSnapshot.rawMetrics.burdonAnswers.map((ba: any, idx: number) => ({
        id: `ans-snap-${idx}`,
        questionId: ba.questionId,
        questionOrder: idx + 1,
        questionText: ba.questionId,
        answerValue: ba.answerValue,
        answerScore: 0,
        isReverseScored: false
      }));
    }

    // ABAÖ guarantee for getApplicationDetail
    if ((row.srv.slug === 'akademik-benlik-algisi' || row.srv.id === 'srv-akademik-benlik-algisi' || (row.srv as any).code === 'ABAÖ-II-56') &&
        (!resultSnapshot || !resultSnapshot.akademikBenlikEvaluation || resultSnapshot.akademikBenlikEvaluation.totalAnswered === 0 || !resultSnapshot.akademikBenlikEvaluation.overallMean)) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        answersObj[`q${qNum}`] = a.selectedOptionLabel || a.answerValue || '';
      });
      const abaoEval = evaluateAkademikBenlikAlgisi(answersObj);
      resultSnapshot.akademikBenlikEvaluation = abaoEval;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.akademikBenlikEvaluation = abaoEval;
    }

    // KGBN guarantee for getApplicationDetail
    if ((row.srv.slug === 'kime-gore-ben-neyim' || row.srv.id === 'srv-kime-gore-ben-neyim' || (row.srv as any).code === 'KGBN-40') &&
        (!resultSnapshot || !resultSnapshot.kgbnEvaluation || typeof resultSnapshot.kgbnEvaluation.selectedCellCount !== 'number')) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        answersObj[`q${qNum}`] = a.selectedOptionLabel || a.answerValue || '';
      });
      const kgbnEval = evaluateKimeGoreBenNeyim(
        resultSnapshot?.rawMetrics?.answers || answersObj,
        resultSnapshot?.rawMetrics?.otherText || '',
        resultSnapshot?.rawMetrics?.customCharacteristics || []
      );
      resultSnapshot.kgbnEvaluation = kgbnEval;
      resultSnapshot.totalScore = kgbnEval.selectedCellCount;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.kgbnEvaluation = kgbnEval;
    }

    // Rosenberg guarantee for getApplicationDetail
    if ((row.srv.slug === 'rosenberg-benlik-saygisi' || row.srv.id === 'srv-rosenberg-benlik-saygisi' || (row.srv as any).code === 'ROSENBERG-63') &&
        (!resultSnapshot || !resultSnapshot.rosenbergEvaluation || !resultSnapshot.rosenbergEvaluation.subscales)) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        answersObj[`q${qNum}`] = a.selectedOptionLabel || a.answerValue || '';
      });
      const rosenbergEval = evaluateRosenbergBenlikSaygisi(answersObj);
      resultSnapshot.rosenbergEvaluation = rosenbergEval;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.rosenbergEvaluation = rosenbergEval;
      resultSnapshot.rawMetrics.answers = answersObj;
    }

    // PTL-176 guarantee for getApplicationDetail
    if ((row.srv.slug === 'problem-tarama-listesi' || row.srv.id === 'srv-problem-tarama-listesi' || (row.srv as any).code === 'PTL-176') &&
        (!resultSnapshot || !resultSnapshot.ptlEvaluation || !resultSnapshot.ptlEvaluation.sections)) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.selectedOptionLabel || a.answerValue || '';
        answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const ptlEval = evaluateProblemTaramaListesi(answersObj);
      resultSnapshot.ptlEvaluation = ptlEval;
      resultSnapshot.totalScore = ptlEval.totalSelected;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.ptlEvaluation = ptlEval;
      resultSnapshot.rawMetrics.answers = answersObj;
    }

    // CDDE-73 guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'calisma-davranisi-olcegi' ||
       row.srv.slug === 'calisma-davranisini-degerlendirme-olcegi' ||
       row.srv.id === 'srv-calisma-davranisi-olcegi' ||
       row.srv.id === 'srv-calisma-davranisini-degerlendirme-olcegi' ||
       (row.srv as any).code === 'CDDE-73') &&
      (!resultSnapshot || !resultSnapshot.calismaDavranisiEvaluation || !resultSnapshot.calismaDavranisiEvaluation.areaScores)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.selectedOptionLabel || a.answerValue || '';
        answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const cddeEval = evaluateCalismaDavranisi(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {});
      resultSnapshot.calismaDavranisiEvaluation = cddeEval;
      resultSnapshot.totalScore = cddeEval.totalMismatches;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.calismaDavranisiEvaluation = cddeEval;
    }

    // BNA-44 guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'basarisizlik-nedenleri-anketi' ||
       row.srv.id === 'srv-basarisizlik-nedenleri-anketi' ||
       (row.srv as any).code === 'BNA-44') &&
      (!resultSnapshot || !resultSnapshot.bnaEvaluation || !resultSnapshot.bnaEvaluation.areaScores)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const subjectText = (
        resultSnapshot?.subjectText ||
        resultSnapshot?.rawMetrics?.subjectText ||
        answers.find(a => a.questionId === 'subjectText' || a.questionId === 'q0' || a.questionId === 'dersler')?.answerValue ||
        ''
      ).toString().trim();
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.selectedOptionLabel || a.answerValue || '';
        answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const bnaEval = evaluateIndividualBNA(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {}, subjectText);
      resultSnapshot.bnaEvaluation = bnaEval;
      resultSnapshot.totalScore = bnaEval.selectedReasonCount;
      resultSnapshot.subjectText = subjectText;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.bnaEvaluation = bnaEval;
      resultSnapshot.rawMetrics.subjectText = subjectText;
    }

    // ATQ-30 guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'otomatik-dusunceler-olcegi' ||
       row.srv.id === 'srv-otomatik-dusunceler-olcegi' ||
       (row.srv as any).code === 'ATQ-30') &&
      (!resultSnapshot || !resultSnapshot.automaticThoughtsEvaluation || resultSnapshot.automaticThoughtsEvaluation.totalScore === undefined)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.answerScore ?? a.answerValue ?? a.selectedOptionLabel;
        if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const atqEval = evaluateAutomaticThoughts(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {});
      resultSnapshot.automaticThoughtsEvaluation = atqEval;
      resultSnapshot.totalScore = atqEval.totalScore;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.automaticThoughtsEvaluation = atqEval;
    }

    // Burdon guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'burdon-dikkat-testi' ||
       row.srv.id === 'srv-burdon-dikkat-testi' ||
       (row.srv as any).code === 'BURDON') &&
      (!resultSnapshot || !resultSnapshot.burdonEvaluation || resultSnapshot.burdonEvaluation.correctMarkings === undefined)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const burdonEval = evaluateBurdonTest(resultSnapshot?.rawMetrics?.burdonAnswers || resultSnapshot?.rawMetrics?.answers || answers);
      resultSnapshot.burdonEvaluation = burdonEval;
      resultSnapshot.totalScore = burdonEval.correctMarkings;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.burdonEvaluation = burdonEval;
    }

    // Meslek Değeri guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'meslek-degeri-envanteri' ||
       row.srv.id === 'srv-meslek-degeri-envanteri' ||
       (row.srv as any).code === 'MESLEK-DEGERI-35' ||
       (row.srv as any).code === 'MESLEK-35') &&
      (!resultSnapshot || !resultSnapshot.meslekDegeriEvaluation || !resultSnapshot.meslekDegeriEvaluation.valueResults)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.answerScore ?? a.answerValue ?? a.selectedOptionLabel;
        if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const meslekEval = calculateMeslekDegeriEvaluation(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {});
      resultSnapshot.meslekDegeriEvaluation = meslekEval;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.meslekDegeriEvaluation = meslekEval;
    }

    // Holland Kısa guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'holland-kisa-bicim-mesleki-tarama-envanteri' ||
       row.srv.slug === 'holland-kisa-mesleki-tarama' ||
       row.srv.id === 'srv-holland-kisa-bicim-mesleki-tarama-envanteri' ||
       (row.srv as any).code === 'HOLLAND-KISA-30') &&
      (!resultSnapshot || !resultSnapshot.hollandKisaEvaluation || !resultSnapshot.hollandKisaEvaluation.typeResults)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.answerScore ?? a.answerValue ?? a.selectedOptionLabel;
        if (val !== undefined && val !== null) answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const hollandKisaEval = calculateHollandKisaEvaluation(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {});
      resultSnapshot.hollandKisaEvaluation = hollandKisaEval;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.hollandKisaEvaluation = hollandKisaEval;
    }

    // Holland Mesleki Tercih guarantee for getApplicationDetail
    if (
      (row.srv.slug === 'holland-mesleki-tercih-envanteri' ||
       row.srv.id === 'srv-holland-mesleki-tercih-envanteri' ||
       (row.srv as any).code === 'HOLLAND-90') &&
      (!resultSnapshot || !resultSnapshot.hollandEvaluation || !resultSnapshot.hollandEvaluation.typeResults)
    ) {
      if (!resultSnapshot) resultSnapshot = {};
      const answersObj: Record<string, any> = {};
      answers.forEach((a, idx) => {
        const qNum = a.questionOrder || idx + 1;
        const val = a.answerValue || a.selectedOptionLabel || '';
        if (val) answersObj[`q${qNum}`] = val;
        if (a.questionId) answersObj[a.questionId] = val;
      });
      const hollandEval = calculateHollandEvaluation(Object.keys(answersObj).length > 0 ? answersObj : resultSnapshot?.rawMetrics?.answers || {});
      resultSnapshot.hollandEvaluation = hollandEval;
      if (!resultSnapshot.rawMetrics) resultSnapshot.rawMetrics = {};
      resultSnapshot.rawMetrics.hollandEvaluation = hollandEval;
    }

    const calculatedTotalScore =
      resultSnapshot?.totalScore ??
      resultSnapshot?.kgbnEvaluation?.selectedCellCount ??
      resultSnapshot?.bnaEvaluation?.selectedReasonCount ??
      resultSnapshot?.calismaDavranisiEvaluation?.totalMismatches ??
      resultSnapshot?.automaticThoughtsEvaluation?.totalScore ??
      resultSnapshot?.burdonEvaluation?.correctMarkings ??
      resultSnapshot?.ptlEvaluation?.totalSelected;

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
      totalScore: calculatedTotalScore,
      resultSnapshot,
      answers: finalAnswers,
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
