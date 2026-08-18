import { AuthService } from '../services/auth/AuthService';
import { DatabaseService } from '../services/database/DatabaseService';
import { SyncEngine } from '../services/sync/SyncEngine';
import { StudentService } from '../services/students/StudentService';
import { MeetingService } from '../services/meetings/MeetingService';
import { AppointmentService } from '../services/appointments/AppointmentService';
import { TaskService } from '../services/tasks/TaskService';
import { SearchService } from '../services/search/SearchService';
import { DashboardService } from '../services/dashboard/DashboardService';
import { SurveyEngine } from '../services/surveys/SurveyEngine';
import { AcademicEngine } from '../services/academic/AcademicEngine';
import { AnnualPlanService } from '../services/annual/AnnualPlanService';
import { ReportService } from '../services/reports/ReportService';
import { SpecialEducationService } from '../services/special_education/SpecialEducationService';
import { MebPdfReportService } from '../services/reports/MebPdfReportService';
import { OfflineSurveyPackageService } from '../services/surveys/OfflineSurveyPackageService';

import { registerAuthIpc } from './authIpc';
import { registerSchoolIpc } from './schoolIpc';
import { registerStudentIpc } from './studentIpc';
import { registerMeetingIpc } from './meetingIpc';
import { registerAppointmentIpc } from './appointmentIpc';
import { registerTaskIpc } from './taskIpc';
import { registerSearchIpc } from './searchIpc';
import { registerSyncIpc } from './syncIpc';
import { registerSurveyIpc } from './surveyIpc';
import { registerExamIpc } from './examIpc';
import { registerAnnualPlanIpc } from './annualPlanIpc';
import { registerReportIpc } from './reportIpc';
import { registerDataTransferIpc } from './dataTransferIpc';
import { registerSpecialEducationIpc } from './specialEducationIpc';
import { registerActivityIpc } from './activityIpc';
import { registerStudyProgramIpc } from './studyProgramIpc';
import { registerDailyNoteIpc } from './dailyNoteIpc';
import { registerAgendaIpc } from './agendaIpc';
import { registerDocumentIpc } from './documentIpc';
import { registerPresentationIpc } from './presentationIpc';
import { CounselorDocumentService } from '../services/documents/CounselorDocumentService';
import { PresentationService } from '../services/presentations/PresentationService';
import { DailyNoteService } from '../services/daily_notes/DailyNoteService';
import { AgendaService } from '../services/agenda/AgendaService';
import { DataTransferService } from '../services/backup/DataTransferService';
import { logger } from '../services/logger/Logger';

export function registerAllIpcHandlers(
  authService: AuthService,
  databaseService: DatabaseService,
  _syncEngine: SyncEngine,
  studentService: StudentService,
  meetingService: MeetingService,
  appointmentService: AppointmentService,
  taskService: TaskService,
  searchService: SearchService,
  dashboardService: DashboardService,
  surveyEngine: SurveyEngine,
  academicEngine: AcademicEngine,
  annualPlanService: AnnualPlanService,
  reportService: ReportService,
  dataTransferService: DataTransferService,
  specialEducationService?: SpecialEducationService,
  mebPdfService?: MebPdfReportService,
  offlineSurveyService?: OfflineSurveyPackageService,
  dailyNoteService?: DailyNoteService,
  agendaService?: AgendaService,
  counselorDocumentService?: CounselorDocumentService,
  presentationService?: PresentationService,
  getMainWindow?: () => import('electron').BrowserWindow | null
) {
  logger.info('Registering all whitelisted IPC handlers (V1 + V2 + V3 + Data Transfer)...');
  registerAuthIpc(authService, databaseService, dashboardService);
  registerSchoolIpc(databaseService);
  registerStudentIpc(studentService);
  registerMeetingIpc(meetingService);
  registerAppointmentIpc(appointmentService);
  registerTaskIpc(taskService);
  registerSearchIpc(searchService);
  registerSyncIpc();
  registerSurveyIpc(surveyEngine, authService, offlineSurveyService, mebPdfService);
  registerExamIpc(academicEngine);
  registerAnnualPlanIpc(annualPlanService);
  registerReportIpc(reportService, mebPdfService);
  registerDataTransferIpc(dataTransferService);
  registerActivityIpc(databaseService);
  registerStudyProgramIpc(databaseService);
  registerDocumentIpc(counselorDocumentService);
  registerPresentationIpc(presentationService, getMainWindow);
  if (dailyNoteService) {
    registerDailyNoteIpc(dailyNoteService);
  }
  if (agendaService) {
    registerAgendaIpc(agendaService);
  }
  if (specialEducationService) {
    registerSpecialEducationIpc(specialEducationService);
  }
  logger.info('All IPC handlers registered successfully.');
}
