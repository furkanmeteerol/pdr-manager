import { ipcMain } from 'electron';
import { AnnualPlanService } from '../services/annual/AnnualPlanService';

export function registerAnnualPlanIpc(annualPlanService: AnnualPlanService): void {
  ipcMain.handle('annualPlans:get', async (_, schoolYearId?: string) => {
    return annualPlanService.getAnnualPlan(schoolYearId);
  });

  ipcMain.handle('annualPlans:createOrUpdate', async (_, data: any) => {
    return annualPlanService.createOrUpdatePlan(data);
  });

  ipcMain.handle('annualPlans:addItem', async (_, data: any) => {
    return annualPlanService.addItem(data);
  });

  ipcMain.handle('annualPlans:updateItem', async (_, id: string, data: any) => {
    return annualPlanService.updateItem(id, data);
  });

  ipcMain.handle('annualPlans:updateItemStatus', async (_, itemId: string, status: any) => {
    return annualPlanService.updateItemStatus(itemId, status);
  });

  ipcMain.handle('annualPlans:deleteItem', async (_, itemId: string) => {
    return annualPlanService.deleteItem(itemId);
  });
}
