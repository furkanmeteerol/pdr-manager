export interface SystemStatus {
  appVersion: string;
  isLocked: boolean;
  hasMasterKey: boolean;
  deviceId: string;
  deviceName: string;
  activeSchoolYearId: string | null;
  schoolName: string;
  counselorName: string;
  academicYear: string;
  databasePath: string;
  isOnline: boolean;
}

export interface SyncStatus {
  state: 'synced' | 'pending' | 'syncing' | 'offline' | 'conflict' | 'error';
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError: string | null;
  conflictCount: number;
}

export interface SetupWizardPayload {
  schoolName: string;
  counselorName: string;
  academicYear: string;
  masterRecoveryPassphrase: string;
  localPassword: string;
}

export interface UnlockPayload {
  password: string;
}

// --- Institutional DTOs ---
export interface SchoolYearDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isArchived: boolean;
}

export interface ClassDto {
  id: string;
  schoolYearId: string;
  name: string;
  grade: number;
  branch: string;
  teacherName?: string;
  pdfPath?: string;
  pdfName?: string;
  pdfUploadedAt?: number;
  pdfUploadDate?: string;
  pdfUploadTime?: string;
  maleCount?: number;
  femaleCount?: number;
  totalCount?: number;
}

export interface CounselingActivityDto {
  id: string;
  schoolYearId: string;
  type?: 'activity' | 'meeting';
  title: string;
  description?: string;
  classIds: string[];
  classNames: string;
  activityDate: string;
  activityTime?: string;
  participantCount: number;
  notes?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface StudyPlanTemplateDto {
  id: string;
  name: string;
  title?: string;
  features?: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  settings?: {
    includeHours?: boolean;
    pomodoro?: boolean;
    generalReview?: boolean;
    tomorrowPrep?: boolean;
    bookReading?: boolean;
  };
  weeklySchedule?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  createdAt: number;
  updatedAt?: number;
}

export interface PreparedStudyPlanDto {
  id: string;
  index: number;
  studentId: string;
  studentNumber: string;
  studentName: string;
  className: string;
  templateId?: string | null;
  templateNameSnapshot: string;
  featuresSnapshot: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  title: string;
  startDate: string;
  endDate: string;
  dateFormatted: string;
  notes?: string;
  createdAt: number;
}

export interface OfficialDocumentDto {
  id: string;
  title: string;
  category: string;
  educationalStage: 'all' | 'preschool' | 'primary' | 'middle' | 'high';
  format: 'PDF' | 'DOCX' | 'XLSX';
  description: string;
  fileSize: string;
}

// --- Student, Parent, Teacher DTOs ---
export interface ParentDto {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  occupation?: string;
  address?: string;
  notes?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface TeacherDto {
  id: string;
  firstName: string;
  lastName: string;
  branch: string;
  phone?: string;
  email?: string;
  notes?: string;
  relationship?: string;
}

export interface StudentDto {
  id: string;
  schoolYearId: string;
  classId: string | null;
  className?: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender: 'male' | 'female' | 'other';
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  avatarPath?: string;
  notes?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  parents?: ParentDto[];
  teachers?: TeacherDto[];
  meetingCount?: number;
  lastMeetingDate?: string;
  hasFollowUp?: boolean;
}

// --- Meeting DTOs ---
export interface MeetingTagDto {
  id: string;
  name: string;
}

export interface MeetingDto {
  id: string;
  schoolYearId: string;
  studentId: string | null;
  studentIds?: string[];
  studentName?: string;
  studentNumber?: string;
  className?: string;
  meetingType: 'student' | 'parent' | 'teacher' | 'discipline' | 'group_guidance' | 'other' | string;
  guidanceServiceType?: string;
  mebbisProcessed?: boolean;
  date: string;
  startTime: string;
  endTime?: string;
  duration: number;
  subject: string;
  summary: string;
  notes: string;
  decisions?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  meetingTopic?: string;
  meetingTopicOther?: string;
  activityType?: string;
  activityTypeOther?: string;
  referralInstitutions?: string[];
  referralOther?: string;
  participantType?: 'student' | 'parent' | 'teacher' | 'group' | string;
  parentRelation?: string;
  teacherName?: string;
  teacherBranch?: string;
  sessionNumber?: number;
  plannedSessions?: number;
  participants?: { id: string; firstName: string; lastName: string; studentNumber: string; className?: string }[];
  tags?: MeetingTagDto[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

// --- Appointment DTOs ---
export interface AppointmentDto {
  id: string;
  schoolYearId: string;
  studentId: string | null;
  studentIds?: string[];
  studentName?: string;
  studentNumber?: string;
  relatedMeetingId?: string;
  title: string;
  appointmentType?: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  status: 'scheduled' | 'pending' | 'completed' | 'student_absent' | 'other' | 'cancelled' | 'no_show';
  resultNote?: string;
  reminderMinutes: number;
  notificationSent: boolean;
  participants?: { id: string; firstName: string; lastName: string; studentNumber: string; className?: string }[];
  participantCount?: number;
  version: number;
  createdAt: number;
  updatedAt: number;
}

// --- Daily Note DTOs (Anasayfa Günlük Notlar) ---
export interface DailyNoteDto {
  id: string;
  schoolYearId?: string | null;
  noteDate: string;
  content: string;
  completed: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

// --- Task & Reminder DTOs ---
export interface TaskDto {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  studentId?: string | null;
  studentName?: string;
  completed: boolean;
  completedAt?: number | null;
  isOverdue?: boolean;
  version: number;
  createdAt: number;
  updatedAt: number;
}

// --- Global Search Result ---
export interface SearchResultItem {
  id: string;
  type: 'student' | 'meeting' | 'appointment' | 'task' | 'survey' | 'exam';
  title: string;
  subtitle: string;
  badge?: string;
  studentId?: string;
}

// --- Dashboard Summary DTO ---
export interface DashboardSummary {
  totalStudents: number;
  totalMeetings: number;
  todayAppointmentsCount: number;
  overdueTasksCount: number;
  followUpStudentsCount: number;
  activeSurveysCount?: number;
  todayAppointments: AppointmentDto[];
  upcomingTasks: TaskDto[];
  recentMeetings: MeetingDto[];
}

// ==========================================
// PHASE V2 DTOs
// ==========================================

// --- Survey & Inventory Engine DTOs ---
export interface SurveyOptionDto {
  id: string;
  questionId: string;
  optionOrder: number;
  optionText: string;
  optionLabel?: string;
  optionValue?: string;
  score: number;
  scoreValue?: number;
  reverseScoreValue?: number;
}

export interface SurveyQuestionDto {
  id: string;
  surveyId?: string;
  surveyVersionId?: string;
  questionOrder: number;
  questionText: string;
  questionType: 'single_choice' | 'multi_choice' | 'likert_5' | 'likert_4' | 'yes_no' | 'numeric' | 'text';
  category?: string;
  subscaleId?: string;
  isReverseScored?: boolean;
  required: boolean;
  helpText?: string;
  options: SurveyOptionDto[];
}

export interface SurveySubscaleDto {
  id: string;
  surveyVersionId: string;
  code: string;
  title: string;
  description?: string;
  calculationMethod: 'SUM' | 'AVERAGE' | 'PERCENTAGE';
  orderIndex: number;
}

export interface SurveyInterpretationDto {
  id: string;
  surveyVersionId: string;
  subscaleId?: string | null;
  minScore: number;
  maxScore: number;
  label: string;
  description?: string;
  colorCode?: string;
}

export interface SurveyQuestionStatDto {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  category?: string;
  responseCount: number;
  averageScore?: number;
  optionDistribution?: Record<string, number>;
  textResponses?: string[];
}

export interface SurveyAnalyticsDto {
  surveyId: string;
  title: string;
  targetMode: 'student_linked' | 'anonymous_aggregated';
  totalRespondents: number;
  overallAverageScore?: number;
  categoryAverages?: Record<string, { totalScore: number; count: number; average: number }>;
  questionStats: SurveyQuestionStatDto[];
}

export interface SurveyResultPresentationConfig {
  rendererType?: string;
  options?: {
    showTotalScore?: boolean;
    scoreDisplayFormat?: 'average' | 'sum' | 'percentage';
    scoreRangeMin?: number;
    scoreRangeMax?: number;
    showQuestionRangesInSubscales?: boolean;
    openEndedQuestionOrder?: number;
    highlightHighestSubscales?: boolean;
    [key: string]: any;
  };
}

export interface SurveyVersionDto {
  id: string;
  surveyId: string;
  versionNumber: number;
  titleSnapshot: string;
  descriptionSnapshot?: string;
  scoringType: 'SUM' | 'AVERAGE' | 'SUBSCALES' | 'CUSTOM';
  isPublished: boolean;
  publishedAt: number;
  createdAt: number;
  questions?: SurveyQuestionDto[];
  subscales?: SurveySubscaleDto[];
  interpretations?: SurveyInterpretationDto[];
  resultPresentation?: SurveyResultPresentationConfig;
}

export interface SurveyDto {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  type?: 'SURVEY' | 'INVENTORY' | 'SCALE';
  repeatPolicy?: 'UNLIMITED' | 'ONCE' | 'YEARLY';
  isActive?: boolean;
  currentVersionNumber?: number;
  targetMode?: 'student_linked' | 'anonymous_aggregated';
  surveyVersion?: number;
  status: 'draft' | 'active' | 'archived';
  estimatedMinutes?: number;
  scoringMethod?: 'sum' | 'average' | 'categories' | 'none';
  questions?: SurveyQuestionDto[];
  currentVersion?: SurveyVersionDto;
  versions?: SurveyVersionDto[];
  assignmentCount?: number;
  completedCount?: number;
  applicationCount?: number;
  publicUrl?: string;
  resultPresentation?: SurveyResultPresentationConfig;
  createdAt: number;
  updatedAt: number;
}

export interface SurveyResultSnapshotDto {
  totalScore: number;
  maxPossibleScore?: number;
  subscales?: Array<{
    code: string;
    title: string;
    score: number;
    maxScore?: number;
    percentage?: number;
    interpretation?: string;
    questionCount?: number;
    averageScore?: number;
  }>;
  interpretation?: {
    label: string;
    description?: string;
    colorCode?: string;
  };
  resultPresentation?: SurveyResultPresentationConfig;
  rawMetrics?: Record<string, any>;
  versionSnapshot: number;
  calculatedAt: number;
  burdonEvaluation?: any;
  automaticThoughtsEvaluation?: any;
  basarisizlikEvaluation?: any;
  calismaDavranisiEvaluation?: any;
  ptlEvaluation?: any;
  rosenbergEvaluation?: any;
  kgbnEvaluation?: any;
  abaoEvaluation?: any;
  meslekDegeriEvaluation?: any;
  hollandKisaEvaluation?: any;
  hollandEvaluation?: any;
  [key: string]: any;
}

export interface SurveyAnswerDto {
  id?: string;
  questionId: string;
  questionOrder?: number;
  questionText?: string;
  selectedOptionId?: string;
  selectedOptionLabel?: string;
  answerValue?: string;
  answerScore?: number;
  isReverseScored?: boolean;
  subscaleCode?: string;
}

export interface SurveyApplicationDto {
  id: string;
  surveyId: string;
  surveySlug?: string;
  surveyTitle: string;
  surveyType?: 'SURVEY' | 'INVENTORY' | 'SCALE';
  surveyVersionId: string;
  surveyVersionNumber: number;
  studentId: string;
  studentNumber: string;
  studentName: string;
  className?: string;
  schoolYearId?: string;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  source: string;
  startedAt?: number;
  completedAt: number;
  totalScore?: number;
  resultSnapshot?: SurveyResultSnapshotDto | null;
  answers?: SurveyAnswerDto[];
  createdAt: number;
}

export interface SurveySubmitApplicationPayload {
  surveySlug: string;
  studentNumber: string;
  answers: Array<{
    questionId: string;
    selectedOptionId?: string;
    answerValue?: string;
  }>;
  source?: string;
}

export interface SurveyAssignmentDto {
  id: string;
  surveyId: string;
  surveyTitle: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  assignmentRef: string; // 'PDR-XXXXXX'
  assignedAt: number;
  dueDate?: string;
  status: 'assigned' | 'started' | 'completed' | 'expired';
  startedAt?: number;
  completedAt?: number;
}

export interface SurveyResponseAnswerDto {
  questionId: string;
  selectedOptionId?: string;
  selectedOptionText?: string;
  score?: number;
  textValue?: string;
  numberValue?: number;
}

export interface SurveyResponseDto {
  id: string;
  assignmentId?: string;
  studentId?: string;
  studentName?: string;
  studentNumber?: string;
  respondentName?: string;
  respondentStudentNumber?: string;
  respondentEmail?: string;
  matchStatus?: 'matched' | 'mismatch_rejected' | 'unmatched_pending' | 'anonymous';
  mismatchReason?: string;
  surveyId: string;
  surveyTitle: string;
  source: 'local' | 'student_kiosk' | 'google_forms' | 'offline_import' | 'offline_package';
  startedAt?: number;
  completedAt: number;
  totalScore?: number;
  resultSummary?: string;
  categoryScores?: Record<string, number>;
  answers?: SurveyResponseAnswerDto[];
}

export interface SurveySubmitPayload {
  assignmentId?: string;
  assignmentRef?: string;
  studentId?: string;
  respondentName?: string;
  respondentStudentNumber?: string;
  respondentEmail?: string;
  matchStatus?: 'matched' | 'mismatch_rejected' | 'unmatched_pending' | 'anonymous';
  mismatchReason?: string;
  surveyId: string;
  source: 'local' | 'student_kiosk' | 'google_forms' | 'offline_import' | 'offline_package';
  answers: Array<{
    questionId: string;
    selectedOptionId?: string;
    textValue?: string;
    numberValue?: number;
  }>;
}

// --- Academic Performance & Exam DTOs ---
export interface SubjectDto {
  id: string;
  name: string;
  examType: 'TYT' | 'AYT' | 'LGS' | 'CUSTOM';
  category: string;
  questionCount: number;
}

export interface ExamResultItemDto {
  subjectId: string;
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  score: number;
}

export interface ExamDto {
  id: string;
  schoolYearId: string;
  name: string;
  examType: 'TYT' | 'AYT' | 'LGS' | 'CUSTOM';
  date: string;
  description?: string;
  netCalculationFormula: string;
  participantCount?: number;
  averageNet?: number;
  createdAt: number;
}

export interface ExamResultDto {
  id: string;
  examId: string;
  examName: string;
  examType: string;
  examDate: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  totalNet: number;
  totalScore: number;
  rank?: number;
  items: ExamResultItemDto[];
  createdAt: number;
}

export interface StudentTargetDto {
  id: string;
  studentId: string;
  studentName?: string;
  targetType: 'net' | 'score' | 'rank' | 'school' | 'habit';
  title: string;
  description?: string;
  targetValue: string;
  unit?: string;
  targetDate?: string;
  status: 'in_progress' | 'achieved' | 'missed';
  currentValue?: string;
  progressPercent?: number;
  createdAt: number;
}

export interface StudyPlanItemDto {
  id: string;
  studyPlanId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  subject: string;
  topic: string;
  plannedQuestions: number;
  completedQuestions: number;
  status: 'pending' | 'completed' | 'missed';
  notes?: string;
}

export interface StudyPlanDto {
  id: string;
  studentId: string;
  studentName?: string;
  title: string;
  startDate: string;
  endDate: string;
  notes?: string;
  items?: StudyPlanItemDto[];
  completionRate?: number;
  createdAt: number;
}

export interface QuestionTrackingDto {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  subjectId: string;
  subjectName: string;
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  net: number;
  notes?: string;
  createdAt: number;
}

// --- Agenda DTOs (Ajanda Notları / Toplantılar) ---
export interface AgendaItemDto {
  id: string;
  schoolYearId?: string | null;
  title: string;
  agendaDate: string; // 'YYYY-MM-DD'
  startTime?: string | null; // 'HH:MM'
  completed: boolean;
  notes?: string | null;
  version: number;
  createdAt: number;
  updatedAt: number;
}

// --- Annual Guidance Plan DTOs ---
export interface AnnualPlanItemDto {
  id: string;
  annualPlanId: string;
  plannedDate: string; // 'YYYY-MM-DD'
  startDate?: string | null; // 'YYYY-MM-DD'
  endDate?: string | null; // 'YYYY-MM-DD'
  activityType?: string | null; // Seminer, Konferans, vb.
  category: string; // 'Gelişimsel', 'Önleyici', 'İyileştirici', 'Kariyer', vb.
  title: string;
  description?: string;
  targetAudience?: string; // 12. Sınıflar, Veli, vb.
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: number;
  notes?: string;
}

export interface AnnualPlanDto {
  id: string;
  schoolYearId: string;
  title: string;
  description?: string;
  items?: AnnualPlanItemDto[];
  createdAt: number;
  updatedAt: number;
}

export interface DataTransferManifest {
  formatVersion: number;
  schemaVersion: number;
  applicationVersion: string;
  exportedAt: string;
  exportedAtTimestamp: number;
  deviceId: string;
  databaseChecksum: string;
  counts: {
    students: number;
    parents: number;
    classes: number;
    meetings: number;
    appointments: number;
    tasks: number;
    surveyApplications: number;
    surveys: number;
    dailyNotes: number;
    activities: number;
  };
}

export interface BackupComparisonResultDto {
  isValid: boolean;
  filePath: string;
  fileName: string;
  manifest?: DataTransferManifest;
  comparison?: {
    incoming: Record<string, number>;
    current: Record<string, number>;
    diff: Record<string, { incoming: number; current: number; delta: number; isHigher: boolean }>;
  };
  schemaCompatible: boolean;
  error?: string;
  canceled?: boolean;
}

export interface ImportResultDto {
  success: boolean;
  restoredAt: number;
  preImportBackupPath?: string;
  error?: string;
}

export interface ResetResultDto {
  success: boolean;
  preResetBackupPath?: string;
  error?: string;
}

// --- Student Mode Kiosk State ---
export interface StudentModeState {
  active: boolean;
  assignmentRef?: string;
  surveyId?: string;
  studentId?: string;
  studentName?: string;
  surveyTitle?: string;
}

// ==========================================
// PHASE V3 DTOs
// ==========================================

export interface RamReportDto {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
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
  createdAt?: number;
  updatedAt?: number;
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
  createdAt?: number;
  updatedAt?: number;
}

export interface BepPlanDto {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  schoolYearId: string;
  ramReportId?: string;
  reportNumber?: string;
  diagnosisCategory?: string;
  title: string;
  startDate: string;
  endDate: string;
  committeeMembers?: Array<{ role: string; name: string; title?: string }>;
  generalPerformanceSummary: string;
  accommodations?: string;
  status?: 'active' | 'completed' | 'archived';
  goals?: BepGoalDto[];
  createdAt?: number;
  updatedAt?: number;
}

export interface BipPlanDto {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
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
  createdAt?: number;
  updatedAt?: number;
}

export interface DevelopmentEvaluationDto {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
  bepPlanId?: string;
  bepPlanTitle?: string;
  periodName: string;
  evaluationDate: string;
  academicDevelopment: string;
  socialEmotionalDevelopment: string;
  behavioralDevelopment: string;
  recommendations: string;
  nextTermGoals?: string;
  evaluatorName: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface RamReferralDto {
  id?: string;
  studentId: string;
  studentName?: string;
  studentNumber?: string;
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
  createdAt?: number;
  updatedAt?: number;
}

export interface CounselorDocumentDto {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  uploadDate: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface PresentationDto {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  slideCount?: number | null;
  uploadDate: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface PresentationContentDto {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileType: 'pptx' | 'pdf' | 'other';
  fileSizeFormatted: string;
  slideCount: number;
  contentBase64?: string;
  pdfBase64?: string;
  isConvertedFromPptx?: boolean;
  error?: string;
}

export interface DocumentPreviewDto {
  id: string;
  title: string;
  fileName: string;
  fileSizeFormatted: string;
  mimeType: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'image' | 'xlsx' | 'other';
  contentBase64?: string;
  htmlContent?: string;
  docWarning?: string;
  error?: string;
}

export interface FullSyncResult {
  success: boolean;
  timestamp: number;
  summary: string;
}

// ==========================================
// FULL ELECTRON API INTERFACE
// ==========================================
export interface ElectronApi {
  system: {
    getStatus: () => Promise<SystemStatus>;
    unlock: (payload: UnlockPayload) => Promise<{ success: boolean; error?: string }>;
    lock: () => Promise<void>;
    completeWizard: (payload: SetupWizardPayload) => Promise<{ success: boolean; error?: string }>;
    changePassword: (payload: { masterKey: string; newPassword: string }) => Promise<{ success: boolean; error?: string }>;
    getDeviceId: () => Promise<string>;
    getDashboardSummary: () => Promise<DashboardSummary>;
  };
  water?: {
    getTodayCount: () => Promise<number>;
    setTodayCount: (count: number) => Promise<number>;
  };
  sync: {
    getStatus: () => Promise<SyncStatus>;
    triggerSync: () => Promise<FullSyncResult>;
    executeFullSync: () => Promise<FullSyncResult>;
    getConflicts: () => Promise<any[]>;
    resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge', mergedData?: any) => Promise<boolean>;
  };
  schools: {
    getClasses: (schoolYearId?: string) => Promise<ClassDto[]>;
    createClass: (data: { schoolYearId: string; name: string; grade: number; branch: string; teacherName?: string; pdfPath?: string; pdfName?: string }) => Promise<ClassDto>;
    updateClass: (id: string, data: Partial<ClassDto>) => Promise<ClassDto>;
    deleteClass: (id: string) => Promise<boolean>;
    saveClassPdf: (classId: string, fileName: string, fileBase64: string) => Promise<{ success: boolean; pdfPath: string; pdfName: string }>;
    deleteClassPdf: (classId: string) => Promise<{ success: boolean }>;
    openClassPdf: (classId: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  },
  activities: {
    list: (schoolYearId?: string) => Promise<CounselingActivityDto[]>;
    create: (data: { schoolYearId: string; type?: 'activity' | 'meeting'; title: string; description?: string; classIds?: string[]; classNames?: string; activityDate: string; activityTime?: string; participantCount?: number; notes?: string }) => Promise<CounselingActivityDto>;
    update: (id: string, data: Partial<CounselingActivityDto>) => Promise<CounselingActivityDto>;
    delete: (id: string) => Promise<boolean>;
  },
  studyPrograms: {
    listPlans: (schoolYearId?: string) => Promise<PreparedStudyPlanDto[]>;
    createPlan: (data: {
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
    }) => Promise<{ id: string; success: boolean }>;
    deletePlan: (id: string) => Promise<boolean>;
    listTemplates: () => Promise<StudyPlanTemplateDto[]>;
    saveTemplate: (data: {
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
    }) => Promise<StudyPlanTemplateDto>;
    deleteTemplate: (id: string) => Promise<boolean>;
  },
  documents: {
    list: (search?: string) => Promise<CounselorDocumentDto[]>;
    create: (data: {
      title: string;
      description?: string;
      fileName: string;
      fileBase64: string;
      mimeType: string;
      fileSize: number;
    }) => Promise<CounselorDocumentDto>;
    delete: (id: string) => Promise<boolean>;
    getFileData: (id: string) => Promise<{ fileName: string; mimeType: string; contentBase64: string } | null>;
    getPreviewData: (id: string) => Promise<DocumentPreviewDto>;
    download: (id: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  },
  presentations: {
    list: (search?: string) => Promise<PresentationDto[]>;
    getById: (id: string) => Promise<PresentationDto | null>;
    getContent: (id: string) => Promise<PresentationContentDto>;
    create: (data: {
      title: string;
      description?: string;
      fileName: string;
      fileBase64: string;
      mimeType: string;
      fileSize: number;
      slideCount?: number;
    }) => Promise<PresentationDto>;
    delete: (id: string) => Promise<boolean>;
    download: (id: string) => Promise<{ success: boolean; canceled?: boolean; filePath?: string; error?: string }>;
  },
  students: {
    list: (filter?: { schoolYearId?: string; classId?: string; search?: string; status?: string }) => Promise<StudentDto[]>;
    getById: (id: string) => Promise<StudentDto | null>;
    create: (data: {
      schoolYearId: string;
      classId?: string | null;
      studentNumber: string;
      firstName: string;
      lastName: string;
      birthDate?: string;
      gender: 'male' | 'female' | 'other';
      phone?: string;
      email?: string;
      status?: 'active' | 'inactive' | 'graduated' | 'transferred';
      notes?: string;
      parents?: Array<{ firstName: string; lastName: string; phone?: string; relationship: string; isPrimary?: boolean }>;
    }) => Promise<StudentDto>;
    update: (id: string, data: Partial<StudentDto>) => Promise<StudentDto>;
    softDelete: (id: string) => Promise<boolean>;
  };
  meetings: {
    list: (filter?: { studentId?: string; meetingType?: string; dateFrom?: string; dateTo?: string; followUpOnly?: boolean }) => Promise<MeetingDto[]>;
    getById: (id: string) => Promise<MeetingDto | null>;
    create: (data: {
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
    }) => Promise<MeetingDto>;
    update: (id: string, data: Partial<MeetingDto> & { tagNames?: string[] }) => Promise<MeetingDto>;
    setMebbisStatus: (id: string, isProcessed: boolean) => Promise<boolean>;
    softDelete: (id: string) => Promise<boolean>;
    getTags: () => Promise<MeetingTagDto[]>;
  };
  appointments: {
    list: (filter?: { date?: string; status?: string; studentId?: string }) => Promise<AppointmentDto[]>;
    create: (data: {
      schoolYearId: string;
      studentId?: string | null;
      studentIds?: string[];
      appointmentType?: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      notes?: string;
      reminderMinutes?: number;
    }) => Promise<AppointmentDto>;
    updateStatus: (id: string, status: 'scheduled' | 'pending' | 'completed' | 'student_absent' | 'other' | 'cancelled' | 'no_show', resultNote?: string) => Promise<AppointmentDto>;
    softDelete: (id: string) => Promise<boolean>;
  };
  tasks: {
    list: (filter?: { completed?: boolean; studentId?: string; priority?: string }) => Promise<TaskDto[]>;
    create: (data: {
      title: string;
      description?: string;
      dueDate?: string;
      dueTime?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      category?: string;
      studentId?: string | null;
    }) => Promise<TaskDto>;
    toggleComplete: (id: string, completed: boolean) => Promise<TaskDto>;
    softDelete: (id: string) => Promise<boolean>;
  };
  dailyNotes: {
    listByDate: (noteDate: string) => Promise<DailyNoteDto[]>;
    create: (data: { schoolYearId?: string | null; noteDate: string; content: string }) => Promise<DailyNoteDto>;
    update: (id: string, content: string) => Promise<DailyNoteDto>;
    toggleComplete: (id: string, completed: boolean) => Promise<DailyNoteDto>;
    delete: (id: string) => Promise<boolean>;
  };
  search: {
    query: (searchTerm: string) => Promise<SearchResultItem[]>;
  };
  surveys: {
    list: () => Promise<SurveyDto[]>;
    getById: (id: string) => Promise<SurveyDto | null>;
    getBySlug: (slug: string) => Promise<SurveyDto | null>;
    listApplications: (filter?: { surveyId?: string; studentId?: string }) => Promise<SurveyApplicationDto[]>;
    getApplicationDetail: (id: string) => Promise<SurveyApplicationDto | null>;
    submitApplication: (payload: SurveySubmitApplicationPayload) => Promise<{ success: boolean; application?: SurveyApplicationDto; error?: string }>;
    validateStudentForSurvey: (surveySlug: string, studentNumber: string) => Promise<{ valid: boolean; studentName?: string; studentId?: string; error?: string; canAttempt?: boolean; currentAttemptCount?: number }>;
    toggleSurveyActive: (surveyId: string, isActive: boolean) => Promise<boolean>;
    getAnalytics: (surveyId: string) => Promise<SurveyAnalyticsDto | null>;
    create: (data: {
      title: string;
      description?: string;
      targetMode?: 'student_linked' | 'anonymous_aggregated';
      estimatedMinutes?: number;
      scoringMethod?: 'sum' | 'average' | 'categories' | 'none';
      questions: Array<{
        questionText: string;
        questionType: 'single_choice' | 'multi_choice' | 'likert_5' | 'text' | 'number';
        category?: string;
        required?: boolean;
        helpText?: string;
        options?: Array<{ optionText: string; score: number }>;
      }>;
    }) => Promise<SurveyDto>;
    assign: (data: { surveyId: string; studentIds: string[]; dueDate?: string }) => Promise<SurveyAssignmentDto[]>;
    listAssignments: (filter?: { surveyId?: string; studentId?: string; status?: string }) => Promise<SurveyAssignmentDto[]>;
    getAssignmentByRef: (assignmentRef: string) => Promise<{ assignment: SurveyAssignmentDto; survey: SurveyDto; student: StudentDto } | null>;
    submitResponse: (payload: SurveySubmitPayload) => Promise<SurveyResponseDto>;
    listResponses: (filter?: { surveyId?: string; studentId?: string }) => Promise<SurveyResponseDto[]>;
    generateOfflinePackageHtml: (surveyId: string, passphrase?: string) => Promise<{ success: boolean; html?: string; error?: string }>;
    importOfflineResult: (encryptedPayload: string, passphrase?: string) => Promise<{ success: boolean; studentMatched?: boolean; studentName?: string; studentNumber?: string; totalScore?: number; error?: string }>;
    exportPdfReport: (applicationId: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
    getReportHtml: (applicationId: string) => Promise<{ success: boolean; html?: string; error?: string }>;
    exportPaperFormPdf: (surveySlugOrId: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
    getPaperFormHtml: (surveySlugOrId: string) => Promise<{ success: boolean; html?: string; error?: string }>;
  };
  dataTransfer: {
    exportPackage: (password?: string) => Promise<{ success: boolean; filePath?: string; manifest?: any; canceled?: boolean; error?: string }>;
    selectBackupFile: () => Promise<{ canceled: boolean; filePath: string; error?: string }>;
    inspectPackage: (filePath: string, password?: string) => Promise<BackupComparisonResultDto>;
    importPackage: (filePath: string, password?: string) => Promise<{ success: boolean; restoredAt: number; preImportBackupPath?: string; error?: string }>;
    resetDatabase: (masterPassword?: string) => Promise<{ success: boolean; preResetBackupPath?: string; error?: string }>;
    getCurrentCounts: () => Promise<Record<string, number>>;
    getLastBackupInfo: () => Promise<{ lastBackupTimestamp: number | null; lastBackupDateStr: string | null }>;
  };
  studentMode: {
    enter: (assignmentRef: string) => Promise<{ success: boolean; data?: { assignment: SurveyAssignmentDto; survey: SurveyDto; student: StudentDto }; error?: string }>;
    exit: (password: string) => Promise<{ success: boolean; error?: string }>;
    getState: () => Promise<StudentModeState>;
  };
  exams: {
    list: () => Promise<ExamDto[]>;
    getById: (id: string) => Promise<ExamDto | null>;
    create: (data: {
      schoolYearId: string;
      name: string;
      examType: 'TYT' | 'AYT' | 'LGS' | 'CUSTOM';
      date: string;
      description?: string;
      netCalculationFormula?: string;
    }) => Promise<ExamDto>;
    getSubjects: (examType?: string) => Promise<SubjectDto[]>;
    recordResult: (data: {
      examId: string;
      studentId: string;
      items: Array<{ subjectId: string; correct: number; wrong: number; empty: number; score?: number }>;
    }) => Promise<ExamResultDto>;
    listResults: (filter?: { examId?: string; studentId?: string }) => Promise<ExamResultDto[]>;
    getTargets: (studentId?: string) => Promise<StudentTargetDto[]>;
    createTarget: (data: {
      studentId: string;
      targetType: 'net' | 'score' | 'rank' | 'school' | 'habit';
      title: string;
      description?: string;
      targetValue: string;
      unit?: string;
      targetDate?: string;
    }) => Promise<StudentTargetDto>;
    updateTargetStatus: (id: string, status: 'in_progress' | 'achieved' | 'missed') => Promise<StudentTargetDto>;
    getStudyPlans: (studentId?: string) => Promise<StudyPlanDto[]>;
    createStudyPlan: (data: {
      studentId: string;
      title: string;
      startDate: string;
      endDate: string;
      notes?: string;
      items: Array<{ date: string; subject: string; topic: string; plannedQuestions: number; startTime?: string; endTime?: string }>;
    }) => Promise<StudyPlanDto>;
    updateStudyPlanItemStatus: (itemId: string, status: 'pending' | 'completed' | 'missed', completedQuestions?: number) => Promise<boolean>;
    getQuestionLogs: (filter?: { studentId?: string; dateFrom?: string; dateTo?: string }) => Promise<QuestionTrackingDto[]>;
    logQuestions: (data: {
      studentId: string;
      date: string;
      subjectId: string;
      questionCount: number;
      correctCount: number;
      wrongCount: number;
      emptyCount: number;
      notes?: string;
    }) => Promise<QuestionTrackingDto>;
  };
  agenda: {
    list: (params?: { startDate?: string; endDate?: string; date?: string }) => Promise<AgendaItemDto[]>;
    create: (data: { schoolYearId?: string; title: string; agendaDate: string; startTime?: string; notes?: string }) => Promise<AgendaItemDto>;
    update: (id: string, data: { title?: string; agendaDate?: string; startTime?: string; completed?: boolean; notes?: string }) => Promise<AgendaItemDto>;
    toggleComplete: (id: string, completed: boolean) => Promise<AgendaItemDto>;
    delete: (id: string) => Promise<boolean>;
  };
  annualPlans: {
    get: (schoolYearId?: string) => Promise<AnnualPlanDto | null>;
    createOrUpdate: (data: { schoolYearId: string; title: string; description?: string }) => Promise<AnnualPlanDto>;
    addItem: (data: {
      annualPlanId?: string;
      schoolYearId?: string;
      plannedDate?: string;
      startDate?: string;
      endDate?: string;
      activityType?: string;
      category?: string;
      title: string;
      description?: string;
      targetAudience?: string;
    }) => Promise<AnnualPlanItemDto>;
    updateItem: (id: string, data: {
      title?: string;
      activityType?: string;
      targetAudience?: string;
      startDate?: string;
      endDate?: string;
      plannedDate?: string;
      description?: string;
      category?: string;
      status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    }) => Promise<AnnualPlanItemDto>;
    updateItemStatus: (itemId: string, status: 'planned' | 'in_progress' | 'completed' | 'cancelled') => Promise<AnnualPlanItemDto>;
    deleteItem: (itemId: string) => Promise<boolean>;
  };
  reports: {
    getSchoolAnalytics: () => Promise<any>;
    exportStudentsExcel: () => Promise<{ success: boolean; dataBase64: string; fileName: string }>;
    importStudentsExcel: (dataBase64: string) => Promise<{ success: boolean; importedCount: number; errors?: string[] }>;
    getStudentGuidanceReportHtml: (studentId: string) => Promise<string>;
    getBepPlanReportHtml: (bepPlanId: string) => Promise<string>;
    getBipPlanReportHtml: (bipPlanId: string) => Promise<string>;
    getRamReferralReportHtml: (referralId: string) => Promise<string>;
    exportHtmlToPdf: (html: string, outputPath?: string) => Promise<{ success: boolean; base64?: string; filePath?: string; error?: string }>;
  };
  // Phase V3 Special Education APIs
  specialEducation: {
    createRamReport: (dto: RamReportDto) => Promise<RamReportDto>;
    updateRamReport: (id: string, dto: Partial<RamReportDto>) => Promise<RamReportDto>;
    deleteRamReport: (id: string) => Promise<boolean>;
    getRamReportById: (id: string) => Promise<RamReportDto | null>;
    listRamReportsByStudent: (studentId: string) => Promise<RamReportDto[]>;
    listAllRamReports: () => Promise<RamReportDto[]>;

    createBepPlan: (dto: BepPlanDto) => Promise<BepPlanDto>;
    updateBepPlan: (id: string, dto: Partial<BepPlanDto>) => Promise<BepPlanDto>;
    deleteBepPlan: (id: string) => Promise<boolean>;
    getBepPlanById: (id: string) => Promise<BepPlanDto | null>;
    listBepPlansByStudent: (studentId: string) => Promise<BepPlanDto[]>;
    listAllBepPlans: () => Promise<BepPlanDto[]>;

    addBepGoal: (dto: BepGoalDto) => Promise<BepGoalDto>;
    updateBepGoal: (id: string, dto: Partial<BepGoalDto>) => Promise<BepGoalDto>;
    updateGoalStatus: (id: string, status: 'not_started' | 'in_progress' | 'partially_achieved' | 'achieved' | 'not_achieved', notes?: string) => Promise<BepGoalDto>;
    deleteBepGoal: (id: string) => Promise<boolean>;
    listGoalsByPlanId: (planId: string) => Promise<BepGoalDto[]>;
    listGoalsByStudentId: (studentId: string) => Promise<BepGoalDto[]>;

    createBipPlan: (dto: BipPlanDto) => Promise<BipPlanDto>;
    updateBipPlan: (id: string, dto: Partial<BipPlanDto>) => Promise<BipPlanDto>;
    deleteBipPlan: (id: string) => Promise<boolean>;
    getBipPlanById: (id: string) => Promise<BipPlanDto | null>;
    listBipPlansByStudent: (studentId: string) => Promise<BipPlanDto[]>;
    listAllBipPlans: () => Promise<BipPlanDto[]>;

    createEvaluation: (dto: DevelopmentEvaluationDto) => Promise<DevelopmentEvaluationDto>;
    updateEvaluation: (id: string, dto: Partial<DevelopmentEvaluationDto>) => Promise<DevelopmentEvaluationDto>;
    deleteEvaluation: (id: string) => Promise<boolean>;
    getEvaluationById: (id: string) => Promise<DevelopmentEvaluationDto | null>;
    listEvaluationsByStudent: (studentId: string) => Promise<DevelopmentEvaluationDto[]>;
    listAllEvaluations: () => Promise<DevelopmentEvaluationDto[]>;

    createReferral: (dto: RamReferralDto) => Promise<RamReferralDto>;
    updateReferral: (id: string, dto: Partial<RamReferralDto>) => Promise<RamReferralDto>;
    updateReferralStatus: (id: string, status: 'pending' | 'evaluated' | 'report_issued' | 'rejected' | 'canceled', resultNotes?: string) => Promise<RamReferralDto>;
    deleteReferral: (id: string) => Promise<boolean>;
    getReferralById: (id: string) => Promise<RamReferralDto | null>;
    listReferralsByStudent: (studentId: string) => Promise<RamReferralDto[]>;
    listAllReferrals: () => Promise<RamReferralDto[]>;
  };
  updater: {
    getStatus: () => Promise<UpdateStatus>;
    checkForUpdates: () => Promise<UpdateStatus>;
    downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
    quitAndInstall: () => Promise<{ success: boolean; error?: string }>;
    onStatusChange: (callback: (status: UpdateStatus) => void) => () => void;
    onDownloadProgress: (callback: (progress: UpdateProgress) => void) => () => void;
  };
  feedback: {
    send: (payload: { message: string }) => Promise<{ success: boolean; error?: string }>;
  };
}

export type UpdateStateType = 
  | 'idle' 
  | 'checking' 
  | 'available' 
  | 'not-available' 
  | 'downloading' 
  | 'downloaded' 
  | 'error' 
  | 'dev-mode';

export type UpdateErrorPhaseType = 'check' | 'download' | 'install' | null;

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export interface UpdateInfoPayload {
  version: string;
  releaseDate?: string;
  releaseNotes?: string | string[];
}

export interface UpdateStatus {
  state: UpdateStateType;
  currentVersion: string;
  availableVersion: string | null;
  releaseDate: string | null;
  releaseNotes: string | null;
  progress: UpdateProgress | null;
  errorMessage: string | null;
  errorPhase?: UpdateErrorPhaseType;
  feedUrl: string;
  checkedAt: number | null;
}

declare global {
  interface Window {
    api: ElectronApi;
  }
}


