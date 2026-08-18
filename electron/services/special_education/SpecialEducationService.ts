import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import { SyncEngine } from '../sync/SyncEngine';
import { logger } from '../logger/Logger';

const uuidv4 = () => crypto.randomUUID();

export interface RamReportDto {
  id?: string;
  studentId: string;
  reportNumber: string;
  issueDate: string;
  validUntil: string;
  diagnosisCategory: string;
  placementDecision: string;
  supportEducationType?: string;
  recommendedWeeklyHours?: number;
  educationalEvaluation?: string;
  status?: string;
  notes?: string;
}

export interface BepPlanDto {
  id?: string;
  studentId: string;
  schoolYearId: string;
  ramReportId?: string;
  title: string;
  startDate: string;
  endDate: string;
  committeeMembers?: Array<{ role: string; name: string; title?: string }>;
  generalPerformanceSummary: string;
  accommodations?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface BepGoalDto {
  id?: string;
  bepPlanId: string;
  studentId: string;
  lessonName: string;
  longTermGoal: string;
  shortTermGoal: string;
  targetDate?: string;
  successCriteria?: string;
  evaluationMethod?: string;
  responsiblePerson?: string;
  achievementStatus?: 'not_started' | 'in_progress' | 'partially_achieved' | 'achieved' | 'not_achieved';
  achievementDate?: string;
  notes?: string;
}

export interface BipPlanDto {
  id?: string;
  studentId: string;
  schoolYearId: string;
  targetBehavior: string;
  behaviorFrequencyIntensity: string;
  antecedents: string;
  consequences: string;
  replacementBehavior: string;
  interventionStrategies: string;
  crisisPlan?: string;
  evaluationSchedule?: string;
  status?: 'active' | 'completed' | 'archived';
}

export interface DevelopmentEvaluationDto {
  id?: string;
  studentId: string;
  bepPlanId?: string;
  periodName: string;
  evaluationDate: string;
  academicDevelopment: string;
  socialEmotionalDevelopment: string;
  behavioralDevelopment: string;
  recommendations: string;
  nextTermGoals?: string;
  evaluatorName: string;
}

export interface RamReferralDto {
  id?: string;
  studentId: string;
  schoolYearId: string;
  referralReason: string;
  referralType?: 'ilk_inceleme' | 'yeniden_inceleme' | 'kademe_degisikligi' | 'tedbir_kaldirma';
  referralDate: string;
  schoolReportSummary: string;
  committeeDecisionDate?: string;
  dispatchDate?: string;
  appointmentDate?: string;
  resultStatus?: 'pending' | 'evaluated' | 'report_issued' | 'rejected' | 'canceled';
  resultNotes?: string;
}

export class SpecialEducationService {
  private db: Database.Database;
  private deviceId: string;
  private syncEngine: SyncEngine;

  constructor(db: Database.Database, deviceId: string, syncEngine: SyncEngine) {
    this.db = db;
    this.deviceId = deviceId;
    this.syncEngine = syncEngine;
  }

  // ==========================================
  // 1. RAM RAPORLARI
  // ==========================================
  public createRamReport(dto: RamReportDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();
    const supportType = dto.supportEducationType || 'destek_egitim_odasi';
    const weeklyHours = dto.recommendedWeeklyHours || 4;
    const status = dto.status || 'active';

    this.db.prepare(`
      INSERT INTO ram_reports (
        id, student_id, report_number, issue_date, valid_until, diagnosis_category,
        placement_decision, support_education_type, recommended_weekly_hours,
        educational_evaluation, status, notes, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.studentId, dto.reportNumber, dto.issueDate, dto.validUntil, dto.diagnosisCategory,
      dto.placementDecision, supportType, weeklyHours, dto.educationalEvaluation || null,
      status, dto.notes || null, now, now, this.deviceId
    );

    const created = this.getRamReportById(id);
    this.syncEngine.recordChange('ram_reports', id, 'create', 0, 1, null, JSON.stringify(created));
    logger.info(`Created RAM Report ${dto.reportNumber} for student ${dto.studentId}`);
    return created;
  }

  public updateRamReport(id: string, dto: Partial<RamReportDto>): any {
    const current = this.getRamReportById(id);
    if (!current) throw new Error('RAM Raporu bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;

    this.db.prepare(`
      UPDATE ram_reports SET
        report_number = COALESCE(?, report_number),
        issue_date = COALESCE(?, issue_date),
        valid_until = COALESCE(?, valid_until),
        diagnosis_category = COALESCE(?, diagnosis_category),
        placement_decision = COALESCE(?, placement_decision),
        support_education_type = COALESCE(?, support_education_type),
        recommended_weekly_hours = COALESCE(?, recommended_weekly_hours),
        educational_evaluation = COALESCE(?, educational_evaluation),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.reportNumber, dto.issueDate, dto.validUntil, dto.diagnosisCategory,
      dto.placementDecision, dto.supportEducationType, dto.recommendedWeeklyHours,
      dto.educationalEvaluation, dto.status, dto.notes, now, newVersion, this.deviceId, id
    );

    const updated = this.getRamReportById(id);
    this.syncEngine.recordChange('ram_reports', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public deleteRamReport(id: string): boolean {
    const current = this.getRamReportById(id);
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE ram_reports SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('ram_reports', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public getRamReportById(id: string): any {
    return this.db.prepare(`
      SELECT r.*, s.first_name, s.last_name, s.student_number
      FROM ram_reports r
      LEFT JOIN students s ON r.student_id = s.id
      WHERE r.id = ? AND r.deleted_at IS NULL
    `).get(id);
  }

  public listRamReportsByStudent(studentId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM ram_reports WHERE student_id = ? AND deleted_at IS NULL ORDER BY issue_date DESC
    `).all(studentId);
  }

  public listAllRamReports(): any[] {
    return this.db.prepare(`
      SELECT r.*, s.first_name, s.last_name, s.student_number, c.name as class_name
      FROM ram_reports r
      JOIN students s ON r.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE r.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY r.issue_date DESC
    `).all();
  }

  // ==========================================
  // 2. BEP PLANLARI & KAZANIM TAKİBİ
  // ==========================================
  public createBepPlan(dto: BepPlanDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();
    const membersJson = dto.committeeMembers ? JSON.stringify(dto.committeeMembers) : null;
    const status = dto.status || 'active';

    this.db.prepare(`
      INSERT INTO bep_plans (
        id, student_id, school_year_id, ram_report_id, title, start_date, end_date,
        committee_members, general_performance_summary, accommodations, status,
        created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.studentId, dto.schoolYearId, dto.ramReportId || null, dto.title,
      dto.startDate, dto.endDate, membersJson, dto.generalPerformanceSummary,
      dto.accommodations || null, status, now, now, this.deviceId
    );

    const created = this.getBepPlanById(id);
    this.syncEngine.recordChange('bep_plans', id, 'create', 0, 1, null, JSON.stringify(created));
    logger.info(`Created BEP Plan ${dto.title} for student ${dto.studentId}`);
    return created;
  }

  public updateBepPlan(id: string, dto: Partial<BepPlanDto>): any {
    const current = this.getBepPlanById(id);
    if (!current) throw new Error('BEP Planı bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    const membersJson = dto.committeeMembers ? JSON.stringify(dto.committeeMembers) : undefined;

    this.db.prepare(`
      UPDATE bep_plans SET
        ram_report_id = COALESCE(?, ram_report_id),
        title = COALESCE(?, title),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        committee_members = COALESCE(?, committee_members),
        general_performance_summary = COALESCE(?, general_performance_summary),
        accommodations = COALESCE(?, accommodations),
        status = COALESCE(?, status),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.ramReportId, dto.title, dto.startDate, dto.endDate, membersJson,
      dto.generalPerformanceSummary, dto.accommodations, dto.status,
      now, newVersion, this.deviceId, id
    );

    const updated = this.getBepPlanById(id);
    this.syncEngine.recordChange('bep_plans', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public deleteBepPlan(id: string): boolean {
    const current = this.getBepPlanById(id);
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE bep_plans SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('bep_plans', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public getBepPlanById(id: string): any {
    const plan = this.db.prepare(`
      SELECT b.*, s.first_name, s.last_name, s.student_number, r.report_number, r.diagnosis_category
      FROM bep_plans b
      JOIN students s ON b.student_id = s.id
      LEFT JOIN ram_reports r ON b.ram_report_id = r.id
      WHERE b.id = ? AND b.deleted_at IS NULL
    `).get(id) as any;

    if (!plan) return null;
    if (plan.committee_members) {
      try { plan.committee_members = JSON.parse(plan.committee_members); } catch {}
    }

    plan.goals = this.listGoalsByPlanId(id);
    return plan;
  }

  public listBepPlansByStudent(studentId: string): any[] {
    const plans = this.db.prepare(`
      SELECT b.*, r.report_number, r.diagnosis_category
      FROM bep_plans b
      LEFT JOIN ram_reports r ON b.ram_report_id = r.id
      WHERE b.student_id = ? AND b.deleted_at IS NULL
      ORDER BY b.start_date DESC
    `).all(studentId) as any[];

    for (const plan of plans) {
      if (plan.committee_members) {
        try { plan.committee_members = JSON.parse(plan.committee_members); } catch {}
      }
      plan.goals = this.listGoalsByPlanId(plan.id);
    }
    return plans;
  }

  public listAllBepPlans(): any[] {
    const plans = this.db.prepare(`
      SELECT b.*, s.first_name, s.last_name, s.student_number, c.name as class_name, r.diagnosis_category
      FROM bep_plans b
      JOIN students s ON b.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN ram_reports r ON b.ram_report_id = r.id
      WHERE b.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY b.start_date DESC
    `).all() as any[];

    for (const plan of plans) {
      if (plan.committee_members) {
        try { plan.committee_members = JSON.parse(plan.committee_members); } catch {}
      }
      plan.goals = this.listGoalsByPlanId(plan.id);
    }
    return plans;
  }

  // ==========================================
  // BEP HEDEFLERİ & KAZANIM TAKİBİ
  // ==========================================
  public addBepGoal(dto: BepGoalDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();
    const criteria = dto.successCriteria || '%80 Doğrulukla';
    const method = dto.evaluationMethod || 'Gözlem ve Kontrol Listesi';
    const person = dto.responsiblePerson || 'Ders Öğretmeni';
    const status = dto.achievementStatus || 'not_started';

    this.db.prepare(`
      INSERT INTO bep_goals (
        id, bep_plan_id, student_id, lesson_name, long_term_goal, short_term_goal,
        target_date, success_criteria, evaluation_method, responsible_person,
        achievement_status, achievement_date, notes, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.bepPlanId, dto.studentId, dto.lessonName, dto.longTermGoal, dto.shortTermGoal,
      dto.targetDate || null, criteria, method, person, status, dto.achievementDate || null,
      dto.notes || null, now, now, this.deviceId
    );

    const created = this.db.prepare('SELECT * FROM bep_goals WHERE id = ?').get(id);
    this.syncEngine.recordChange('bep_goals', id, 'create', 0, 1, null, JSON.stringify(created));
    return created;
  }

  public updateBepGoal(id: string, dto: Partial<BepGoalDto>): any {
    const current = this.db.prepare('SELECT * FROM bep_goals WHERE id = ? AND deleted_at IS NULL').get(id) as any;
    if (!current) throw new Error('Kazanım hedefi bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;

    this.db.prepare(`
      UPDATE bep_goals SET
        lesson_name = COALESCE(?, lesson_name),
        long_term_goal = COALESCE(?, long_term_goal),
        short_term_goal = COALESCE(?, short_term_goal),
        target_date = COALESCE(?, target_date),
        success_criteria = COALESCE(?, success_criteria),
        evaluation_method = COALESCE(?, evaluation_method),
        responsible_person = COALESCE(?, responsible_person),
        achievement_status = COALESCE(?, achievement_status),
        achievement_date = COALESCE(?, achievement_date),
        notes = COALESCE(?, notes),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.lessonName, dto.longTermGoal, dto.shortTermGoal, dto.targetDate,
      dto.successCriteria, dto.evaluationMethod, dto.responsiblePerson,
      dto.achievementStatus, dto.achievementDate, dto.notes,
      now, newVersion, this.deviceId, id
    );

    const updated = this.db.prepare('SELECT * FROM bep_goals WHERE id = ?').get(id);
    this.syncEngine.recordChange('bep_goals', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public updateGoalStatus(id: string, status: 'not_started' | 'in_progress' | 'partially_achieved' | 'achieved' | 'not_achieved', notes?: string): any {
    const achievementDate = (status === 'achieved' || status === 'partially_achieved') ? new Date().toISOString().split('T')[0] : null;
    return this.updateBepGoal(id, { achievementStatus: status, achievementDate: achievementDate || undefined, notes });
  }

  public deleteBepGoal(id: string): boolean {
    const current = this.db.prepare('SELECT * FROM bep_goals WHERE id = ? AND deleted_at IS NULL').get(id) as any;
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE bep_goals SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('bep_goals', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public listGoalsByPlanId(bepPlanId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM bep_goals WHERE bep_plan_id = ? AND deleted_at IS NULL ORDER BY lesson_name, created_at
    `).all(bepPlanId);
  }

  public listGoalsByStudentId(studentId: string): any[] {
    return this.db.prepare(`
      SELECT g.*, b.title as plan_title
      FROM bep_goals g
      JOIN bep_plans b ON g.bep_plan_id = b.id
      WHERE g.student_id = ? AND g.deleted_at IS NULL AND b.deleted_at IS NULL
      ORDER BY g.lesson_name, g.created_at
    `).all(studentId);
  }

  // ==========================================
  // 3. BİP PLANLARI (DAVRANIŞ PLANLARI)
  // ==========================================
  public createBipPlan(dto: BipPlanDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();
    const status = dto.status || 'active';

    this.db.prepare(`
      INSERT INTO bip_plans (
        id, student_id, school_year_id, target_behavior, behavior_frequency_intensity,
        antecedents, consequences, replacement_behavior, intervention_strategies,
        crisis_plan, evaluation_schedule, status, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.studentId, dto.schoolYearId, dto.targetBehavior, dto.behaviorFrequencyIntensity,
      dto.antecedents, dto.consequences, dto.replacementBehavior, dto.interventionStrategies,
      dto.crisisPlan || null, dto.evaluationSchedule || null, status, now, now, this.deviceId
    );

    const created = this.getBipPlanById(id);
    this.syncEngine.recordChange('bip_plans', id, 'create', 0, 1, null, JSON.stringify(created));
    logger.info(`Created BİP Plan for student ${dto.studentId}: ${dto.targetBehavior}`);
    return created;
  }

  public updateBipPlan(id: string, dto: Partial<BipPlanDto>): any {
    const current = this.getBipPlanById(id);
    if (!current) throw new Error('BİP Planı bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;

    this.db.prepare(`
      UPDATE bip_plans SET
        target_behavior = COALESCE(?, target_behavior),
        behavior_frequency_intensity = COALESCE(?, behavior_frequency_intensity),
        antecedents = COALESCE(?, antecedents),
        consequences = COALESCE(?, consequences),
        replacement_behavior = COALESCE(?, replacement_behavior),
        intervention_strategies = COALESCE(?, intervention_strategies),
        crisis_plan = COALESCE(?, crisis_plan),
        evaluation_schedule = COALESCE(?, evaluation_schedule),
        status = COALESCE(?, status),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.targetBehavior, dto.behaviorFrequencyIntensity, dto.antecedents,
      dto.consequences, dto.replacementBehavior, dto.interventionStrategies,
      dto.crisisPlan, dto.evaluationSchedule, dto.status,
      now, newVersion, this.deviceId, id
    );

    const updated = this.getBipPlanById(id);
    this.syncEngine.recordChange('bip_plans', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public deleteBipPlan(id: string): boolean {
    const current = this.getBipPlanById(id);
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE bip_plans SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('bip_plans', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public getBipPlanById(id: string): any {
    return this.db.prepare(`
      SELECT p.*, s.first_name, s.last_name, s.student_number
      FROM bip_plans p
      JOIN students s ON p.student_id = s.id
      WHERE p.id = ? AND p.deleted_at IS NULL
    `).get(id);
  }

  public listBipPlansByStudent(studentId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM bip_plans WHERE student_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    `).all(studentId);
  }

  public listAllBipPlans(): any[] {
    return this.db.prepare(`
      SELECT p.*, s.first_name, s.last_name, s.student_number, c.name as class_name
      FROM bip_plans p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE p.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `).all();
  }

  // ==========================================
  // 4. DÖNEMSEL GELİŞİM DEĞERLENDİRMELERİ
  // ==========================================
  public createEvaluation(dto: DevelopmentEvaluationDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();

    this.db.prepare(`
      INSERT INTO development_evaluations (
        id, student_id, bep_plan_id, period_name, evaluation_date,
        academic_development, social_emotional_development, behavioral_development,
        recommendations, next_term_goals, evaluator_name,
        created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.studentId, dto.bepPlanId || null, dto.periodName, dto.evaluationDate,
      dto.academicDevelopment, dto.socialEmotionalDevelopment, dto.behavioralDevelopment,
      dto.recommendations, dto.nextTermGoals || null, dto.evaluatorName,
      now, now, this.deviceId
    );

    const created = this.getEvaluationById(id);
    this.syncEngine.recordChange('development_evaluations', id, 'create', 0, 1, null, JSON.stringify(created));
    return created;
  }

  public updateEvaluation(id: string, dto: Partial<DevelopmentEvaluationDto>): any {
    const current = this.getEvaluationById(id);
    if (!current) throw new Error('Gelişim değerlendirmesi bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;

    this.db.prepare(`
      UPDATE development_evaluations SET
        bep_plan_id = COALESCE(?, bep_plan_id),
        period_name = COALESCE(?, period_name),
        evaluation_date = COALESCE(?, evaluation_date),
        academic_development = COALESCE(?, academic_development),
        social_emotional_development = COALESCE(?, social_emotional_development),
        behavioral_development = COALESCE(?, behavioral_development),
        recommendations = COALESCE(?, recommendations),
        next_term_goals = COALESCE(?, next_term_goals),
        evaluator_name = COALESCE(?, evaluator_name),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.bepPlanId, dto.periodName, dto.evaluationDate, dto.academicDevelopment,
      dto.socialEmotionalDevelopment, dto.behavioralDevelopment, dto.recommendations,
      dto.nextTermGoals, dto.evaluatorName, now, newVersion, this.deviceId, id
    );

    const updated = this.getEvaluationById(id);
    this.syncEngine.recordChange('development_evaluations', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public deleteEvaluation(id: string): boolean {
    const current = this.getEvaluationById(id);
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE development_evaluations SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('development_evaluations', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public getEvaluationById(id: string): any {
    return this.db.prepare(`
      SELECT e.*, s.first_name, s.last_name, s.student_number, b.title as bep_plan_title
      FROM development_evaluations e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN bep_plans b ON e.bep_plan_id = b.id
      WHERE e.id = ? AND e.deleted_at IS NULL
    `).get(id);
  }

  public listEvaluationsByStudent(studentId: string): any[] {
    return this.db.prepare(`
      SELECT e.*, b.title as bep_plan_title
      FROM development_evaluations e
      LEFT JOIN bep_plans b ON e.bep_plan_id = b.id
      WHERE e.student_id = ? AND e.deleted_at IS NULL
      ORDER BY e.evaluation_date DESC
    `).all(studentId);
  }

  public listAllEvaluations(): any[] {
    return this.db.prepare(`
      SELECT e.*, s.first_name, s.last_name, s.student_number, c.name as class_name, b.title as bep_plan_title
      FROM development_evaluations e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN bep_plans b ON e.bep_plan_id = b.id
      WHERE e.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY e.evaluation_date DESC
    `).all();
  }

  // ==========================================
  // 5. RAM YÖNLENDİRME & SÜREÇ TAKİBİ
  // ==========================================
  public createReferral(dto: RamReferralDto): any {
    const id = dto.id || uuidv4();
    const now = Date.now();
    const type = dto.referralType || 'yeniden_inceleme';
    const status = dto.resultStatus || 'pending';

    this.db.prepare(`
      INSERT INTO ram_referrals (
        id, student_id, school_year_id, referral_reason, referral_type, referral_date,
        school_report_summary, committee_decision_date, dispatch_date, appointment_date,
        result_status, result_notes, created_at, updated_at, version, last_modified_device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, dto.studentId, dto.schoolYearId, dto.referralReason, type, dto.referralDate,
      dto.schoolReportSummary, dto.committeeDecisionDate || null, dto.dispatchDate || null,
      dto.appointmentDate || null, status, dto.resultNotes || null, now, now, this.deviceId
    );

    const created = this.getReferralById(id);
    this.syncEngine.recordChange('ram_referrals', id, 'create', 0, 1, null, JSON.stringify(created));
    return created;
  }

  public updateReferral(id: string, dto: Partial<RamReferralDto>): any {
    const current = this.getReferralById(id);
    if (!current) throw new Error('RAM Yönlendirme kaydı bulunamadı');

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;

    this.db.prepare(`
      UPDATE ram_referrals SET
        referral_reason = COALESCE(?, referral_reason),
        referral_type = COALESCE(?, referral_type),
        referral_date = COALESCE(?, referral_date),
        school_report_summary = COALESCE(?, school_report_summary),
        committee_decision_date = COALESCE(?, committee_decision_date),
        dispatch_date = COALESCE(?, dispatch_date),
        appointment_date = COALESCE(?, appointment_date),
        result_status = COALESCE(?, result_status),
        result_notes = COALESCE(?, result_notes),
        updated_at = ?,
        version = ?,
        last_modified_device_id = ?
      WHERE id = ?
    `).run(
      dto.referralReason, dto.referralType, dto.referralDate, dto.schoolReportSummary,
      dto.committeeDecisionDate, dto.dispatchDate, dto.appointmentDate,
      dto.resultStatus, dto.resultNotes, now, newVersion, this.deviceId, id
    );

    const updated = this.getReferralById(id);
    this.syncEngine.recordChange('ram_referrals', id, 'update', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify(updated));
    return updated;
  }

  public updateReferralStatus(id: string, status: 'pending' | 'evaluated' | 'report_issued' | 'rejected' | 'canceled', resultNotes?: string): any {
    return this.updateReferral(id, { resultStatus: status, resultNotes });
  }

  public deleteReferral(id: string): boolean {
    const current = this.getReferralById(id);
    if (!current) return false;

    const now = Date.now();
    const newVersion = (current.version || 1) + 1;
    this.db.prepare('UPDATE ram_referrals SET deleted_at = ?, updated_at = ?, version = ?, last_modified_device_id = ? WHERE id = ?')
      .run(now, now, newVersion, this.deviceId, id);

    this.syncEngine.recordChange('ram_referrals', id, 'delete', current.version || 1, newVersion, JSON.stringify(current), JSON.stringify({ id, deleted_at: now }));
    return true;
  }

  public getReferralById(id: string): any {
    return this.db.prepare(`
      SELECT ref.*, s.first_name, s.last_name, s.student_number, c.name as class_name
      FROM ram_referrals ref
      JOIN students s ON ref.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE ref.id = ? AND ref.deleted_at IS NULL
    `).get(id);
  }

  public listReferralsByStudent(studentId: string): any[] {
    return this.db.prepare(`
      SELECT * FROM ram_referrals WHERE student_id = ? AND deleted_at IS NULL ORDER BY referral_date DESC
    `).all(studentId);
  }

  public listAllReferrals(): any[] {
    return this.db.prepare(`
      SELECT ref.*, s.first_name, s.last_name, s.student_number, c.name as class_name
      FROM ram_referrals ref
      JOIN students s ON ref.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE ref.deleted_at IS NULL AND s.deleted_at IS NULL
      ORDER BY ref.referral_date DESC
    `).all();
  }
}
