import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';

// --- System & Metadata ---
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(), // e.g. 'DEVICE-7F3A91'
  name: text('name').notNull(),
  appVersion: text('app_version').notNull(),
  registeredAt: integer('registered_at').notNull(),
  lastSeenAt: integer('last_seen_at').notNull(),
  isCurrentDevice: integer('is_current_device').notNull().default(0)
});

// --- Institutional Hierarchy ---
export const schools = sqliteTable('schools', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  principalName: text('principal_name'),
  counselorName: text('counselor_name'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const schoolYears = sqliteTable('school_years', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // e.g. '2026-2027'
  startDate: text('start_date').notNull(), // 'YYYY-MM-DD'
  endDate: text('end_date').notNull(),
  isActive: integer('is_active').notNull().default(0),
  isArchived: integer('is_archived').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const classes = sqliteTable('classes', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  name: text('name').notNull(), // '9-A'
  grade: integer('grade').notNull(), // 9
  branch: text('branch').notNull(), // 'A'
  teacherName: text('teacher_name'),
  pdfPath: text('pdf_path'),
  pdfName: text('pdf_name'),
  pdfUploadedAt: integer('pdf_uploaded_at'),
  pdfUploadDate: text('pdf_upload_date'),
  pdfUploadTime: text('pdf_upload_time'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

// --- Students, Parents, Teachers ---
export const students = sqliteTable('students', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  classId: text('class_id').references(() => classes.id),
  studentNumber: text('student_number').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  birthDate: text('birth_date'),
  gender: text('gender').notNull(), // 'male', 'female', 'other'
  phone: text('phone'),
  email: text('email'),
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'graduated', 'transferred'
  avatarPath: text('avatar_path'),
  notes: text('notes'), // [ENCRYPTED_IN_CLOUD]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  yearStatusIdx: index('idx_students_year_status').on(table.schoolYearId, table.status),
  classIdx: index('idx_students_class').on(table.classId),
  nameIdx: index('idx_students_name').on(table.firstName, table.lastName)
}));

export const parents = sqliteTable('parents', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  occupation: text('occupation'),
  address: text('address'),
  notes: text('notes'), // [ENCRYPTED_IN_CLOUD]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const studentParents = sqliteTable('student_parents', {
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  relationship: text('relationship').notNull(), // 'mother', 'father', 'guardian'
  isPrimary: integer('is_primary').notNull().default(0)
}, (table) => ({
  pk: primaryKey({ columns: [table.studentId, table.parentId] })
}));

export const teachers = sqliteTable('teachers', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  branch: text('branch').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const studentTeachers = sqliteTable('student_teachers', {
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  teacherId: text('teacher_id').notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  relationship: text('relationship')
}, (table) => ({
  pk: primaryKey({ columns: [table.studentId, table.teacherId] })
}));

// --- Counseling & Meetings ---
export const meetings = sqliteTable('meetings', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  studentId: text('student_id').references(() => students.id),
  meetingType: text('meeting_type').notNull(), // 'student', 'parent', 'teacher', 'discipline', 'group_guidance', etc.
  date: text('date').notNull(), // 'YYYY-MM-DD'
  startTime: text('start_time').notNull(), // 'HH:MM'
  endTime: text('end_time'), // 'HH:MM'
  duration: integer('duration').notNull().default(30),
  subject: text('subject').notNull(),
  summary: text('summary').notNull(), // [ENCRYPTED_IN_CLOUD]
  notes: text('notes').notNull(), // [ENCRYPTED_IN_CLOUD]
  decisions: text('decisions'), // [ENCRYPTED_IN_CLOUD]
  followUpRequired: integer('follow_up_required').notNull().default(0),
  followUpDate: text('follow_up_date'),
  mebbisProcessed: integer('mebbis_processed').notNull().default(0),
  guidanceServiceType: text('guidance_service_type').notNull().default('Psikolojik Danışma'),
  studentIds: text('student_ids'), // JSON array of student IDs for Group Guidance
  meetingTopic: text('meeting_topic'), // 'Sağlıkla İlgili Konular', 'Akademik Konular', vb.
  meetingTopicOther: text('meeting_topic_other'),
  activityType: text('activity_type'), // 'Bireysel Öğrenci Görüşmesi', 'Veli Görüşmesi', vb.
  activityTypeOther: text('activity_type_other'),
  referralInstitutions: text('referral_institutions'), // JSON array e.g. ["RAM", "HASTANE"]
  referralOther: text('referral_other'),
  participantType: text('participant_type'), // 'Öğrenci', 'Veli', 'Öğretmen', 'Grup'
  parentRelation: text('parent_relation'), // 'Anne', 'Baba', 'Vasi'
  teacherName: text('teacher_name'),
  teacherBranch: text('teacher_branch'),
  sessionNumber: integer('session_number'), // 1, 2, 3...
  plannedSessions: integer('planned_sessions'), // Planlanan Oturum Sayısı
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  studentDateIdx: index('idx_meetings_student_date').on(table.studentId, table.date)
}));

export const meetingParticipants = sqliteTable('meeting_participants', {
  id: text('id').primaryKey(),
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull()
}, (table) => ({
  meetingIdx: index('idx_meeting_participants_meeting').on(table.meetingId),
  studentIdx: index('idx_meeting_participants_student').on(table.studentId)
}));

export const meetingTags = sqliteTable('meeting_tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique()
});

export const meetingTagRelations = sqliteTable('meeting_tag_relations', {
  meetingId: text('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => meetingTags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.meetingId, table.tagId] })
}));

// --- Appointments & Tasks ---
export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  studentId: text('student_id').references(() => students.id),
  relatedMeetingId: text('related_meeting_id'),
  title: text('title').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  location: text('location').default('Rehberlik Servisi'),
  notes: text('notes'), // [ENCRYPTED_IN_CLOUD]
  status: text('status').notNull().default('scheduled'), // 'scheduled', 'completed', 'cancelled', 'no_show', 'student_absent', 'other'
  resultNote: text('result_note'),
  appointmentType: text('appointment_type').notNull().default('Bireysel Öğrenci Görüşmesi'),
  studentIds: text('student_ids'), // JSON array for group appointments
  reminderMinutes: integer('reminder_minutes').notNull().default(15),
  notificationSent: integer('notification_sent').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const appointmentParticipants = sqliteTable('appointment_participants', {
  id: text('id').primaryKey(),
  appointmentId: text('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at').notNull()
}, (table) => ({
  appointmentIdx: index('idx_appointment_participants_appointment').on(table.appointmentId),
  studentIdx: index('idx_appointment_participants_student').on(table.studentId)
}));

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // [ENCRYPTED_IN_CLOUD]
  dueDate: text('due_date'),
  dueTime: text('due_time'),
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  category: text('category').notNull().default('general'),
  studentId: text('student_id').references(() => students.id),
  completed: integer('completed').notNull().default(0),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  triggerAt: integer('trigger_at').notNull(),
  repeatType: text('repeat_type').notNull().default('none'),
  isCompleted: integer('is_completed').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

// --- Annual Guidance Plan ---
export const annualPlans = sqliteTable('annual_plans', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const annualPlanItems = sqliteTable('annual_plan_items', {
  id: text('id').primaryKey(),
  annualPlanId: text('annual_plan_id').notNull().references(() => annualPlans.id, { onDelete: 'cascade' }),
  plannedDate: text('planned_date').notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  activityType: text('activity_type'),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetAudience: text('target_audience'),
  status: text('status').notNull().default('planned'),
  completedAt: integer('completed_at'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

// --- Agenda Items (Ajanda Notları / Toplantılar) ---
export const agendaItems = sqliteTable('agenda_items', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').references(() => schoolYears.id),
  title: text('title').notNull(),
  agendaDate: text('agenda_date').notNull(), // 'YYYY-MM-DD'
  startTime: text('start_time'), // 'HH:MM'
  completed: integer('completed').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  dateIdx: index('idx_agenda_items_date').on(table.agendaDate)
}));

// --- Surveys & Dynamic Inventories / Scales Engine ---
export const surveys = sqliteTable('surveys', {
  id: text('id').primaryKey(),
  slug: text('slug'),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('SURVEY'), // 'SURVEY', 'INVENTORY', 'SCALE'
  repeatPolicy: text('repeat_policy').notNull().default('UNLIMITED'), // 'UNLIMITED', 'ONCE', 'YEARLY'
  isActive: integer('is_active').notNull().default(1),
  currentVersionNumber: integer('current_version_number').notNull().default(1),
  targetMode: text('target_mode').notNull().default('student_linked'), // 'student_linked', 'anonymous_aggregated'
  surveyVersion: integer('survey_version').notNull().default(1),
  status: text('status').notNull().default('active'), // 'draft', 'active', 'archived'
  estimatedMinutes: integer('estimated_minutes').notNull().default(15),
  scoringMethod: text('scoring_method').notNull().default('none'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const surveyVersions = sqliteTable('survey_versions', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull().default(1),
  titleSnapshot: text('title_snapshot').notNull(),
  descriptionSnapshot: text('description_snapshot'),
  scoringType: text('scoring_type').notNull().default('SUM'), // 'SUM', 'AVERAGE', 'SUBSCALES', 'CUSTOM'
  isPublished: integer('is_published').notNull().default(1),
  publishedAt: integer('published_at').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const surveySubscales = sqliteTable('survey_subscales', {
  id: text('id').primaryKey(),
  surveyVersionId: text('survey_version_id').notNull().references(() => surveyVersions.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  calculationMethod: text('calculation_method').notNull().default('SUM'), // 'SUM', 'AVERAGE', 'PERCENTAGE'
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const surveyInterpretations = sqliteTable('survey_interpretations', {
  id: text('id').primaryKey(),
  surveyVersionId: text('survey_version_id').notNull().references(() => surveyVersions.id, { onDelete: 'cascade' }),
  subscaleId: text('subscale_id').references(() => surveySubscales.id, { onDelete: 'set null' }),
  minScore: real('min_score').notNull(),
  maxScore: real('max_score').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  colorCode: text('color_code'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const surveyQuestions = sqliteTable('survey_questions', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').references(() => surveys.id, { onDelete: 'cascade' }),
  surveyVersionId: text('survey_version_id').references(() => surveyVersions.id, { onDelete: 'cascade' }),
  questionOrder: integer('question_order').notNull(),
  questionText: text('question_text').notNull(),
  questionType: text('question_type').notNull(), // 'single_choice', 'multiple_choice', 'likert_5', 'likert_4', 'yes_no', 'numeric', 'text'
  category: text('category'),
  subscaleId: text('subscale_id').references(() => surveySubscales.id),
  isReverseScored: integer('is_reverse_scored').notNull().default(0),
  required: integer('required').notNull().default(1),
  helpText: text('help_text'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const surveyOptions = sqliteTable('survey_options', {
  id: text('id').primaryKey(),
  questionId: text('question_id').notNull().references(() => surveyQuestions.id, { onDelete: 'cascade' }),
  optionOrder: integer('option_order').notNull(),
  optionText: text('option_text').notNull(),
  optionLabel: text('option_label'),
  optionValue: text('option_value'),
  score: real('score').notNull().default(0.0),
  scoreValue: real('score_value').notNull().default(0.0),
  reverseScoreValue: real('reverse_score_value').notNull().default(0.0)
});

export const surveyAssignments = sqliteTable('survey_assignments', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id),
  studentId: text('student_id').notNull().references(() => students.id),
  assignmentRef: text('assignment_ref').notNull().unique(), // 'PDR-XXXXXX'
  assignedAt: integer('assigned_at').notNull(),
  dueDate: text('due_date'),
  status: text('status').notNull().default('assigned'), // 'assigned', 'started', 'completed', 'expired'
  startedAt: integer('started_at'),
  completedAt: integer('completed_at'),
  googleFormId: text('google_form_id'),
  googleSheetId: text('google_sheet_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const surveyApplications = sqliteTable('survey_applications', {
  id: text('id').primaryKey(),
  surveyId: text('survey_id').notNull().references(() => surveys.id),
  surveyVersionId: text('survey_version_id').notNull().references(() => surveyVersions.id),
  studentId: text('student_id').notNull().references(() => students.id),
  studentNumberSnapshot: text('student_number_snapshot').notNull(),
  schoolYearId: text('school_year_id').references(() => schoolYears.id),
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: text('status').notNull().default('COMPLETED'), // 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'
  source: text('source').notNull().default('web'),
  startedAt: integer('started_at'),
  completedAt: integer('completed_at').notNull(),
  resultSnapshot: text('result_snapshot'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const surveyResponses = sqliteTable('survey_responses', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').references(() => surveyAssignments.id),
  studentId: text('student_id').references(() => students.id),
  respondentName: text('respondent_name'),
  respondentStudentNumber: text('respondent_student_number'),
  respondentEmail: text('respondent_email'),
  matchStatus: text('match_status').notNull().default('matched'),
  mismatchReason: text('mismatch_reason'),
  surveyId: text('survey_id').notNull().references(() => surveys.id),
  source: text('source').notNull(),
  externalResponseId: text('external_response_id'),
  startedAt: integer('started_at'),
  completedAt: integer('completed_at').notNull(),
  totalScore: real('total_score'),
  resultSummary: text('result_summary'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const surveyAnswers = sqliteTable('survey_answers', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').references(() => surveyApplications.id, { onDelete: 'cascade' }),
  responseId: text('response_id').references(() => surveyResponses.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull().references(() => surveyQuestions.id),
  selectedOptionId: text('selected_option_id').references(() => surveyOptions.id),
  answerValue: text('answer_value'),
  answerScore: real('answer_score'),
  textValue: text('text_value'),
  numberValue: real('number_value'),
  booleanValue: integer('boolean_value'),
  dateValue: text('date_value')
});

export const surveyResultSnapshots = sqliteTable('survey_result_snapshots', {
  id: text('id').primaryKey(),
  applicationId: text('application_id').notNull().references(() => surveyApplications.id, { onDelete: 'cascade' }),
  totalScore: real('total_score').notNull(),
  subscaleScoresJson: text('subscale_scores_json'),
  interpretationLabel: text('interpretation_label'),
  interpretationDescription: text('interpretation_description'),
  rawMetricsJson: text('raw_metrics_json'),
  calculatedAt: integer('calculated_at').notNull()
});

// --- Exams, Targets, Study Plans, Questions ---
export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  name: text('name').notNull(),
  examType: text('exam_type').notNull(), // 'TYT', 'AYT', 'LGS', 'CUSTOM'
  date: text('date').notNull(),
  description: text('description'),
  netCalculationFormula: text('net_calculation_formula').notNull().default('C - (W / 4)'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  examType: text('exam_type').notNull(),
  category: text('category').notNull(),
  questionCount: integer('question_count').notNull().default(40)
});

export const examResults = sqliteTable('exam_results', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').notNull().references(() => subjects.id),
  correct: integer('correct').notNull().default(0),
  wrong: integer('wrong').notNull().default(0),
  empty: integer('empty').notNull().default(0),
  net: real('net').notNull().default(0.0),
  score: real('score').notNull().default(0.0),
  rank: integer('rank'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const studentTargets = sqliteTable('student_targets', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  targetValue: text('target_value').notNull(),
  unit: text('unit'),
  targetDate: text('target_date'),
  status: text('status').notNull().default('in_progress'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const studyPlans = sqliteTable('study_plans', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  templateId: text('template_id'),
  templateNameSnapshot: text('template_name_snapshot'),
  featuresSnapshot: text('features_snapshot').notNull().default(''),
  title: text('title').notNull(),
  monday: text('monday').notNull().default(''),
  tuesday: text('tuesday').notNull().default(''),
  wednesday: text('wednesday').notNull().default(''),
  thursday: text('thursday').notNull().default(''),
  friday: text('friday').notNull().default(''),
  saturday: text('saturday').notNull().default(''),
  sunday: text('sunday').notNull().default(''),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  notes: text('notes'), // [ENCRYPTED_IN_CLOUD]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const studyPlanItems = sqliteTable('study_plan_items', {
  id: text('id').primaryKey(),
  studyPlanId: text('study_plan_id').notNull().references(() => studyPlans.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  plannedQuestions: integer('planned_questions').notNull().default(0),
  completedQuestions: integer('completed_questions').notNull().default(0),
  status: text('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const questionTracking = sqliteTable('question_tracking', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  subjectId: text('subject_id').notNull().references(() => subjects.id),
  questionCount: integer('question_count').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  wrongCount: integer('wrong_count').notNull().default(0),
  emptyCount: integer('empty_count').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

// --- Special Education (BEP / IEP) & Documents ---
export const specialEducationRecords = sqliteTable('special_education_records', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  supportType: text('support_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  ramReportNo: text('ram_report_no'), // [ENCRYPTED_IN_CLOUD]
  ramDecisionDate: text('ram_decision_date'),
  notes: text('notes'), // [ENCRYPTED_IN_CLOUD]
  status: text('status').notNull().default('active'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const individualEducationPlans = sqliteTable('individual_education_plans', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  title: text('title').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  goals: text('goals').notNull(), // [ENCRYPTED_IN_CLOUD] JSON array of goals
  accommodations: text('accommodations'), // [ENCRYPTED_IN_CLOUD]
  evaluationNotes: text('evaluation_notes'), // [ENCRYPTED_IN_CLOUD]
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

export const counselorDocuments = sqliteTable('counselor_documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  uploadDate: text('upload_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  titleIdx: index('idx_counselor_docs_title').on(table.title)
}));

export const presentations = sqliteTable('presentations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  slideCount: integer('slide_count'),
  uploadDate: text('upload_date').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  titleIdx: index('idx_presentations_title').on(table.title)
}));

// --- True 3-Way Merge Synchronization Queue & Audit Logs ---
export const syncChanges = sqliteTable('sync_changes', {
  id: text('id').primaryKey(), // UUIDv4
  entityType: text('entity_type').notNull(), // e.g. 'students', 'meetings'
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(), // 'create', 'update', 'delete'
  baseVersion: integer('base_version').notNull(), // Ancestor version for 3-way merge
  newVersion: integer('new_version').notNull(),
  baseSnapshot: text('base_snapshot'), // JSON string before mutation
  payload: text('payload').notNull(), // JSON string after mutation
  changedAt: integer('changed_at').notNull(),
  deviceId: text('device_id').notNull(),
  syncedAt: integer('synced_at'), // NULL if pending
  retryCount: integer('retry_count').notNull().default(0),
  errorMessage: text('error_message')
}, (table) => ({
  pendingIdx: index('idx_sync_changes_pending').on(table.syncedAt),
  entityIdx: index('idx_sync_changes_entity').on(table.entityType, table.entityId)
}));

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  deviceId: text('device_id').notNull(),
  description: text('description').notNull()
});

// --- Counseling Activities (Yapılan Çalışmalar) ---
export const counselingActivities = sqliteTable('counseling_activities', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').notNull().references(() => schoolYears.id),
  type: text('type').notNull().default('activity'), // 'activity' | 'meeting'
  title: text('title').notNull(),
  description: text('description'),
  classIds: text('class_ids').notNull(), // JSON string array e.g. ["class-1", "class-2"]
  classNames: text('class_names').notNull(), // e.g. "9-A, 9-B"
  activityDate: text('activity_date').notNull(),
  activityTime: text('activity_time'), // 'HH:mm' e.g. "14:30"
  participantCount: integer('participant_count').notNull().default(0),
  notes: text('notes'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  yearDateIdx: index('idx_activities_year_date').on(table.schoolYearId, table.activityDate)
}));

// --- Study Plan Templates (Ders Çalışma Programı Taslakları) ---
export const studyPlanTemplates = sqliteTable('study_plan_templates', {
  id: text('id').primaryKey(),
  name: text('name'),
  title: text('title').notNull(),
  features: text('features'),
  monday: text('monday').notNull().default(''),
  tuesday: text('tuesday').notNull().default(''),
  wednesday: text('wednesday').notNull().default(''),
  thursday: text('thursday').notNull().default(''),
  friday: text('friday').notNull().default(''),
  saturday: text('saturday').notNull().default(''),
  sunday: text('sunday').notNull().default(''),
  settings: text('settings').notNull().default('{}'), // JSON
  weeklySchedule: text('weekly_schedule').notNull().default('{}'), // JSON
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
});

// --- Daily Notes (Anasayfa Günlük Notlar) ---
export const dailyNotes = sqliteTable('daily_notes', {
  id: text('id').primaryKey(),
  schoolYearId: text('school_year_id').references(() => schoolYears.id),
  noteDate: text('note_date').notNull(), // 'YYYY-MM-DD'
  content: text('content').notNull(),
  completed: integer('completed').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  deletedAt: integer('deleted_at'),
  version: integer('version').notNull().default(1),
  lastModifiedDeviceId: text('last_modified_device_id').notNull()
}, (table) => ({
  dateIdx: index('idx_daily_notes_date').on(table.noteDate)
}));


