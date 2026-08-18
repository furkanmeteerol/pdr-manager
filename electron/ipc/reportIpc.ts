import { ipcMain } from 'electron';
import { ReportService } from '../services/reports/ReportService';
import { MebPdfReportService } from '../services/reports/MebPdfReportService';

export function registerReportIpc(reportService: ReportService, mebPdfService?: MebPdfReportService): void {
  ipcMain.handle('reports:getSchoolAnalytics', async () => {
    return reportService.getSchoolAnalytics();
  });

  ipcMain.handle('reports:exportStudentsExcel', async () => {
    return reportService.exportStudentsCsv();
  });

  ipcMain.handle('reports:importStudentsExcel', async (_, dataBase64: string, schoolYearId: string) => {
    return reportService.importStudentsCsv(dataBase64, schoolYearId || 'default_year');
  });

  // MEB Official Report Generators
  if (mebPdfService) {
    ipcMain.handle('reports:getStudentGuidanceReportHtml', async (_, studentId: string) => {
      return mebPdfService.generateStudentGuidanceReportHtml(studentId);
    });

    ipcMain.handle('reports:getBepPlanReportHtml', async (_, bepPlanId: string) => {
      return mebPdfService.generateBepPlanReportHtml(bepPlanId);
    });

    ipcMain.handle('reports:getBipPlanReportHtml', async (_, bipPlanId: string) => {
      return mebPdfService.generateBipPlanReportHtml(bipPlanId);
    });

    ipcMain.handle('reports:getRamReferralReportHtml', async (_, referralId: string) => {
      return mebPdfService.generateRamReferralReportHtml(referralId);
    });

    ipcMain.handle('reports:exportHtmlToPdf', async (_, html: string, outputPath?: string) => {
      const res = await mebPdfService.exportHtmlToPdf(html, outputPath);
      if (res.success && res.pdfBuffer) {
        return { success: true, base64: res.pdfBuffer.toString('base64'), filePath: res.filePath };
      }
      return { success: false, error: res.error };
    });
  }
}

