import { app, BrowserWindow, session, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { logger } from './services/logger/Logger';
import { safeStorageService } from './services/security/SafeStorageService';
import { databaseService } from './services/database/DatabaseService';
import { encryptionService } from './services/security/EncryptionService';
import { SyncEngine } from './services/sync/SyncEngine';
import { AuthService } from './services/auth/AuthService';
import { StudentService } from './services/students/StudentService';
import { MeetingService } from './services/meetings/MeetingService';
import { AppointmentService } from './services/appointments/AppointmentService';
import { TaskService } from './services/tasks/TaskService';
import { SearchService } from './services/search/SearchService';
import { DashboardService } from './services/dashboard/DashboardService';
import { SurveyEngine } from './services/surveys/SurveyEngine';
import { AcademicEngine } from './services/academic/AcademicEngine';
import { AnnualPlanService } from './services/annual/AnnualPlanService';
import { ReportService } from './services/reports/ReportService';
import { DataTransferService } from './services/backup/DataTransferService';
import { SpecialEducationService } from './services/special_education/SpecialEducationService';
import { MebPdfReportService } from './services/reports/MebPdfReportService';
import { OfflineSurveyPackageService } from './services/surveys/OfflineSurveyPackageService';
import { DailyNoteService } from './services/daily_notes/DailyNoteService';
import { AgendaService } from './services/agenda/AgendaService';
import { CounselorDocumentService } from './services/documents/CounselorDocumentService';
import { PresentationService } from './services/presentations/PresentationService';
import { AppointmentScheduler } from './services/notifications/AppointmentScheduler';
import { UpdateService } from './services/updater/UpdateService';
import { FeedbackService } from './services/feedback/FeedbackService';
import { loadEnvironmentVariables } from './services/security/EnvLoader';
import { registerAllIpcHandlers } from './ipc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.setName('PDR Manager');

let mainWindow: BrowserWindow | null = null;

// Enforce single application instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Optimize Chromium & Windows DWM rendering pipeline to eliminate maximize/fullscreen flicker
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-direct-composition-video-overlays');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('high-dpi-support', '1');

function createWindow() {
  const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;
  const preloadFile = fs.existsSync(path.join(__dirname, 'preload.mjs')) ? 'preload.mjs' : 'preload.js';

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    title: 'PDR Manager — Psikolojik Danışmanlık ve Rehberlik Bilgi Sistemi',
    backgroundColor: '#f4f6f9',
    autoHideMenuBar: true,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, preloadFile),
      webSecurity: true,
      backgroundThrottling: false
    }
  });

  mainWindow.webContents.setBackgroundThrottling(false);

  if (process.platform === 'darwin') {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          { role: 'close' }
        ]
      }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    mainWindow.setMenu(null);
    Menu.setApplicationMenu(null);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Strict Content Security Policy - 100% Local-First
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';"
        ]
      }
    });
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const userDataPath = app.getPath('userData');

  // Initialize Core Services
  logger.init(userDataPath);
  loadEnvironmentVariables(userDataPath);
  logger.info(`Starting PDR Manager from ${userDataPath}`);

  safeStorageService.init(userDataPath);
  const { db } = databaseService.init(userDataPath);
  const deviceId = databaseService.ensureDeviceId();

  const appointmentScheduler = new AppointmentScheduler(db, () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  appointmentScheduler.init();

  const syncEngine = new SyncEngine(db, deviceId);
  const authService = new AuthService(databaseService, userDataPath);
  const studentService = new StudentService(db, deviceId, syncEngine);
  const meetingService = new MeetingService(db, deviceId, syncEngine);
  const appointmentService = new AppointmentService(db, deviceId, syncEngine, appointmentScheduler);
  const taskService = new TaskService(db, deviceId, syncEngine);
  const searchService = new SearchService(db);
  const dashboardService = new DashboardService(db, meetingService, appointmentService, taskService);

  // V2 & V3 Services
  const surveyEngine = new SurveyEngine(db, deviceId, syncEngine);
  const academicEngine = new AcademicEngine(db, deviceId, syncEngine);
  const annualPlanService = new AnnualPlanService(db, deviceId, syncEngine);
  const reportService = new ReportService(db, studentService, meetingService);
  const dataTransferService = new DataTransferService(databaseService, encryptionService, deviceId, userDataPath);
  const specialEducationService = new SpecialEducationService(databaseService.getSqlite(), deviceId, syncEngine);
  const mebPdfService = new MebPdfReportService(databaseService.getSqlite());
  const offlineSurveyService = new OfflineSurveyPackageService(databaseService.getSqlite(), surveyEngine);
  const dailyNoteService = new DailyNoteService(db, deviceId, syncEngine);
  const agendaService = new AgendaService(db, deviceId, syncEngine);
  const counselorDocumentService = new CounselorDocumentService(db, deviceId, syncEngine, userDataPath);
  const presentationService = new PresentationService(db, deviceId, syncEngine, userDataPath);
  const updateService = new UpdateService(() => mainWindow);
  updateService.init();
  const feedbackService = new FeedbackService();

  // Register Whitelisted IPC (V1 + V2 + V3 + Data Transfer + Updater + Feedback)
  registerAllIpcHandlers(
    authService,
    databaseService,
    syncEngine,
    studentService,
    meetingService,
    appointmentService,
    taskService,
    searchService,
    dashboardService,
    surveyEngine,
    academicEngine,
    annualPlanService,
    reportService,
    dataTransferService,
    specialEducationService,
    mebPdfService,
    offlineSurveyService,
    dailyNoteService,
    agendaService,
    counselorDocumentService,
    presentationService,
    () => mainWindow,
    updateService,
    feedbackService
  );

  createWindow();

  app.on('activate', () => {
    if (!databaseService.isInitialized()) {
      const userDataPath = app.getPath('userData');
      databaseService.init(userDataPath);
    }
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    databaseService.close();
    app.quit();
  }
});

app.on('before-quit', () => {
  databaseService.close();
});
