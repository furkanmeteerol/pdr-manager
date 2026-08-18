import { ipcMain } from 'electron';
import { SpecialEducationService } from '../services/special_education/SpecialEducationService';

export function registerSpecialEducationIpc(service: SpecialEducationService): void {
  // RAM Reports
  ipcMain.handle('specialEducation:createRamReport', async (_, dto) => service.createRamReport(dto));
  ipcMain.handle('specialEducation:updateRamReport', async (_, id, dto) => service.updateRamReport(id, dto));
  ipcMain.handle('specialEducation:deleteRamReport', async (_, id) => service.deleteRamReport(id));
  ipcMain.handle('specialEducation:getRamReportById', async (_, id) => service.getRamReportById(id));
  ipcMain.handle('specialEducation:listRamReportsByStudent', async (_, studentId) => service.listRamReportsByStudent(studentId));
  ipcMain.handle('specialEducation:listAllRamReports', async () => service.listAllRamReports());

  // BEP Plans
  ipcMain.handle('specialEducation:createBepPlan', async (_, dto) => service.createBepPlan(dto));
  ipcMain.handle('specialEducation:updateBepPlan', async (_, id, dto) => service.updateBepPlan(id, dto));
  ipcMain.handle('specialEducation:deleteBepPlan', async (_, id) => service.deleteBepPlan(id));
  ipcMain.handle('specialEducation:getBepPlanById', async (_, id) => service.getBepPlanById(id));
  ipcMain.handle('specialEducation:listBepPlansByStudent', async (_, studentId) => service.listBepPlansByStudent(studentId));
  ipcMain.handle('specialEducation:listAllBepPlans', async () => service.listAllBepPlans());

  // BEP Goals & Kazanım Takibi
  ipcMain.handle('specialEducation:addBepGoal', async (_, dto) => service.addBepGoal(dto));
  ipcMain.handle('specialEducation:updateBepGoal', async (_, id, dto) => service.updateBepGoal(id, dto));
  ipcMain.handle('specialEducation:updateGoalStatus', async (_, id, status, notes) => service.updateGoalStatus(id, status, notes));
  ipcMain.handle('specialEducation:deleteBepGoal', async (_, id) => service.deleteBepGoal(id));
  ipcMain.handle('specialEducation:listGoalsByPlanId', async (_, planId) => service.listGoalsByPlanId(planId));
  ipcMain.handle('specialEducation:listGoalsByStudentId', async (_, studentId) => service.listGoalsByStudentId(studentId));

  // BİP Plans
  ipcMain.handle('specialEducation:createBipPlan', async (_, dto) => service.createBipPlan(dto));
  ipcMain.handle('specialEducation:updateBipPlan', async (_, id, dto) => service.updateBipPlan(id, dto));
  ipcMain.handle('specialEducation:deleteBipPlan', async (_, id) => service.deleteBipPlan(id));
  ipcMain.handle('specialEducation:getBipPlanById', async (_, id) => service.getBipPlanById(id));
  ipcMain.handle('specialEducation:listBipPlansByStudent', async (_, studentId) => service.listBipPlansByStudent(studentId));
  ipcMain.handle('specialEducation:listAllBipPlans', async () => service.listAllBipPlans());

  // Development Evaluations
  ipcMain.handle('specialEducation:createEvaluation', async (_, dto) => service.createEvaluation(dto));
  ipcMain.handle('specialEducation:updateEvaluation', async (_, id, dto) => service.updateEvaluation(id, dto));
  ipcMain.handle('specialEducation:deleteEvaluation', async (_, id) => service.deleteEvaluation(id));
  ipcMain.handle('specialEducation:getEvaluationById', async (_, id) => service.getEvaluationById(id));
  ipcMain.handle('specialEducation:listEvaluationsByStudent', async (_, studentId) => service.listEvaluationsByStudent(studentId));
  ipcMain.handle('specialEducation:listAllEvaluations', async () => service.listAllEvaluations());

  // RAM Referrals
  ipcMain.handle('specialEducation:createReferral', async (_, dto) => service.createReferral(dto));
  ipcMain.handle('specialEducation:updateReferral', async (_, id, dto) => service.updateReferral(id, dto));
  ipcMain.handle('specialEducation:updateReferralStatus', async (_, id, status, resultNotes) => service.updateReferralStatus(id, status, resultNotes));
  ipcMain.handle('specialEducation:deleteReferral', async (_, id) => service.deleteReferral(id));
  ipcMain.handle('specialEducation:getReferralById', async (_, id) => service.getReferralById(id));
  ipcMain.handle('specialEducation:listReferralsByStudent', async (_, studentId) => service.listReferralsByStudent(studentId));
  ipcMain.handle('specialEducation:listAllReferrals', async () => service.listAllReferrals());
}
