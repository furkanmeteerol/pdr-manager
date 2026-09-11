import { ipcMain, dialog } from 'electron';
import { SurveyEngine } from '../services/surveys/SurveyEngine';
import { AuthService } from '../services/auth/AuthService';
import { OfflineSurveyPackageService } from '../services/surveys/OfflineSurveyPackageService';
import { MebPdfReportService } from '../services/reports/MebPdfReportService';
import { SurveyReportRegistry } from '../services/surveys/reports/SurveyReportRegistry';
import { SurveyPaperFormPdfReport } from '../services/surveys/reports/SurveyPaperFormPdfReport';
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

    // Helper to sanitize text to ASCII (replace Turkish chars with English equivalents and spaces with _)
    const toSafeAscii = (str: string): string => {
      const trMap: Record<string, string> = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'I': 'I', 'İ': 'I', 'i': 'i',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return str
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    };

    const safeStudentName = toSafeAscii(appDetail.studentName || 'Ogrenci');
    const safeStudentNumber = toSafeAscii(appDetail.studentNumber || '');

    let surveyPart = 'Raporu';
    let dialogTitle = 'Anket Sonuç Raporunu Kaydet';

    if (appDetail.surveySlug === 'westside-sinav-kaygisi-olcegi' || appDetail.surveyId === 'srv-westside-sinav-kaygisi-olcegi') {
      surveyPart = 'Westside_Sinav_Kaygisi_Olcegi_Raporu';
      dialogTitle = 'The Westside Sınav Kaygısı Ölçeği Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'sinav-kaygisi-olcegi' || appDetail.surveyId === 'srv-sinav-kaygisi-olcegi') {
      surveyPart = 'Sinav_Kaygisi_Olcegi_Raporu';
      dialogTitle = 'Sınav Kaygısı Ölçeği Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'meslek-degeri-envanteri' || appDetail.surveyId === 'srv-meslek-degeri-envanteri') {
      surveyPart = 'Meslek_Degeri_Envanteri_Raporu';
      dialogTitle = 'Meslek Değeri Envanteri Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'akademik-erteleme-olcegi' || appDetail.surveyId === 'srv-akademik-erteleme-olcegi') {
      surveyPart = 'Akademik_Erteleme_Olcegi_Raporu';
      dialogTitle = 'Akademik Erteleme Ölçeği Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'burdon-dikkat-testi' || appDetail.surveyId === 'srv-burdon-dikkat-testi') {
      surveyPart = 'Burdon_Dikkat_Testi_Raporu';
      dialogTitle = 'Burdon Dikkat Testi Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'otomatik-dusunceler-olcegi' || appDetail.surveyId === 'srv-otomatik-dusunceler-olcegi') {
      surveyPart = 'Otomatik_Dusunceler_Olcegi_Raporu';
      dialogTitle = 'Otomatik Düşünceler Ölçeği (ATQ-30) Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'basarisizlik-nedenleri-anketi' || appDetail.surveyId === 'srv-basarisizlik-nedenleri-anketi') {
      surveyPart = 'Basarisizlik_Nedenleri_Anketi_Raporu';
      dialogTitle = 'Başarısızlık Nedenleri Anketi Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'calisma-davranisini-degerlendirme-olcegi' || appDetail.surveyId === 'srv-calisma-davranisini-degerlendirme-olcegi') {
      surveyPart = 'Calisma_Davranisini_Degerlendirme_Olcegi_Raporu';
      dialogTitle = 'Çalışma Davranışını Değerlendirme Ölçeği Sonuç Raporunu Kaydet';
    } else if (appDetail.surveySlug === 'devamsizlik-nedenleri-anketi' || appDetail.surveyId === 'srv-devamsizlik-nedenleri') {
      surveyPart = 'Devamsizlik_Nedenleri_Raporu';
      dialogTitle = 'Devamsızlık Nedenleri Anketi Sonuç Raporunu Kaydet';
    } else {
      surveyPart = `${toSafeAscii(appDetail.surveyTitle || 'Anket')}_Raporu`;
      dialogTitle = `${appDetail.surveyTitle || 'Anket'} Sonuç Raporunu Kaydet`;
    }

    const defaultFileName = `${safeStudentName}_${safeStudentNumber ? safeStudentNumber + '_' : ''}${surveyPart}.pdf`;

    const saveRes = await dialog.showSaveDialog({
      title: dialogTitle,
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

  ipcMain.handle('surveys:getPaperFormHtml', async (_, surveySlugOrId: string) => {
    const surveyDetail = surveyEngine.getSurveyBySlug(surveySlugOrId) || surveyEngine.getSurveyById(surveySlugOrId);
    if (!surveyDetail) {
      return { success: false, error: 'Anket tanımı bulunamadı' };
    }
    const html = SurveyPaperFormPdfReport.generateHtml(surveyDetail);
    return { success: true, html };
  });

  ipcMain.handle('surveys:exportPaperFormPdf', async (_, surveySlugOrId: string) => {
    if (!mebPdfService) {
      return { success: false, error: 'PDF Rapor servisi başlatılamadı' };
    }
    const surveyDetail = surveyEngine.getSurveyBySlug(surveySlugOrId) || surveyEngine.getSurveyById(surveySlugOrId);
    if (!surveyDetail) {
      return { success: false, error: 'Anket tanımı bulunamadı' };
    }

    const html = SurveyPaperFormPdfReport.generateHtml(surveyDetail);
    const cleanTitle = (surveyDetail.title || 'Anket').normalize('NFC').trim();
    const defaultFileName = SurveyPaperFormPdfReport.formatFileName(cleanTitle);

    const saveRes = await dialog.showSaveDialog({
      title: `${cleanTitle} - Kağıt Anket Formunu Kaydet`,
      defaultPath: defaultFileName,
      filters: [
        { name: 'PDF Belgesi (*.pdf)', extensions: ['pdf'] },
        { name: 'Tüm Dosyalar', extensions: ['*'] }
      ]
    });

    if (saveRes.canceled || !saveRes.filePath) {
      return { success: false, canceled: true };
    }

    const targetPath = saveRes.filePath.normalize('NFC');
    const exportRes = await mebPdfService.exportHtmlToPdf(html, targetPath);
    return {
      success: exportRes.success,
      filePath: exportRes.filePath ? exportRes.filePath.normalize('NFC') : targetPath,
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
