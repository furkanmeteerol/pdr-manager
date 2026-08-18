import { z } from 'zod';

export const SetupWizardSchema = z.object({
  schoolName: z.string().min(2, 'Okul adı en az 2 karakter olmalıdır'),
  counselorName: z.string().min(2, 'Rehber öğretmen adı gereklidir'),
  academicYear: z.string().regex(/^\d{4}-\d{4}$/, 'Örnek format: 2026-2027'),
  masterRecoveryPassphrase: z.string().min(12, 'Kurtarma parolası en az 12 karakter olmalıdır'),
  localPassword: z.string().min(4, 'Yerel parola en az 4 karakter olmalıdır')
});

export const UnlockSchema = z.object({
  password: z.string().min(1, 'Parola boş bırakılamaz')
});

export const CreateStudentSchema = z.object({
  schoolYearId: z.string().min(1, 'Öğretim yılı gereklidir'),
  classId: z.string().nullable().optional().transform(val => (val && val.trim() !== '' ? val.trim() : null)),
  studentNumber: z.string().min(1, 'Öğrenci numarası gereklidir'),
  firstName: z.string().min(1, 'Ad gereklidir'),
  lastName: z.string().min(1, 'Soyad gereklidir'),
  birthDate: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred']).default('active'),
  notes: z.string().optional(),
  parents: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    relationship: z.string().min(1),
    isPrimary: z.boolean().optional()
  })).optional()
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export const CreateMeetingSchema = z.object({
  schoolYearId: z.string().min(1, 'Öğretim yılı gereklidir'),
  studentId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
  meetingType: z.string().default('student'),
  guidanceServiceType: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatında olmalıdır'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM formatında olmalıdır'),
  endTime: z.string().optional(),
  duration: z.number().int().min(1).default(30),
  subject: z.string().min(1, 'Görüşme konusu gereklidir'),
  summary: z.string().min(1, 'Görüşme özeti gereklidir'),
  notes: z.string().default(''),
  decisions: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  meetingTopic: z.string().optional(),
  meetingTopicOther: z.string().optional(),
  activityType: z.string().optional(),
  activityTypeOther: z.string().optional(),
  referralInstitutions: z.array(z.string()).optional(),
  referralOther: z.string().optional(),
  participantType: z.string().optional(),
  parentRelation: z.string().optional(),
  teacherName: z.string().optional(),
  teacherBranch: z.string().optional(),
  sessionNumber: z.number().int().optional(),
  plannedSessions: z.number().int().optional(),
  followUpAppointment: z.object({
    title: z.string().min(1),
    date: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().optional(),
    notes: z.string().optional(),
    reminderMinutes: z.number().optional()
  }).optional(),
  tagNames: z.array(z.string()).optional()
});

export const CreateAppointmentSchema = z.object({
  schoolYearId: z.string().min(1, 'Öğretim yılı gereklidir'),
  studentId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
  appointmentType: z.string().optional(),
  relatedMeetingId: z.string().nullable().optional(),
  title: z.string().min(1, 'Randevu başlığı gereklidir'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD formatında olmalıdır'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM formatında olmalıdır'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM formatında olmalıdır'),
  location: z.string().default('Rehberlik Servisi'),
  notes: z.string().optional(),
  reminderMinutes: z.number().int().default(15)
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Görev başlığı gereklidir'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().default('general'),
  studentId: z.string().nullable().optional()
});

export const CreateClassSchema = z.object({
  schoolYearId: z.string().min(1),
  name: z.string().min(1, 'Sınıf adı gereklidir (örn: 9-A)'),
  grade: z.number().int().min(1).max(12),
  branch: z.string().min(1, 'Şube gereklidir'),
  teacherName: z.string().optional()
});
