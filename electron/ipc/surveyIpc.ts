import { ipcMain, dialog } from 'electron';
import { SurveyEngine } from '../services/surveys/SurveyEngine';
import { AuthService } from '../services/auth/AuthService';
import { OfflineSurveyPackageService } from '../services/surveys/OfflineSurveyPackageService';
import { MebPdfReportService } from '../services/reports/MebPdfReportService';
import { SurveyReportRegistry } from '../services/surveys/reports/SurveyReportRegistry';
import { SurveySubmitPayload, SurveySubmitApplicationPayload } from '@shared/ipc-types';

export function registerSurveyIpc(
  surveyEngine: SurveyEngine,
  authService: AuthService,
  offlineService?: OfflineSurveyPackageService,
  mebPdfService?: MebPdfReportService
): void {
  ipcMain.handle('surveys:list', async () => {
    return surveyEngine.listSurveys();
  });

  ipcMain.handle('surveys:getById', async (_, id: string) => {
    return surveyEngine.getSurveyById(id);
  });

  ipcMain.handle('surveys:getBySlug', async (_, slug: string) => {
    return surveyEngine.getSurveyBySlug(slug);
  });

  ipcMain.handle('surveys:listApplications', async (_, filter?: { surveyId?: string; studentId?: string }) => {
    return surveyEngine.listApplications(filter);
  });

  ipcMain.handle('surveys:getApplicationDetail', async (_, id: string) => {
    return surveyEngine.getApplicationDetail(id);
  });

  ipcMain.handle('surveys:validateStudentForSurvey', async (_, surveySlug: string, studentNumber: string) => {
    return surveyEngine.validateStudentForSurvey(surveySlug, studentNumber);
  });

  ipcMain.handle('surveys:submitApplication', async (_, payload: SurveySubmitApplicationPayload) => {
    return surveyEngine.submitApplication(payload);
  });

  // Dedicated Survey-Specific PDF Report Generation
  ipcMain.handle('surveys:getReportHtml', async (_, applicationId: string) => {
    const appDetail = surveyEngine.getApplicationDetail(applicationId);
    if (!appDetail) {
      return { success: false, error: 'Anket uygulaması bulunamadı' };
    }
    const schoolInfo = mebPdfService ? (mebPdfService as any).getHeaderInfo() : undefined;
    const html = SurveyReportRegistry.generateReportHtml(appDetail, schoolInfo);
    return { success: true, html };
  });

  ipcMain.handle('surveys:exportPdfReport', async (_, applicationId: string) => {
    if (!mebPdfService) {
      return { success: false, error: 'PDF Rapor servisi başlatılamadı' };
    }
    const appDetail = surveyEngine.getApplicationDetail(applicationId);
    if (!appDetail) {
      return { success: false, error: 'Anket uygulaması bulunamadı' };
    }

    const schoolInfo = (mebPdfService as any).getHeaderInfo();
    const html = SurveyReportRegistry.generateReportHtml(appDetail, schoolInfo);

    // Sanitize student name & survey title for default filename
    const safeStudentName = (appDetail.studentName || 'Ogrenci').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]/g, '_');
    const defaultFileName = `${safeStudentName}_${appDetail.studentNumber || ''}_Devamsizlik_Nedenleri_Raporu.pdf`;

    const saveRes = await dialog.showSaveDialog({
      title: 'Devamsızlık Nedenleri Anketi Sonuç Raporunu Kaydet',
      defaultPath: defaultFileName,
      filters: [
        { name: 'PDF Belgesi (*.pdf)', extensions: ['pdf'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ]
    });

    if (saveRes.canceled || !saveRes.filePath) {
      return { success: false, canceled: true };
    }

    const exportRes = await mebPdfService.exportHtmlToPdf(html, saveRes.filePath);
    return {
      success: exportRes.success,
      filePath: exportRes.filePath,
      error: exportRes.error
    };
  });

  ipcMain.handle('surveys:toggleSurveyActive', async (_, surveyId: string, isActive: boolean) => {
    return surveyEngine.toggleSurveyActive(surveyId, isActive);
  });

  ipcMain.handle('surveys:getAnalytics', async (_, surveyId: string) => {
    return surveyEngine.getSurveyAnalytics(surveyId);
  });

  ipcMain.handle('surveys:create', async (_, data: any) => {
    return surveyEngine.createSurvey(data);
  });

  ipcMain.handle('surveys:assign', async (_, data: { surveyId: string; studentIds: string[]; dueDate?: string }) => {
    return surveyEngine.assignSurvey(data);
  });

  ipcMain.handle('surveys:listAssignments', async (_, filter?: any) => {
    return surveyEngine.listAssignments(filter);
  });

  ipcMain.handle('surveys:getAssignmentByRef', async (_, ref: string) => {
    return surveyEngine.getAssignmentByRef(ref);
  });

  ipcMain.handle('surveys:submitResponse', async (_, payload: SurveySubmitPayload) => {
    return surveyEngine.submitResponse(payload);
  });

  ipcMain.handle('surveys:listResponses', async (_, filter?: any) => {
    return surveyEngine.listResponses(filter);
  });

  // Offline Portable Survey Package
  if (offlineService) {
    ipcMain.handle('surveys:generateOfflinePackageHtml', async (_, surveyId: string, passphrase?: string) => {
      try {
        const html = offlineService.generateOfflineHtmlPackage(surveyId, passphrase);
        return { success: true, html };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle('surveys:importOfflineResult', async (_, encryptedPayload: string, passphrase?: string) => {
      return offlineService.importOfflineSurveyResult(encryptedPayload, passphrase);
    });
  }

  // Student Mode (Kiosk)
  ipcMain.handle('studentMode:enter', async (_, assignmentRef: string) => {
    const data = surveyEngine.getAssignmentByRef(assignmentRef);
    if (!data) {
      return { success: false, error: 'Geçersiz anket referans kodu (PDR-XXXXXX)' };
    }

    surveyEngine.setStudentModeState({
      active: true,
      assignmentRef,
      surveyId: data.survey.id,
      studentId: data.student.id,
      studentName: `${data.student.firstName} ${data.student.lastName}`,
      surveyTitle: data.survey.title
    });

    return { success: true, data };
  });

  ipcMain.handle('studentMode:exit', async (_, password: string) => {
    const unlockRes = await authService.unlock({ password });
    if (!unlockRes.success) {
      return { success: false, error: 'Danışman parolası hatalı' };
    }

    surveyEngine.setStudentModeState({ active: false });
    return { success: true };
  });

  ipcMain.handle('studentMode:getState', async () => {
    return surveyEngine.getStudentModeState();
  });
}
