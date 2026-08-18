import { ipcMain } from 'electron';
import { AcademicEngine } from '../services/academic/AcademicEngine';

export function registerExamIpc(academicEngine: AcademicEngine): void {
  ipcMain.handle('exams:list', async () => {
    return academicEngine.listExams();
  });

  ipcMain.handle('exams:getById', async (_, id: string) => {
    return academicEngine.getExamById(id);
  });

  ipcMain.handle('exams:create', async (_, data: any) => {
    return academicEngine.createExam(data);
  });

  ipcMain.handle('exams:getSubjects', async (_, examType?: string) => {
    return academicEngine.getSubjects(examType);
  });

  ipcMain.handle('exams:recordResult', async (_, data: any) => {
    return academicEngine.recordExamResult(data);
  });

  ipcMain.handle('exams:listResults', async (_, filter?: any) => {
    return academicEngine.listExamResults(filter);
  });

  // Targets
  ipcMain.handle('exams:getTargets', async (_, studentId?: string) => {
    return academicEngine.listTargets(studentId);
  });

  ipcMain.handle('exams:createTarget', async (_, data: any) => {
    return academicEngine.createTarget(data);
  });

  ipcMain.handle('exams:updateTargetStatus', async (_, id: string, status: any) => {
    return academicEngine.updateTargetStatus(id, status);
  });

  // Study Plans
  ipcMain.handle('exams:getStudyPlans', async (_, studentId?: string) => {
    return academicEngine.listStudyPlans(studentId);
  });

  ipcMain.handle('exams:createStudyPlan', async (_, data: any) => {
    return academicEngine.createStudyPlan(data);
  });

  ipcMain.handle('exams:updateStudyPlanItemStatus', async (_, itemId: string, status: any, completedQuestions?: number) => {
    return academicEngine.updateStudyPlanItemStatus(itemId, status, completedQuestions);
  });

  // Question Tracking
  ipcMain.handle('exams:getQuestionLogs', async (_, filter?: any) => {
    return academicEngine.listQuestionTracking(filter);
  });

  ipcMain.handle('exams:logQuestions', async (_, data: any) => {
    return academicEngine.logQuestions(data);
  });
}
